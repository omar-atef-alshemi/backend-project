// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// import { ApiService } from '../services/api.service';

// @Component({
//   selector: 'app-verify-otp',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterLink],
//   templateUrl: './verify-otp.component.html',
//   styleUrls: ['./verify-otp.component.css']
// })
// export class VerifyOtpComponent implements OnInit, OnDestroy {
//   otpDigits = { digit1: '', digit2: '', digit3: '', digit4: '', digit5: '', digit6: '' };
//   email: string = '';
//   isLoading = false;
//   isResending = false;
//   errorMessage = '';
//   successMessage = '';

//   timer: number = 120;
//   displayTimer: string = '01:59';
//   interval: any;

//   constructor(
//     private route: ActivatedRoute,
//     private api: ApiService,
//     private router: Router
//   ) { }

//   ngOnInit() {
//     this.email = this.route.snapshot.queryParams['email'] || '';
//     if (!this.email) {
//       this.router.navigate(['/register']);
//       return;
//     }
//     this.startTimer();
//   }

//   moveFocus(nextElement: HTMLInputElement) {
//     if (nextElement) nextElement.focus();
//   }

//   get fullOtp(): string {
//     return Object.values(this.otpDigits).join('');
//   }

//   onSubmit() {
//     if (this.fullOtp.length < 6) {
//       this.errorMessage = 'Please enter all 6 digits.';
//       return;
//     }
//     this.isLoading = true;
//     this.errorMessage = '';
//     this.successMessage = '';

//     this.api.verifyOtp({ email: this.email, otp: this.fullOtp }).subscribe({
//       next: (res: any) => {
//         this.isLoading = false;
//         this.successMessage = 'Email verified successfully! Redirecting...';
//         localStorage.setItem('accessToken', res.accessToken);
//         setTimeout(() => this.router.navigate(['/dashboard']), 2000);
//       },
//       error: (err) => {
//         this.isLoading = false;
//         this.errorMessage = err.error?.message || 'Invalid or expired code.';
//       }
//     });
//   }

//   startTimer() {
//     if (this.interval) clearInterval(this.interval);
//     this.timer = 120;

//     this.interval = setInterval(() => {
//       if (this.timer > 0) {
//         this.timer--;
//       } else {
//         clearInterval(this.interval);
//       }
//     }, 1000);
//   }

//   // ✅ بيستخدم resendOtp مش registerStudent
//   resendCode() {
//     if (this.timer > 0 || this.isResending) return;

//     this.isResending = true;
//     this.errorMessage = '';
//     this.successMessage = '';

//     this.api.resendOtp(this.email).subscribe({
//       next: () => {
//         this.isResending = false;
//         this.successMessage = 'New code sent! Check your email.';
//         this.startTimer();
//       },
//       error: (err) => {
//         this.isResending = false;
//         this.errorMessage = err.error?.message || 'Failed to resend code.';
//       }
//     });
//   }

//   formatTimer(): string {
//     const mins = Math.floor(this.timer / 60);
//     const secs = this.timer % 60;
//     return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
//   }

//   ngOnDestroy() {
//     if (this.interval) clearInterval(this.interval);
//   }
// }
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css']
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
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
    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) { }

  ngOnInit() {
    this.email = this.route.snapshot.queryParams['email'] || '';
    if (!this.email) {
      this.router.navigate(['/register']);
      return;
    }
    this.startTimer();
  }

  moveFocus(nextElement: HTMLInputElement) {
    if (nextElement) nextElement.focus();
  }

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

    this.api.verifyOtp({ email: this.email, otp: this.fullOtp }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = 'Email verified successfully! Redirecting...';
        localStorage.setItem('accessToken', res.accessToken);
        setTimeout(() => this.router.navigate(['/signin']), 2000);
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

    this.api.resendOtp(this.email).subscribe({
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