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
 
  // Profile data
  username = '';
  email = '';
  memberSince = '';
  loading = true;
 
  // Which section is being edited
  activeSection: 'none' | 'username' | 'email' | 'password' = 'none';
 
  // Username form
  newUsername = '';
  usernameMsg = '';
  usernameError = false;
  savingUsername = false;
 
  // Email form
  newEmail = '';
  emailMsg = '';
  emailError = false;
  savingEmail = false;
 
  // Password form
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordMsg = '';
  passwordError = false;
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
 
  private h(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }
 
  loadProfile(): void {
    this.loading = true;
    this.http.get<any>(`${this.API}/api/users/me`, { headers: this.h() }).subscribe({
      next: (p) => {
        this.username = p.username;
        this.email = p.email;
        this.newUsername = p.username;
        this.newEmail = p.email;
        this.memberSince = p.createdAt
          ? new Date(p.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
          : '';
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
 
  openSection(section: 'username' | 'email' | 'password'): void {
    this.activeSection = this.activeSection === section ? 'none' : section;
    this.clearMessages();
  }
 
  clearMessages(): void {
    this.usernameMsg = ''; this.usernameError = false;
    this.emailMsg = ''; this.emailError = false;
    this.passwordMsg = ''; this.passwordError = false;
  }
 
  saveUsername(): void {
    this.usernameMsg = ''; this.usernameError = false;
    const val = this.newUsername.trim();
    if (!val) { this.usernameMsg = 'Username cannot be empty.'; this.usernameError = true; return; }
    if (val.length < 3) { this.usernameMsg = 'At least 3 characters.'; this.usernameError = true; return; }
    if (val === this.username) { this.usernameMsg = 'Same as current username.'; this.usernameError = true; return; }
 
    this.savingUsername = true;
    this.http.post<any>(`${this.API}/api/users/change-username`, { username: val }, { headers: this.h() })
      .subscribe({
        next: (res) => {
          this.savingUsername = false;
          this.username = res.username;
          this.newUsername = res.username;
          this.authService.saveSession(res.token, res.username);
          this.usernameMsg = 'Username updated successfully!';
          this.usernameError = false;
          this.activeSection = 'none';
        },
        error: (err) => {
          this.savingUsername = false;
          this.usernameMsg = err?.error?.error || 'Could not update username.';
          this.usernameError = true;
        }
      });
  }
 
  saveEmail(): void {
    this.emailMsg = ''; this.emailError = false;
    const val = this.newEmail.trim().toLowerCase();
    if (!val || !val.includes('@')) { this.emailMsg = 'Enter a valid email.'; this.emailError = true; return; }
    if (val === this.email) { this.emailMsg = 'Same as current email.'; this.emailError = true; return; }
 
    this.savingEmail = true;
    this.http.post<any>(`${this.API}/api/users/change-email`, { email: val }, { headers: this.h() })
      .subscribe({
        next: (res) => {
          this.savingEmail = false;
          this.email = res.email;
          this.newEmail = res.email;
          this.emailMsg = 'Email updated successfully!';
          this.emailError = false;
          this.activeSection = 'none';
        },
        error: (err) => {
          this.savingEmail = false;
          this.emailMsg = err?.error?.error || 'Could not update email.';
          this.emailError = true;
        }
      });
  }
 
  savePassword(): void {
    this.passwordMsg = ''; this.passwordError = false;
    if (!this.currentPassword) { this.passwordMsg = 'Enter your current password.'; this.passwordError = true; return; }
    if (this.newPassword.length < 6) { this.passwordMsg = 'Min 6 characters.'; this.passwordError = true; return; }
    if (this.newPassword !== this.confirmPassword) { this.passwordMsg = 'Passwords do not match.'; this.passwordError = true; return; }
    if (this.newPassword === this.currentPassword) { this.passwordMsg = 'New password must be different.'; this.passwordError = true; return; }
 
    this.savingPassword = true;
    this.http.post<any>(
      `${this.API}/api/users/change-password`,
      { currentPassword: this.currentPassword, newPassword: this.newPassword },
      { headers: this.h() }
    ).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordMsg = 'Password changed successfully!';
        this.passwordError = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.activeSection = 'none';
      },
      error: (err) => {
        this.savingPassword = false;
        this.passwordMsg = err?.error?.error || 'Could not change password.';
        this.passwordError = true;
      }
    });
  }
 
  goBack(): void { this.router.navigate(['/rooms']); }
  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }
}