import { Component, ChangeDetectorRef } from '@angular/core';
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
  step = 1;
  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error = '';
  success = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  sendOtp(): void {
    if (!this.email.trim()) { this.error = 'Enter your email'; return; }
    this.loading = true;
    this.error = '';
    this.http.post<any>(
      `${environment.apiUrl}/api/auth/forgot-password`,
      { email: this.email.trim() }
    ).subscribe({
      next: () => {
        this.loading = false;
        this.step = 2;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Failed to send OTP';
        this.cdr.detectChanges();
      }
    });
  }

  resetPassword(): void {
    if (!this.otp.trim()) { this.error = 'Enter the OTP'; return; }
    if (this.newPassword.length < 6) { this.error = 'Password must be at least 6 characters'; return; }
    if (this.newPassword !== this.confirmPassword) { this.error = 'Passwords do not match'; return; }

    this.loading = true;
    this.error = '';
    this.http.post<any>(
      `${environment.apiUrl}/api/auth/reset-password`,
      { email: this.email.trim(), otp: this.otp.trim(), newPassword: this.newPassword }
    ).subscribe({
      next: () => {
        this.loading = false;
        this.success = '✅ Password reset successfully! Redirecting to login...';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Invalid or expired OTP';
        this.cdr.detectChanges();
      }
    });
  }
}