import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent {
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // متغيرات قوة الباسورد
  strengthText = 'Enter new password';
  strengthColor = 'text-[#3f4851]';
  reqLength = false;
  reqUpper = false;
  reqLower = false;
  reqNumber = false;
  reqSpecial = false;

  constructor(private api: ApiService, private router: Router) { }

  // دالة فحص الباسورد اللحظية
  checkPassword(val: string) {
    this.reqLength = val.length >= 8;
    this.reqUpper = /[A-Z]/.test(val);
    this.reqLower = /[a-z]/.test(val);
    this.reqNumber = /[0-9]/.test(val);
    this.reqSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);

    let strength = 0;
    if (this.reqLength) strength++;
    if (this.reqUpper) strength++;
    if (this.reqLower) strength++;
    if (this.reqNumber) strength++;
    if (this.reqSpecial) strength++;

    if (val.length === 0) {
      this.strengthText = 'Enter new password';
      this.strengthColor = 'text-[#3f4851]';
    } else if (strength <= 2) {
      this.strengthText = 'Weak Password';
      this.strengthColor = 'text-red-500';
    } else if (strength === 3 || strength === 4) {
      this.strengthText = 'Medium Password';
      this.strengthColor = 'text-yellow-500';
    } else if (strength === 5) {
      this.strengthText = 'Strong Password';
      this.strengthColor = 'text-green-500';
    }
  }

  onUpdate() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    // فحص إن الباسورد الجديد قوي قبل الإرسال
    if (!this.reqLength || !this.reqUpper || !this.reqLower || !this.reqNumber || !this.reqSpecial) {
      this.errorMessage = 'Please choose strong password';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    const email = localStorage.getItem('resetEmail');
    if (!email) {
      this.router.navigate(['/forgot-password']);
      return;
    }

    this.isLoading = true;
    this.api.resetPassword({ email, newPassword: this.newPassword }).subscribe({
      next: (res: any) => {
        const token = res.accessToken;
        localStorage.clear();
        localStorage.setItem('accessToken', token);

        this.successMessage = 'Password changed successfully!';
        this.isLoading = false;

        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Something went wrong.';
      }
    });
  }
}