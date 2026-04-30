import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component'; // 👈 السطر ده لازم يشاور على الكلاس اللي فوق

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));