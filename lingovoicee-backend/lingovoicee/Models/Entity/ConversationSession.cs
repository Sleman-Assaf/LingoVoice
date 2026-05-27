using System.ComponentModel.DataAnnotations;

namespace lingovoicee.Models.Entity
{
    public class ConversationSession
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        public string? TargetLanguage { get; set; }

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;

        public DateTime? EndedAt { get; set; }

        public ICollection<ConversationMessage> Messages { get; set; } = new List<ConversationMessage>();
    }
}