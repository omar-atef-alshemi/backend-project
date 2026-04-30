import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-createaccount',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './createaccount.component.html',
  styleUrls: ['./createaccount.component.css']
})
export class CreateaccountComponent {
  formData = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' };
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // للامساك بكل حقول الإدخال لتشغيل الـ Focus عند الخطأ
  @ViewChildren('inputRef') inputElements!: QueryList<ElementRef>;

  // متغيرات قوة كلمة المرور
  strengthText = 'Enter your password';
  strengthColor = 'text-gray-500';
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
      this.strengthText = 'Enter your password';
      this.strengthColor = 'text-gray-500';
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

  onSubmit(form: NgForm) {
    // 1. لو الفورم فيها أخطاء افتراضية (زي الإيميل الغلط أو حقل فاضي)
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => form.controls[key].markAsTouched());
      this.focusFirstInvalidInput();
      return;
    }

    // 2. فحص إن الباسورد حقق كل الشروط القوية (عشان اليوزر ميتجاهلش الألوان)
    if (!this.reqLength || !this.reqUpper || !this.reqLower || !this.reqNumber || !this.reqSpecial) {
      this.errorMessage = 'Please ensure your password meets all strength requirements.';
      return;
    }

    // 3. التحقق من تطابق كلمة المرور
    if (this.formData.password !== this.formData.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    // 4. لو كله تمام، إرسال البيانات للباك إند
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // ملحوظة: إنت كنت عامل متغير studentPayload بس مش بتستخدمه في الإرسال، أنا بعت الـ formData كلها زي ما إنت كاتب
    this.api.registerStudent(this.formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = 'Success! Redirecting...';
        setTimeout(() => this.router.navigate(['/verify-otp'], { queryParams: { email: this.formData.email } }), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed';
      }
    });
  }

  loginWithGoogle() {
    window.location.href = 'http://localhost:5000/auth/google';
  }

  focusFirstInvalidInput() {
    const firstInvalid = this.inputElements.find(el => el.nativeElement.classList.contains('ng-invalid'));
    if (firstInvalid) {
      firstInvalid.nativeElement.focus();
    }
  }
}