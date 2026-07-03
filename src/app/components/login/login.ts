import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
 
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;
 
  constructor(private authService: AuthService, private router: Router) {}
 
  onLogin(): void {
    if (!this.username.trim() || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }
    this.loading = true;
    this.error = '';
 
    this.authService.login({ username: this.username.trim(), password: this.password })
      .subscribe({
        next: () => this.router.navigate(['/rooms']),
        error: (err) => {
          this.error = err?.error?.error || 'Invalid username or password';
          this.loading = false;
        }
      });
  }
}