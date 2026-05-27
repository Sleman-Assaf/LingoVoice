using Azure.Core;
using lingovoicee.Models;
using lingovoicee.Models.Entity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Management;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using static lingovoicee.Models.Entity.UserRegister;

namespace lingovoicee.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("Register")]
        public IActionResult Register([FromBody] UserRegister request)
        {
            if (request.FirstName == null)
                return BadRequest("FirstName is required");

            if (request.LastName == null)
                return BadRequest("LastName is required");

            if (request.Email == null)
                return BadRequest("Email is required");

            if (request.HashedPassword == null)
                return BadRequest("Password is required");

            var existingUser = _context.UserRegisters.FirstOrDefault(u => u.Email == request.Email);

            if (existingUser != null)
                return BadRequest("User Email Already exists");

            string HashedPassword = BCrypt.Net.BCrypt.HashPassword(request.HashedPassword);

            var user = new UserRegister
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                HashedPassword = HashedPassword,
                Role = "User"
            };

            _context.UserRegisters.Add(user);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Account created successfully"
            });
        }

        [HttpPost("LogIn")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            Console.WriteLine("Login request reached");
            Console.WriteLine("Email from request: " + request.Email);
            Console.WriteLine("Password from request: " + request.HashedPassword);

            var user = await _context.UserRegisters.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return BadRequest("Email or password is incorrect");
            }

            bool isPasswordCorrect = BCrypt.Net.BCrypt.Verify(request.HashedPassword, user.HashedPassword);

            if (!isPasswordCorrect)
            {
                return BadRequest("Email or password is incorrect");
            }

            // بنسوي توكن 
            string accessToken = CreateToken(user);
            string refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

            await _context.SaveChangesAsync();

            return Ok(new TokenResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            });
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            var user = await _context.UserRegisters
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return Unauthorized("Invalid user");
            }

            if (user.RefreshToken != request.RefreshToken)
            {
                return Unauthorized("Invalid refresh token");
            }

            if (user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                return Unauthorized("Refresh token expired");
            }

            string newAccessToken = CreateToken(user);
            string newRefreshToken = GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

            await _context.SaveChangesAsync();

            return Ok(new TokenResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            });
        }

        private string CreateToken(UserRegister user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.GivenName, user.FirstName),
                new Claim(ClaimTypes.Surname, user.LastName),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["AppSettings:Token"]!)
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new JwtSecurityToken(
                issuer: _configuration["AppSettings:Issuer"],
                audience: _configuration["AppSettings:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];

            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);

            return Convert.ToBase64String(randomNumber);
        }
    }
}