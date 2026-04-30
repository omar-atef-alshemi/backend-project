import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiService } from '../services/api.service'; // اتأكد من المسار

export const Guard: CanActivateFn = (route, state) => {
    const apiService = inject(ApiService);
    const router = inject(Router);

    // لو معاه توكن، خليه يدخل
    if (apiService.getAccessToken()) {
        return true;
    }

    // لو معندوش، اطرده على صفحة تسجيل الدخول
    router.navigate(['/signin']);
    return false;
};