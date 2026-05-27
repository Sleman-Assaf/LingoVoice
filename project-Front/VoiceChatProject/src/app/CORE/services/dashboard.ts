import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface UsersSummaryResponse {
  totalUsers: number;
  users: DashboardUser[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
//لمعرفة المتخدمين و ارقامهم 
  private apiUrl = 'https://localhost:7148/api/Dashboard';

  constructor(private http: HttpClient) {}

  getUsersSummary(): Observable<UsersSummaryResponse> {
    return this.http.get<UsersSummaryResponse>(`${this.apiUrl}/users-summary`);
  }
}