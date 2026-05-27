namespace lingovoicee.Models.Entity
{
    public class LoginRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string HashedPassword { get; set; } = string.Empty;
    }
}
