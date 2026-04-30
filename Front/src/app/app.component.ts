import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // ده اللي بيخلي الـ Routes تشتغل
  template: '<router-outlet></router-outlet>', // هنا بنقول للأنجلر "اعرض الصفحات هنا"
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'EduLearn';
}