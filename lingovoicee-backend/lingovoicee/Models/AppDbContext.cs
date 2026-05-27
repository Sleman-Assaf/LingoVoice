using lingovoicee.Models.Entity;
using Microsoft.EntityFrameworkCore;

namespace lingovoicee.Models
{
    public class AppDbContext : DbContext
    {
        internal object Courses;

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<UserRegister> UserRegisters { get; set; }
        public DbSet<ContactUs> ContactUs { get; set; }

        public DbSet<ConversationSession> ConversationSessions { get; set; }
        public DbSet<ConversationMessage> ConversationMessages { get; set; }
        public DbSet<Course> Course { get; set; }
    }
}