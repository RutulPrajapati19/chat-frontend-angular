import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
 
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html'
})
export class ProfileComponent implements OnInit {
  username = '';
  email = '';
  status = '';
  memberSince = '';
 
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
 
  loading = true;
  saving = false;
  successMsg = '';
  errorMsg = '';
 
  constructor(private authService: AuthService, private router: Router) {}
 
  ngOnInit(): void {
    this.loadProfile();
  }
 
  loadProfile(): void {
    this.loading = true;
    this.authService.getMyProfile().subscribe({
      next: (profile) => {
        this.username = profile.username;
        this.email = profile.email;
        this.status = profile.status;
        this.memberSince = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '';
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Could not load your profile.';
        this.loading = false;
      }
    });
  }
 
  saveChanges(): void {
    this.successMsg = '';
    this.errorMsg = '';
 
    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.errorMsg = 'New passwords do not match.';
      return;
    }
 
    if (this.newPassword && !this.currentPassword) {
      this.errorMsg = 'Enter your current password to set a new one.';
      return;
    }
 
    this.saving = true;
 
    const payload: any = { email: this.email };
    if (this.newPassword) {
      payload.currentPassword = this.currentPassword;
      payload.newPassword = this.newPassword;
    }
 
    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.successMsg = 'Profile updated.';
        this.saving = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'Could not update profile.';
        this.saving = false;
      }
    });
  }
 
  goBack(): void { this.router.navigate(['/rooms']); }
 
  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }
}
 