# LingoVoice

LingoVoice is a full-stack language learning web application that helps users practice speaking a target language through an AI-powered voice chat experience.

The platform allows users to record their voice, send it to the backend, receive grammar/pronunciation corrections, and get an AI-generated spoken response. The system also includes authentication, contact form handling, admin dashboard features, course management, real-time communication, and conversation report generation.

## Project Overview

LingoVoice was built as a graduation-level full-stack project using Angular for the frontend and ASP.NET Core Web API for the backend.

The main goal of the project is to provide an interactive language learning assistant where users can practice conversations, improve their grammar, and receive helpful feedback in Arabic while continuing the conversation in the selected target language.

## Main Features

- User registration and login
- JWT authentication and authorization
- AI-powered voice conversation
- Speech-to-text processing
- Text-to-speech response generation
- Grammar and pronunciation correction
- Real-time communication using WebSocket
- Conversation sessions and message storage
- Downloadable PDF conversation reports
- Contact Us form with email service support
- Admin dashboard
- Course management system
- Protected admin endpoints
- Responsive Angular user interface

## Technologies Used

### Frontend

- Angular
- TypeScript
- HTML
- CSS
- Bootstrap
- Angular Routing
- Angular Services
- HTTP Interceptors
- Route Guards

### Backend

- ASP.NET Core Web API
- C#
- Entity Framework Core
- SQL Server
- JWT Authentication
- WebSocket
- RESTful APIs
- QuestPDF
- MailKit / MimeKit

### AI Integration

- Gemini API
- Speech-to-Text
- Text-to-Speech
- AI conversation response generation

## Project Structure

```text
LingoVoice/
│
├── project-Front/
│   └── VoiceChatProject/
│       ├── src/
│       ├── public/
│       ├── angular.json
│       ├── package.json
│       └── tsconfig.json
│
├── lingovoicee-backend/
│   ├── lingovoicee.sln
│   └── lingovoicee/
│       ├── Controllers/
│       ├── Models/
│       ├── Services/
│       ├── Migrations/
│       ├── Program.cs
│       ├── appsettings.json
│       └── lingovoicee.csproj
│
├── .gitignore
└── README.md


Backend Features

The backend provides APIs for:

Authentication and user management
Contact form submission
Course management
Admin dashboard statistics
Real-time WebSocket connection
Conversation sessions
Conversation PDF generation
Email sending service
AI voice conversation processing
Frontend Features

The frontend includes pages and components such as:

Home page
About Us page
Contact Us page
Login page
Signup page
Voice Chat page
Lingo Course page
Admin Dashboard
Unauthorized access page
Navbar and Footer components
How to Run the Backend
Open the backend folder:
cd lingovoicee-backend/lingovoicee
Restore packages:
dotnet restore
Update the database:
dotnet ef database update
Run the backend:
dotnet run

The backend will run using the local URL configured in launchSettings.json.

How to Run the Frontend
Open the frontend folder:
cd project-Front/VoiceChatProject
Install dependencies:
npm install
Run the Angular project:
ng serve
Open the application in the browser:
http://localhost:4200
Environment Configuration

Before running the project, update the backend configuration inside appsettings.json.

Do not upload real API keys, database passwords, JWT secrets, or email passwords to GitHub.

Use placeholder values in appsettings.json, such as:

{
  "ConnectionStrings": {
    "DefaultConnection": "YOUR_DATABASE_CONNECTION_STRING"
  },
  "AppSettings": {
    "Token": "YOUR_JWT_SECRET_TOKEN",
    "Issuer": "YOUR_ISSUER",
    "Audience": "YOUR_AUDIENCE"
  },
  "Gemini": {
    "ApiKey": "YOUR_GEMINI_API_KEY"
  },
  "EmailSettings": {
    "Email": "YOUR_EMAIL",
    "Password": "YOUR_EMAIL_APP_PASSWORD",
    "Host": "smtp.gmail.com",
    "Port": 587
  }
}
Important Security Notes
Do not commit real API keys.
Do not commit email passwords.
Do not commit private database connection strings.
Keep appsettings.Development.json ignored.
Use environment variables or local configuration for secrets.
If a secret was accidentally committed, revoke it and create a new one.
API Modules

The backend contains multiple controllers, including:

AuthController
ContactUsController
ConversationsController
CoursesController
DashboardController
RealtimeController

These controllers handle authentication, contact messages, course management, dashboard data, real-time chat, and conversation reporting.