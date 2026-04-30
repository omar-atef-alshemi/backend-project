import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-become-instructor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './becomeinstructor.component.html',
  styleUrls: ['./becomeinstructor.component.css']
})
export class BecomeInstructorComponent {

  formData = {
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
    country: '', state: '', jobTitle: '', specialization: '', educationLevel: '',
    bio: '', yearsExp: null, linkedin: '', certifications: ''
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isSubmitted = false;

  // متغيرات الملفات
  uploadedFileName = '';
  cvFile: File | null = null;
  uploadedVideoName = '';
  videoFile: File | null = null;

  // متغيرات قوة الباسورد
  strengthText = 'Enter your password';
  strengthColor = 'text-[#9ea8b3]';
  reqLength = false;
  reqUpper = false;
  reqLower = false;
  reqNumber = false;
  reqSpecial = false;

  countries = [
    { value: 'US', label: 'United States' },
    { value: 'EG', label: 'Egypt' },
    { value: 'SA', label: 'Saudi Arabia' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'AE', label: 'United Arab Emirates' }
  ];

  educationLevels = [
    { value: 'bachelors', label: "Bachelor's Degree" },
    { value: 'masters', label: "Master's Degree" },
    { value: 'phd', label: 'PhD / Doctorate' },
    { value: 'other', label: 'Other Professional Certification' }
  ];

  @ViewChildren('inputRef') inputElements!: QueryList<ElementRef>;

  constructor(private api: ApiService, private router: Router) { }

  // 1. دالة فحص الباسورد اللحظية
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
      this.strengthColor = 'text-[#9ea8b3]';
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

  // 2. دوال اختيار الملفات
  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.cvFile = file;
      this.uploadedFileName = file.name;
    }
  }

  onVideoSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      this.videoFile = file;
      this.uploadedVideoName = file.name;
    } else if (file) {
      alert('Please upload a valid video file');
    }
  }

  // 3. دالة الإرسال (Submit)
  onSubmit(form: NgForm) {
    this.isSubmitted = true;
    const isFilesValid = this.uploadedVideoName && this.uploadedFileName;

    // فحص لو الفورم ناقصة أو الملفات مش موجودة
    if (form.invalid || !isFilesValid) {
      Object.keys(form.controls).forEach(key => form.controls[key].markAsTouched());
      this.focusFirstInvalidInput();
      return;
    }

    // فحص قوة الباسورد
    if (!this.reqLength || !this.reqUpper || !this.reqLower || !this.reqNumber || !this.reqSpecial) {
      this.errorMessage = 'Please ensure your password meets all strength requirements (Strong ✅).';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // فحص تطابق الباسورد
    if (this.formData.password !== this.formData.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // 👇 هنا السحر: تجهيز FormData بدل الـ Object العادي 👇
    const submitData = new FormData();

    // إضافة النصوص العادية
    submitData.append('firstName', this.formData.firstName);
    submitData.append('lastName', this.formData.lastName);
    submitData.append('email', this.formData.email);
    submitData.append('phone', this.formData.phone);
    submitData.append('password', this.formData.password);
    submitData.append('specialization', this.formData.specialization);
    submitData.append('jobTitle', this.formData.jobTitle);
    submitData.append('experienceYears', String(this.formData.yearsExp)); // تحويل الرقم لنص
    submitData.append('location', `${this.formData.state}, ${this.formData.country}`);
    submitData.append('linkedinUrl', this.formData.linkedin);
    submitData.append('educationLevel', this.formData.educationLevel);
    submitData.append('certifications', this.formData.certifications);
    submitData.append('bio', this.formData.bio); // ضفنا الـ bio عشان مكنش موجود في الريكويست القديم

    // إضافة الملفات (CV و Video)
    if (this.cvFile) {
      submitData.append('cv', this.cvFile);
    }
    if (this.videoFile) {
      submitData.append('video', this.videoFile);
    }

    // إرسال الكرتونة (submitData) للـ API
    this.api.registerTeacher(submitData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = 'Success! Redirecting...';
        setTimeout(() => this.router.navigate(['/verify-otp'], { queryParams: { email: this.formData.email } }), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // دالة الفوكس التلقائي على الأخطاء
  focusFirstInvalidInput() {
    const firstInvalid = this.inputElements.find(el => el.nativeElement.classList.contains('ng-invalid'));
    if (firstInvalid) {
      firstInvalid.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.nativeElement.focus();
    }
  }
}