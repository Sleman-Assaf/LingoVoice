using System.ComponentModel.DataAnnotations;

namespace lingovoicee.Models.Entity
{
    public class UserRegister
    {
        [Key]
        public int Id { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        [MaxLength(255)]
        public string HashedPassword { get; set; } = string.Empty;

        public string Role { get; set; } = "User";

        public string? RefreshToken { get; set; }

        public DateTime? RefreshTokenExpiryTime { get; set; }

        public class TokenResponseDto
        {
            public string AccessToken { get; set; } = string.Empty;
            public string RefreshToken { get; set; } = string.Empty;
        }

        public class RefreshTokenRequestDto
        {
            public string Email { get; set; } = string.Empty;
            public string RefreshToken { get; set; } = string.Empty;
        }
    }
}