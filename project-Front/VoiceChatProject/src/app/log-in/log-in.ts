import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../CORE/services/auth';

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './log-in.html',
  styleUrl: './log-in.css',
})
export class LogIn {

  loginData = {
    email: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
    this.errorMessage = '';

    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please enter email and password';
      return;
    }

    this.loading = true;

    const requestBody = {
      email: this.loginData.email,
      hashedPassword: this.loginData.password
    };

    this.authService.login(requestBody).subscribe({
      next: (res: any) => {
        this.loading = false;

        console.log('LOGIN FULL RESPONSE:', res);

        const token = res.accessToken;
        const refreshToken = res.refreshToken;

        const decodedToken = this.decodeToken(token);

        console.log('DECODED TOKEN:', decodedToken);

        const firstName =
          decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || '';

        const lastName =
          decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] || '';

        const email =
          decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '';

        const role =
          decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);

        localStorage.setItem('user', JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          email: email,
          role: role
        }));

        console.log('USER SAVED:', {
          firstName,
          lastName,
          email,
          role
        });

        alert('تم تسجيل الدخول بنجاح');

        this.router.navigate(['/']);
      },
      error: (err: any) => {
        this.loading = false;

        console.log('Login Error:', err);

        this.errorMessage =
          err.error?.message ||
          err.error?.title ||
          err.error ||
          'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      }
    });
  }

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];

      const decodedPayload = atob(
        payload.replace(/-/g, '+').replace(/_/g, '/')
      );

      return JSON.parse(decodeURIComponent(escape(decodedPayload)));
    } catch (error) {
      console.log('Token decode error:', error);
      return {};
    }
  }
}