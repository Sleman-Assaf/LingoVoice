using lingovoicee.Models;
using lingovoicee.Models.Entity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lingovoicee.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactUsController : ControllerBase
    {
            private readonly AppDbContext _context;
        private readonly EmailService _emailService;

        public ContactUsController(AppDbContext context, EmailService emailService)
            {
                _context = context;
            _emailService = emailService;
        }
    
            [HttpPost("Submit")]
            public async Task<IActionResult> SubmitContactUsAsync([FromBody] ContactUs request)
            {
                if (request.FirstName == null)
                    return BadRequest("FirstName is required");
                if (request.LastName == null)
                    return BadRequest("LastName is required");
                if (request.Email == null)
                    return BadRequest("Email is required");
                if (request.Subject == null)
                    return BadRequest("Subject is required");
                if (request.Message == null)
                    return BadRequest("Message is required");
    
                var contactUsEntry = new ContactUs
                {
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    Subject = request.Subject,
                    Message = request.Message
                };
    
                _context.ContactUs.Add(contactUsEntry);
                _context.SaveChanges();



            var contactMessage = await _context.ContactUs
      .OrderByDescending(c => c.Id)
      .FirstOrDefaultAsync();

            if (contactMessage == null)
            {
                return NotFound("No messages found");
            }

            await _emailService.SendContactMessageToAdminAsync(contactMessage);

            return Ok(" message sent to Us successfully");





            
        }


      


    }
}
