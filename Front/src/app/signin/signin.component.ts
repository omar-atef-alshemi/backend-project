// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterLink } from '@angular/router';
// import { ApiService } from '../services/api.service';

// @Component({
//   selector: 'app-sginin',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterLink],
//   templateUrl: './sginin.component.html',
//   styleUrls: ['./sginin.component.css']
// })
// export class SgininComponent {
//   // بيانات الفورم
//   loginData = {
//     email: '',
//     password: ''
//   };

//   isLoading = false;
//   errorMessage = '';

//   constructor(private api: ApiService, private router: Router) { }

//   onSubmit() {
//     if (!this.loginData.email || !this.loginData.password) {
//       this.errorMessage = 'Please fill in all fields.';
//       return;
//     }

//     this.isLoading = true;
//     this.errorMessage = '';

//     this.api.loginStudent(this.loginData).subscribe({
//       next: (res: any) => {
//         this.isLoading = false;
//         // حفظ التوكن في المتصفح
//         localStorage.setItem('accessToken', res.token);
//         // التوجه لصفحة الـ Dashboard (أو أي صفحة تختارها)
//         this.router.navigate(['/register']);
//       },
//       error: (err) => {
//         this.isLoading = false;
//         this.errorMessage = err.error?.message || 'Invalid email or password. Please try again.';
//       }
//     });
//   }

//   loginWithGoogle() {
//     // توجيه اليوزر لرابط جوجل في الباك إند
//     window.location.href = 'http://localhost:5000/auth/google';
//   }
// }
import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-signin', // تأكد من الاسم هنا حسب مشروعك
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent {
  loginData = { email: '', password: '' };
  isLoading = false;
  errorMessage = '';

  // الإمساك بكل الحقول التي تحمل علامة #inputRef
  @ViewChildren('inputRef') inputElements!: QueryList<ElementRef>;

  constructor(private api: ApiService, private router: Router) { }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => form.controls[key].markAsTouched());
      this.focusFirstInvalidInput();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.api.loginStudent(this.loginData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // شيلنا سطر الحفظ من هنا لأن السيرفيس قامت بالواجب خلاص
        this.router.navigate(['/homepage']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }
  focusFirstInvalidInput() {
    // البحث عن أول عنصر يحمل كلاس ng-invalid الذي يضيفه أنجلر تلقائياً
    const firstInvalid = this.inputElements.find(el => el.nativeElement.classList.contains('ng-invalid'));
    if (firstInvalid) firstInvalid.nativeElement.focus();
  }

  loginWithGoogle() {
    window.location.href = 'http://localhost:5000/auth/google';
  }
}