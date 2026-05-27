using System.ComponentModel.DataAnnotations;

namespace lingovoicee.Models.Entity
{
    public class ContactUs
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string FirstName { get; set; } = string.Empty;
        [Required]
        public string LastName { get; set; } = string.Empty;
        [Required]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string Subject { get; set; } = string.Empty;
        [Required]

        public string Message { get; set; } = string.Empty;
    }
}
