import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactUsService, ContactUsRequest } from '../CORE/services/contact-us';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css'
})
export class ContactUs {

  contactData: ContactUsRequest = {
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
  };

  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private contactUsService: ContactUsService) {}

  submitContact(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (
      !this.contactData.firstName.trim() ||
      !this.contactData.lastName.trim() ||
      !this.contactData.email.trim() ||
      !this.contactData.subject.trim() ||
      !this.contactData.message.trim()
    ) {
      this.errorMessage = 'Please fill all fields';
      return;
    }

    this.loading = true;

    this.contactUsService.submitContact(this.contactData).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = 'Message sent successfully';
        this.errorMessage = '';

        this.contactData = {
          firstName: '',
          lastName: '',
          email: '',
          subject: '',
          message: ''
        };

        console.log('CONTACT SUCCESS:', res);
      },
      error: (err) => {
        this.loading = false;

        console.log('CONTACT ERROR:', err);

        if (err.status === 0) {
          this.errorMessage = 'Cannot connect to server';
        } else if (err.status === 400) {
          this.errorMessage = 'Please check your information';
        } else {
          this.errorMessage = 'Failed to send message';
        }
      }
    });
  }
}