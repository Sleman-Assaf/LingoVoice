import { Routes } from '@angular/router';
import { Home } from './home/home';
import { VoiceChat } from './voice-chat/voice-chat';
import { AboutUs } from './about-us/about-us';
import { ContactUs } from './contact-us/contact-us';
import { LogIn } from './log-in/log-in';
import { Signup } from './signup/signup';
import { authGuard } from './CORE/guards/auth-guard';
import { Unauthorized } from './unauthorized/unauthorized';
import { LingoCourse } from './lingo-course/lingo-course';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';

export const routes: Routes = [

{path : '' , component : Home},
{path:'VoiceChat',component:VoiceChat, canActivate: [authGuard]}, 
{path:'AboutUs',component:AboutUs},
{path:'ContactUs',component:ContactUs},
{path:'LogIn',component:LogIn},
{path:'SignUp',component:Signup},
  { path: 'unauthorized', component: Unauthorized },
   {
    path: 'lingo-course',
    component: LingoCourse,  canActivate: [authGuard]
  },
 {
    path: 'dashboard',
    component: AdminDashboard
  },


];
