import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../CORE/services/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {

  registerData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onRegister(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.registerData.firstName ||
      !this.registerData.lastName ||
      !this.registerData.email ||
      !this.registerData.password ||
      !this.registerData.confirmPassword
    ) {
      this.errorMessage = 'Please fill all fields';
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    const requestBody = {
      firstName: this.registerData.firstName,
      lastName: this.registerData.lastName,
      email: this.registerData.email,
      hashedPassword: this.registerData.password
    };

    console.log('REGISTER BODY:', requestBody);

    this.loading = true;

    this.authService.register(requestBody).subscribe({
      next: (res: any) => {
        this.loading = false;

        alert('Account created Please go to log in page !');

        this.successMessage = 'تم التسجيل بنجاح، الرجاء تسجيل الدخول';
        this.errorMessage = '';

        this.registerData = {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        };

        // بدون تحويل على صفحة Login
      },
      error: (err: any) => {
        this.loading = false;

        console.log('Register Error:', err);

        this.errorMessage =
          err.error?.message ||
          err.error?.title ||
          err.error ||
          'فشل إنشاء الحساب، الرجاء المحاولة مرة أخرى';

        this.successMessage = '';
      }
    });
  }
}