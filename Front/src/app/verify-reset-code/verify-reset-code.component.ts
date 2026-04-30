import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router} from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-verify-reset-code',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-reset-code.component.html',
  styleUrls: ['./verify-reset-code.component.css']
})
export class VerifyResetCodeComponent implements OnInit, OnDestroy {
  // استخدام نفس كائن الـ otpDigits للتوحيد
  otpDigits = { digit1: '', digit2: '', digit3: '', digit4: '', digit5: '', digit6: '' };
  email: string = '';
  isLoading = false;
  isResending = false;
  errorMessage = '';
  successMessage = '';

  timer: number = 119;
  displayTimer: string = '01:59';
  interval: any;

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.email = localStorage.getItem('resetEmail') || '';
    if (!this.email) {
      this.router.navigate(['/forgot-password']);
      return;
    }
    this.startTimer();
  }

  // دالة النقل التلقائي بين المربعات
  moveFocus(nextElement: HTMLInputElement) {
    if (nextElement) nextElement.focus();
  }

  // تجميع الكود
  get fullOtp(): string {
    return Object.values(this.otpDigits).join('');
  }

  onSubmit() {
    if (this.fullOtp.length < 6) {
      this.errorMessage = 'Please enter all 6 digits.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.verifyResetCode(this.fullOtp).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Code verified! Redirecting...';
        // تحويل تلقائي بعد ثانية لصفحة تغيير الباسورد
        setTimeout(() => this.router.navigate(['/reset-password']), 1000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid or expired code.';
      }
    });
  }

  startTimer() {
    if (this.interval) clearInterval(this.interval);

    this.timer = 119;
    this.updateDisplayTimer();

    this.interval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
        this.updateDisplayTimer();
        this.cdr.detectChanges();
      } else {
        clearInterval(this.interval);
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  updateDisplayTimer() {
    const mins = Math.floor(this.timer / 60);
    const secs = this.timer % 60;
    this.displayTimer = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  resendCode() {
    if (this.timer > 0 || this.isResending) return;
    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.forgetPassword(this.email).subscribe({
      next: () => {
        this.isResending = false;
        this.successMessage = 'New code sent! Check your email.';
        this.startTimer();
      },
      error: (err) => {
        this.isResending = false;
        this.errorMessage = err.error?.message || 'Failed to resend code.';
      }
    });
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
  }
}