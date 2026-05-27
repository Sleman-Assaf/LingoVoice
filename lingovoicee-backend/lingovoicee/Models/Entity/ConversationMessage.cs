using System.ComponentModel.DataAnnotations;

namespace lingovoicee.Models.Entity
{
    public class ConversationMessage
    {
        [Key]
        public int Id { get; set; }

        public int ConversationSessionId { get; set; }

        public ConversationSession ConversationSession { get; set; } = null!;

        // User أو Lingo
        public string Sender { get; set; } = string.Empty;

        public string Text { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}