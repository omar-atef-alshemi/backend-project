import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-auth-success',
  standalone: true,
  imports: [CommonModule],
  // شاشة تحميل بسيطة تظهر ثانية واحدة
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p class="text-lg font-medium">Finalizing Google Login...</p>
    </div>
  `
})
export class AuthSuccessComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        // حفظنا التوكن
        localStorage.setItem('accessToken', token);

        // هنرجعه لصفحة التسجيل أو الـ Dashboard 
        this.router.navigate(['/signin']);
      } else {
        this.router.navigate(['/signin']);
      }
    });
  }
}