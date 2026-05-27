using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using lingovoicee.Models;

namespace lingovoicee.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("users-summary")]
        public async Task<IActionResult> GetUsersSummary()
        {
            var users = await _context.UserRegisters
                .Select(u => new
                {
                    id = u.Id,
                    firstName = u.FirstName,
                    lastName = u.LastName,
                    email = u.Email
                })
                .ToListAsync();

            return Ok(new
            {
                totalUsers = users.Count,
                users = users
            });
        }
    }
}