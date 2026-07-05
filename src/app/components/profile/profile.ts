import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html'
})
export class ProfileComponent implements OnInit {
  username = '';
  newUsername = '';
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error = '';
  success = '';
  private API = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername() || '';
    this.newUsername = this.username;
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  changeUsername(): void {
    if (!this.newUsername.trim() || !this.oldPassword.trim()) {
      this.error = 'Please fill all fields'; return;
    }
    this.loading = true; this.error = ''; this.success = '';
    this.http.post<any>(`${this.API}/api/auth/change-username`,
      { newUsername: this.newUsername, password: this.oldPassword },
      { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.authService.saveSession(this.authService.getToken()!, this.newUsername);
        this.username = this.newUsername;
        this.loading = false;
        this.success = 'Username updated successfully!';
      },
      error: (err) => { this.loading = false; this.error = err.error?.error || 'Failed'; }
    });
  }

  changePassword(): void {
    if (!this.oldPassword.trim() || !this.newPassword.trim()) {
      this.error = 'Please fill all fields'; return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match'; return;
    }
    this.loading = true; this.error = ''; this.success = '';
    this.http.post<any>(`${this.API}/api/auth/change-password`,
      { oldPassword: this.oldPassword, newPassword: this.newPassword },
      { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Password changed successfully!';
        this.oldPassword = ''; this.newPassword = ''; this.confirmPassword = '';
      },
      error: (err) => { this.loading = false; this.error = err.error?.error || 'Failed'; }
    });
  }

  goBack(): void { this.router.navigate(['/rooms']); }
}