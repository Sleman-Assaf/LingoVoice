import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactUsRequest {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactUsService {

  private apiUrl = 'https://localhost:7148/api/ContactUs/Submit';

  constructor(private http: HttpClient) {}

  submitContact(data: ContactUsRequest): Observable<any> {
    return this.http.post(this.apiUrl, data, {
      responseType: 'text' as 'json'
    });
  }
}