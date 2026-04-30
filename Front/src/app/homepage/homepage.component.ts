import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './homepage.component.html', // أو لو كاتب الـ HTML جوه الملف
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  userData: any = null;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.fetchUserData();
  }

  fetchUserData() {
    this.api.getMe().subscribe({
      next: (res: any) => {
        console.log('Success! User Data fetched:', res);
        this.userData = res; // عشان لو حبيت تعرض اسمه في الـ HTML
      },
      error: (err) => {
        console.error('Failed to fetch user data:', err);
      }
    });
  }
}