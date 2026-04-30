import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  email: string = '';
  isLoading = false;
  errorMessage = '';

  constructor(private api: ApiService, private router: Router) { }

  onSendLink() {
    this.isLoading = true;
    this.api.forgetPassword(this.email).subscribe({
      next: () => {
        // بننقل الإيميل للخطوة اللي بعدها عشان الباك إند محتاجه في آخر خطوة
        localStorage.setItem('resetEmail', this.email);
        this.router.navigate(['/verify-reset-code']);
      },
      error: (err) => { this.isLoading = false; this.errorMessage = err.error.message; }
    });
  }
}