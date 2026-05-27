using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using lingovoicee.Models;
using lingovoicee.Models.Entity;

namespace lingovoicee.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RealtimeController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public RealtimeController(IConfiguration configuration, AppDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        [Authorize]
        [HttpGet("ws")]
        public async Task ConnectWebSocket()
        {
            if (!HttpContext.WebSockets.IsWebSocketRequest)
            {
                HttpContext.Response.StatusCode = 400;
                return;
            }

            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("nameid")?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim))
            {
                HttpContext.Response.StatusCode = 401;
                return;
            }

            if (!int.TryParse(userIdClaim, out int userId))
            {
                HttpContext.Response.StatusCode = 401;
                return;
            }

            var clientSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
            await HandleSession(clientSocket, userId);
        }

        private async Task HandleSession(WebSocket clientSocket, int userId)
        {
            var conversation = new ConversationSession
            {
                UserId = userId,
                StartedAt = DateTime.UtcNow
            };

            _context.ConversationSessions.Add(conversation);
            await _context.SaveChangesAsync();

            Console.WriteLine($"Conversation started: {conversation.Id}");

            await SendSessionStartedToClient(clientSocket, conversation.Id);

            var apiKey = _configuration["OpenAI:ApiKey"];

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                Console.WriteLine("OpenAI API Key is missing.");

                if (clientSocket.State == WebSocketState.Open)
                {
                    await clientSocket.CloseAsync(
                        WebSocketCloseStatus.InternalServerError,
                        "OpenAI API Key is missing",
                        CancellationToken.None
                    );
                }

                return;
            }

            Console.WriteLine($"API Key starts with: {apiKey[..Math.Min(10, apiKey.Length)]}...");

            try
            {
                using var openAiSocket = new ClientWebSocket();

                openAiSocket.Options.SetRequestHeader("Authorization", $"Bearer {apiKey}");
                openAiSocket.Options.SetRequestHeader("OpenAI-Beta", "realtime=v1");

                var url = "wss://api.openai.com/v1/realtime?model=gpt-realtime-1.5";

                await openAiSocket.ConnectAsync(new Uri(url), CancellationToken.None);
                Console.WriteLine("Connected to OpenAI");

                await WaitForSessionCreated(openAiSocket);
                Console.WriteLine("Session created");

                await SendSessionUpdate(openAiSocket);
                Console.WriteLine("Session updated");

                await SendOpeningMessage(openAiSocket);
                Console.WriteLine("Opening message sent");

                var clientToOpenAi = ForwardMessages(
                    clientSocket,
                    openAiSocket,
                    "Client→OpenAI",
                    conversation.Id
                );

                var openAiToClient = ForwardMessages(
                    openAiSocket,
                    clientSocket,
                    "OpenAI→Client",
                    conversation.Id
                );

                await Task.WhenAny(clientToOpenAi, openAiToClient);

                Console.WriteLine("One direction closed");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"HandleSession Error: {ex.Message}");

                if (clientSocket.State == WebSocketState.Open)
                {
                    await clientSocket.CloseAsync(
                        WebSocketCloseStatus.InternalServerError,
                        "Server error while handling session",
                        CancellationToken.None
                    );
                }
            }
            finally
            {
                conversation.EndedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                Console.WriteLine($"Conversation ended: {conversation.Id}");

                if (clientSocket.State == WebSocketState.Open)
                {
                    await clientSocket.CloseAsync(
                        WebSocketCloseStatus.NormalClosure,
                        "Session ended",
                        CancellationToken.None
                    );
                }
            }
        }

        private async Task SendSessionStartedToClient(WebSocket clientSocket, int sessionId)
        {
            if (clientSocket.State != WebSocketState.Open)
                return;

            var sessionInfo = new
            {
                type = "conversation.session.started",
                sessionId = sessionId
            };

            var json = JsonSerializer.Serialize(sessionInfo);
            var bytes = Encoding.UTF8.GetBytes(json);

            await clientSocket.SendAsync(
                new ArraySegment<byte>(bytes),
                WebSocketMessageType.Text,
                true,
                CancellationToken.None
            );
        }

        private async Task WaitForSessionCreated(ClientWebSocket socket)
        {
            var buffer = new byte[1024 * 8];

            while (socket.State == WebSocketState.Open)
            {
                var result = await socket.ReceiveAsync(
                    new ArraySegment<byte>(buffer),
                    CancellationToken.None
                );

                if (result.MessageType == WebSocketMessageType.Close)
                    break;

                var msg = Encoding.UTF8.GetString(buffer, 0, result.Count);

                Console.WriteLine($"{msg[..Math.Min(200, msg.Length)]}");

                if (msg.Contains("session.created"))
                    break;
            }
        }

        private async Task SendSessionUpdate(ClientWebSocket socket)
        {
            var sessionUpdate = new
            {
                type = "session.update",
                session = new
                {
                    modalities = new[] { "audio", "text" },
                    voice = "cedar",

                    input_audio_format = "pcm16",
                    output_audio_format = "pcm16",

                    input_audio_transcription = new
                    {
                        model = "gpt-4o-mini-transcribe",
                        language = "ar",
                        prompt = "The speaker may use Jordanian Arabic and simple English. Transcribe exactly what is said. Do not guess missing words."
                    },

                    input_audio_noise_reduction = new
                    {
                        type = "near_field"
                    },

                    turn_detection = new
                    {
                        type = "semantic_vad",
                        eagerness = "low",
                        create_response = true,
                        interrupt_response = false
                    },

                    instructions =
                        "أنت لينغو، مدرس لغات ذكي وودود ومرح.\n\n" +

                        "شخصيتك:\n" +
                        "- لطيف، مشجع، طبيعي، وخفيف دم بدون مبالغة.\n" +
                        "- عندما تستخدم العربية، استخدم لهجة أردنية خفيفة وواضحة.\n" +
                        "- تكلم بالعربية بوضوح شديد وبسرعة أبطأ قليلًا.\n" +
                        "- اجعل نطق العربية واضحًا وسهل السماع.\n\n" +

                        "هدفك:\n" +
                        "- تساعد المستخدم على تعلم وممارسة اللغة من خلال محادثة صوتية طبيعية.\n" +
                        "- تحافظ على الحوار واضحًا وسلسًا.\n" +
                        "- لا تخمّن أبدًا ما قاله المستخدم إذا لم تكن متأكدًا.\n\n" +

                        "بداية المحادثة:\n" +
                        "- في أول رسالة فقط قل: أهلاً! أنا لينغو 😄 شو اللغة اللي بدك تتعلمها اليوم؟\n" +
                        "- بعد ذلك انتظر حتى يختار المستخدم اللغة.\n" +
                        "- لا تبدأ الدرس قبل أن يحدد اللغة.\n\n" +

                        "بعد اختيار اللغة:\n" +
                        "- اجعل المحادثة الأساسية باللغة التي اختارها المستخدم.\n" +
                        "- اسأل سؤالًا واحدًا فقط في كل مرة.\n" +
                        "- لا تعطِ عدة أسئلة أو عدة أفكار في نفس الرد.\n" +
                        "- حافظ على محادثة طبيعية ومريحة.\n\n" +

                        "قاعدة مهمة جدًا:\n" +
                        "- إذا كان كلام المستخدم غير واضح، أو ناقص، أو يبدو خارج السياق، أو لم تكن متأكدًا مما قاله:\n" +
                        "  لا تخمّن، ولا تعيد صياغة شيء غير متأكد منه، ولا تنسب للمستخدم كلامًا لم يقله.\n" +
                        "- بدل ذلك، اطلب منه بلطف أن يعيد الكلام أو يوضحه.\n" +
                        "- استخدم ردودًا قصيرة مثل:\n" +
                        "  معلش، ما فهمت هالجزء منيح 😅 ممكن تعيده؟\n" +
                        "  أو: ممكن تحكيها مرة ثانية بشكل أوضح؟\n\n" +

                        "ممنوعات:\n" +
                        "- ممنوع اختراع كلمات أو جمل ونسبها للمستخدم.\n" +
                        "- ممنوع الرد على شيء لم يقله المستخدم بوضوح.\n" +
                        "- ممنوع تكملة الجملة من عندك إذا كان الصوت غير واضح.\n" +
                        "- إذا لم تكن متأكدًا بنسبة عالية من كلام المستخدم، اعتبره غير واضح واطلب الإعادة.\n\n" +

                        "التصحيح:\n" +
                        "- إذا أخطأ المستخدم، صححه بلطف بالعربي داخل قوسين.\n" +
                        "- اجعل التصحيح قصيرًا جدًا وواضحًا وسهل السماع.\n" +
                        "- بعد التصحيح مباشرة، أكمل الحديث باللغة المختارة.\n" +
                        "- ركز على أهم خطأ فقط أو أهم خطأين.\n" +
                        "- لا تصحح كل تفصيل صغير بشكل مزعج.\n\n" +

                        "شكل التصحيح:\n" +
                        "- استخدم تصحيحًا قصيرًا مثل:\n" +
                        "  (تصحيح: الأفضل تقول I went 😊)\n" +
                        "- إذا احتاج الأمر شرحًا، اجعله قصيرًا جدًا وبالعربي الواضح.\n\n" +

                        "أسلوب الرد:\n" +
                        "- ردودك غالبًا قصيرة: جملة أو جملتان.\n" +
                        "- إذا احتاج السياق، مسموح أن توضح أكثر قليلًا لكن بدون إطالة.\n" +
                        "- كن ذكيًا وطبيعيًا، وليس آليًا أو جامدًا.\n" +
                        "- امدح المستخدم عندما يجاوب بشكل جيد.\n" +
                        "- إذا كان مبتدئًا، استخدم كلمات سهلة وجمل قصيرة.\n" +
                        "- إذا كان مستواه أفضل، ارفع المستوى تدريجيًا.\n\n" +

                        "الحدود:\n" +
                        "- التزم فقط بمواضيع تعلم اللغات، مثل: المحادثة، المفردات، القواعد، التصحيح، والتدريب.\n" +
                        "- إذا حاول المستخدم تغيير الموضوع، قل: هههه مش رح ينفع 😄 خلينا نرجع للدرس.\n\n" +

                        "مهم:\n" +
                        "- العربية تستخدم فقط في:\n" +
                        "  1) أول سؤال\n" +
                        "  2) التصحيح\n" +
                        "  3) الشرح القصير عند الطلب\n" +
                        "  4) طلب إعادة الكلام إذا لم يكن واضحًا\n" +
                        "- أما المحادثة الأساسية فتكون باللغة التي اختارها المستخدم."
                }
            };

            await SendMessage(socket, sessionUpdate);
        }

        private async Task SendOpeningMessage(ClientWebSocket socket)
        {
            var message = new
            {
                type = "conversation.item.create",
                item = new
                {
                    type = "message",
                    role = "user",
                    content = new[]
                    {
                        new { type = "input_text", text = "ابدأ المحادثة" }
                    }
                }
            };

            await SendMessage(socket, message);

            var response = new
            {
                type = "response.create"
            };

            await SendMessage(socket, response);
        }

        private async Task SendMessage(ClientWebSocket socket, object message)
        {
            var json = JsonSerializer.Serialize(message);
            var bytes = Encoding.UTF8.GetBytes(json);

            await socket.SendAsync(
                new ArraySegment<byte>(bytes),
                WebSocketMessageType.Text,
                true,
                CancellationToken.None
            );
        }

        private async Task ForwardMessages(
            WebSocket source,
            WebSocket destination,
            string direction,
            int conversationId)
        {
            var buffer = new byte[1024 * 64];

            try
            {
                while (source.State == WebSocketState.Open && destination.State == WebSocketState.Open)
                {
                    var result = await source.ReceiveAsync(
                        new ArraySegment<byte>(buffer),
                        CancellationToken.None
                    );

                    if (result.MessageType == WebSocketMessageType.Close)
                        break;

                    var msg = Encoding.UTF8.GetString(buffer, 0, result.Count);

                    Console.WriteLine($"{direction}: {msg[..Math.Min(150, msg.Length)]}");

                    await TrySaveTranscriptEvent(msg, direction, conversationId);

                    await destination.SendAsync(
                        new ArraySegment<byte>(buffer, 0, result.Count),
                        result.MessageType,
                        result.EndOfMessage,
                        CancellationToken.None
                    );
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"{direction} Error: {ex.Message}");
            }
        }

        private async Task TrySaveTranscriptEvent(string json, string direction, int conversationId)
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (!root.TryGetProperty("type", out var typeElement))
                    return;

                var eventType = typeElement.GetString();

                if (string.IsNullOrWhiteSpace(eventType))
                    return;

                if (eventType == "conversation.item.input_audio_transcription.completed")
                {
                    if (root.TryGetProperty("transcript", out var transcriptElement))
                    {
                        var transcript = transcriptElement.GetString();

                        if (!string.IsNullOrWhiteSpace(transcript))
                        {
                            _context.ConversationMessages.Add(new ConversationMessage
                            {
                                ConversationSessionId = conversationId,
                                Sender = "User",
                                Text = transcript,
                                CreatedAt = DateTime.UtcNow
                            });

                            await _context.SaveChangesAsync();

                            Console.WriteLine($"Saved User transcript: {transcript}");
                        }
                    }
                }

                if (eventType == "response.audio_transcript.done")
                {
                    if (root.TryGetProperty("transcript", out var transcriptElement))
                    {
                        var transcript = transcriptElement.GetString();

                        if (!string.IsNullOrWhiteSpace(transcript))
                        {
                            _context.ConversationMessages.Add(new ConversationMessage
                            {
                                ConversationSessionId = conversationId,
                                Sender = "Lingo",
                                Text = transcript,
                                CreatedAt = DateTime.UtcNow
                            });

                            await _context.SaveChangesAsync();

                            Console.WriteLine($"Saved Lingo transcript: {transcript}");
                        }
                    }
                }
            }
            catch
            {
                // بعض رسائل WebSocket مش transcript، لذلك نتجاهلها
            }
        }
    }
}