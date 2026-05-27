using lingovoicee.Models;
using lingovoicee.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace lingovoicee.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ConversationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ConversationPdfService _pdfService;

        public ConversationsController(AppDbContext context, ConversationPdfService pdfService)
        {
            _context = context;
            _pdfService = pdfService;
        }

        [HttpGet("{sessionId}/pdf")]
        public async Task<IActionResult> DownloadPdf(int sessionId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var session = await _context.ConversationSessions
                .Include(s => s.Messages)
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound("Conversation not found");

            var pdfBytes = _pdfService.GenerateConversationPdf(session);

            var fileName = $"lingovoice-session-{session.Id}.pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }

        [HttpGet("my-sessions")]
        public async Task<IActionResult> GetMySessions()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var sessions = await _context.ConversationSessions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.StartedAt)
                .Select(s => new
                {
                    s.Id,
                    s.StartedAt,
                    s.EndedAt,
                    s.TargetLanguage,
                    MessagesCount = s.Messages.Count
                })
                .ToListAsync();

            return Ok(sessions);
        }
    }
}