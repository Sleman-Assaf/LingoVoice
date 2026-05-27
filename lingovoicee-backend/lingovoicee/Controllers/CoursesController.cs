using lingovoicee.Models;
using lingovoicee.Models.Entity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lingovoicee.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CoursesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CoursesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCourses()
        {
            var courses = await _context.Course
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(courses);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCourseById(int id)
        {
            var course = await _context.Course.FindAsync(id);

            if (course == null)
            {
                return NotFound("Course not found");
            }

            return Ok(course);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> AddCourse([FromBody] Course course)
        {
            if (string.IsNullOrWhiteSpace(course.Title))
            {
                return BadRequest("Course title is required");
            }

            if (string.IsNullOrWhiteSpace(course.Language))
            {
                return BadRequest("Course language is required");
            }

            course.CreatedAt = DateTime.UtcNow;

            _context.Course.Add(course);
            await _context.SaveChangesAsync();

            return Ok(course);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCourse(int id, [FromBody] Course request)
        {
            var course = await _context.Course.FindAsync(id);

            if (course == null)
            {
                return NotFound("Course not found");
            }

            course.Title = request.Title;
            course.Language = request.Language;
            course.Level = request.Level;
            course.Description = request.Description;
            course.ImageUrl = request.ImageUrl;
            course.LessonsCount = request.LessonsCount;
            course.IsPublished = request.IsPublished;

            await _context.SaveChangesAsync();

            return Ok(course);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _context.Course.FindAsync(id);

            if (course == null)
            {
                return NotFound("Course not found");
            }

            _context.Course.Remove(course);
            await _context.SaveChangesAsync();

            return Ok("Course deleted successfully");
        }
    }
}