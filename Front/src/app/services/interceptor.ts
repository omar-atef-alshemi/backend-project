// import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { catchError, switchMap, throwError } from 'rxjs';
// import { ApiService } from '../services/api.service'; // تأكد من مسار الـ ApiService
// import { Router } from '@angular/router';

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//     const apiService = inject(ApiService);
//     const router = inject(Router);
//     const token = apiService.getAccessToken();

//     // 1. لو في توكن، بننسخ الريكويست ونحط التوكن في الـ Headers
//     let authReq = req;
//     if (token) {
//         authReq = req.clone({
//             setHeaders: {
//                 Authorization: `Bearer ${token}`
//             }
//         });
//     }

//     // 2. بنبعت الريكويست، ولو رجع إيرور بنتعامل معاه
//     return next(authReq).pipe(
//         catchError((error: HttpErrorResponse) => {
//             // لو الإيرور 401 أو 403 (يعني التوكن خلص أو مش صالح)
//             if (error.status === 401 || error.status === 403) {

//                 // بننادي على دالة الـ Refresh عشان نجيب توكن جديد
//                 return apiService.refreshToken().pipe(
//                     switchMap((res: any) => {
//                         // لو نجحنا وجبنا توكن جديد، بنبعت الريكويست الأصلي تاني بالتوكن الجديد
//                         const newToken = res.accessToken;
//                         const retryReq = req.clone({
//                             setHeaders: { Authorization: `Bearer ${newToken}` }
//                         });
//                         return next(retryReq);
//                     }),
//                     catchError((refreshError) => {
//                         // لو الـ Refresh كمان فشل (يعني اليوزر بقاله كتير جداً مدخلش والكوكي خلصت)
//                         // بنمسح التوكن القديم ونطلعه بره يعمل تسجيل دخول من جديد
//                         apiService.clearTokens();
//                         router.navigate(['/signin']);
//                         return throwError(() => refreshError);
//                     })
//                 );
//             }
//             // لو إيرور تاني عادي بنرجعه
//             return throwError(() => error);
//         })
//     );
// };
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const apiService = inject(ApiService);
    const router = inject(Router);
    const token = apiService.getAccessToken(); // أو localStorage.getItem('accessToken')

    let authReq = req;
    if (token) {
        authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // 1. لو الإيرور 401 أو 403
            if (error.status === 401 || error.status === 403) {

                // 🚨 التعديل السحري هنا: لو الريكويست اللي ضرب هو بتاع التجديد، اطرد اليوزر فورا ومتعملش Loop!
                if (req.url.includes('/refresh')) {
                    localStorage.removeItem('accessToken'); // امسح التوكن
                    router.navigate(['/signin']); // اطرده على صفحة اللوجين
                    return throwError(() => error);
                }

                // 2. لو ريكويست عادي (زي getMe)، جرب تعمل refresh
                return apiService.refreshToken().pipe(
                    switchMap((res: any) => {
                        const newToken = res.accessToken;
                        const retryReq = req.clone({
                            setHeaders: { Authorization: `Bearer ${newToken}` }
                        });
                        return next(retryReq);
                    }),
                    catchError((refreshError) => {
                        // لو التجديد فشل، اطرد اليوزر برضه
                        localStorage.removeItem('accessToken');
                        router.navigate(['/signin']);
                        return throwError(() => refreshError);
                    })
                );
            }
            // لو أي إيرور تاني، رجعه عادي
            return throwError(() => error);
        })
    );
};