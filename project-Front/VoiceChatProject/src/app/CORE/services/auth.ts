import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'https://localhost:7148/api/auth';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  register(data: any) {
    return this.http.post(`${this.baseUrl}/Register`, data, {
      responseType: 'text'
    });
  }

  login(data: any) {
    console.log('Login URL:', `${this.baseUrl}/LogIn`);
    console.log('Login Body:', data);

    return this.http.post(`${this.baseUrl}/LogIn`, data);
  }

  logout(): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    return !!localStorage.getItem('token');
  }

  getUser(): any {
    if (!this.isBrowser()) {
      return null;
    }

    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getUserName(): string {
    const user = this.getUser();

    return (
      user?.firstName ||
      user?.FirstName ||
      user?.name ||
      user?.Name ||
      user?.email ||
      user?.Email ||
      ''
    );
  }

  getUserRole(): string {
    const user = this.getUser();

    return (
      user?.role ||
      user?.Role ||
      ''
    );
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'Admin';
  }

  getToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    return localStorage.getItem('token');
  }
}