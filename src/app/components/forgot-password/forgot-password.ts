import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html'
})
export class ForgotPasswordComponent {
  step = 1; // 1=email, 2=otp+newpassword
  email = '';
  otp = '';
  newPassword = '';
  loading = false;
  error = '';
  success = '';

  constructor(private http: HttpClient, private router: Router) {}

  sendOtp(): void {
    if (!this.email.trim()) return;
    this.loading = true;
    this.error = '';
    this.http.post<any>(`${environment.apiUrl}/api/auth/forgot-password`,
      { email: this.email }).subscribe({
      next: () => { this.loading = false; this.step = 2; },
      error: (err) => { this.loading = false; this.error = err.error?.error || 'Failed'; }
    });
  }

  resetPassword(): void {
    if (!this.otp.trim() || !this.newPassword.trim()) return;
    this.loading = true;
    this.error = '';
    this.http.post<any>(`${environment.apiUrl}/api/auth/reset-password`,
      { email: this.email, otp: this.otp, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Password reset! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => { this.loading = false; this.error = err.error?.error || 'Invalid OTP'; }
    });
  }
}