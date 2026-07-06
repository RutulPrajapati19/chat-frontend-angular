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
  email = '';
  memberSince = '';
  loading = true;

  newUsername = '';
  usernameError = '';
  usernameSuccess = '';
  savingUsername = false;

  newEmail = '';
  emailError = '';
  emailSuccess = '';
  savingEmail = false;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  passwordSuccess = '';
  savingPassword = false;

  private API = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  loadProfile(): void {
    this.loading = true;
    this.http.get<any>(`${this.API}/api/users/me`, { headers: this.headers() })
      .subscribe({
        next: (p) => {
          this.username = p.username;
          this.newUsername = p.username;
          this.email = p.email;
          this.newEmail = p.email;
          this.memberSince = p.createdAt
            ? new Date(p.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric'
              })
            : '';
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  saveUsername(): void {
    this.usernameError = '';
    this.usernameSuccess = '';
    if (!this.newUsername.trim()) {
      this.usernameError = 'Username cannot be empty.'; return;
    }
    if (this.newUsername.trim() === this.username) {
      this.usernameError = 'That is already your username.'; return;
    }
    if (this.newUsername.trim().length < 3) {
      this.usernameError = 'Username must be at least 3 characters.'; return;
    }
    this.savingUsername = true;

    this.http.post<any>(
      `${this.API}/api/users/change-username`,
      { username: this.newUsername.trim() },
      { headers: this.headers() }
    ).subscribe({
      next: (res) => {
        this.savingUsername = false;
        this.usernameSuccess = 'Username updated. Redirecting...';
        this.authService.saveSession(res.token, res.username);
        setTimeout(() => this.router.navigate(['/rooms']), 1500);
      },
      error: (err) => {
        this.savingUsername = false;
        this.usernameError = err?.error?.error || 'Could not update username.';
      }
    });
  }

  saveEmail(): void {
    this.emailError = '';
    this.emailSuccess = '';
    if (!this.newEmail.trim()) {
      this.emailError = 'Email cannot be empty.'; return;
    }
    if (this.newEmail.trim() === this.email) {
      this.emailError = 'That is already your email.'; return;
    }
    if (!this.newEmail.includes('@')) {
      this.emailError = 'Enter a valid email address.'; return;
    }
    this.savingEmail = true;

    this.http.put<any>(
      `${this.API}/api/users/me`,
      { email: this.newEmail.trim() },
      { headers: this.headers() }
    ).subscribe({
      next: (res) => {
        this.savingEmail = false;
        this.email = res.email;
        this.newEmail = res.email;
        this.emailSuccess = 'Email updated successfully.';
      },
      error: (err) => {
        this.savingEmail = false;
        this.emailError = err?.error?.error || 'Could not update email.';
      }
    });
  }

  savePassword(): void {
    this.passwordError = '';
    this.passwordSuccess = '';
    if (!this.currentPassword) {
      this.passwordError = 'Enter your current password.'; return;
    }
    if (!this.newPassword) {
      this.passwordError = 'Enter a new password.'; return;
    }
    if (this.newPassword.length < 6) {
      this.passwordError = 'New password must be at least 6 characters.'; return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'New passwords do not match.'; return;
    }
    if (this.newPassword === this.currentPassword) {
      this.passwordError = 'New password must be different from current.'; return;
    }
    this.savingPassword = true;

    this.http.post<any>(
      `${this.API}/api/users/change-password`,
      { currentPassword: this.currentPassword, newPassword: this.newPassword },
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordSuccess = 'Password changed successfully.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.savingPassword = false;
        this.passwordError = err?.error?.error || 'Could not change password.';
      }
    });
  }

  goBack(): void { this.router.navigate(['/rooms']); }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}