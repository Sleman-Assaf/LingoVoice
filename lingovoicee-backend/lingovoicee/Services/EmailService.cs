
using lingovoicee.Models.Entity;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;

using MimeKit;
using System.Net.Mail;

public class EmailService
{
    private readonly EmailSettings _emailSettings;

    public EmailService(IOptions<EmailSettings> emailSettings)
    {
        _emailSettings = emailSettings.Value;
    }

    public async Task SendContactMessageToAdminAsync(ContactUs contact)
    {
        var email = new MimeMessage();

        email.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
        email.To.Add(MailboxAddress.Parse(_emailSettings.AdminEmail));

        email.Subject = $"New Contact Message: {contact.Subject}";

        email.Body = new TextPart("plain")
        {
            Text =
$@"You have received a new contact message.

First Name: {contact.FirstName}
Last Name: {contact.LastName}
Email: {contact.Email}
Subject: {contact.Subject}

Message:
{contact.Message}"
        };

        using var smtp = new MailKit.Net.Smtp.SmtpClient();
     

        await smtp.ConnectAsync(_emailSettings.Host, _emailSettings.Port, SecureSocketOptions.StartTls);
        await smtp.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
        await smtp.SendAsync(email);
        await smtp.DisconnectAsync(true);
    }
}