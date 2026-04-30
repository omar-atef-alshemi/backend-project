import { Routes } from '@angular/router';
import { CreateaccountComponent } from './createaccount/createaccount.component';
import { SigninComponent } from './signin/signin.component'
import { VerifyOtpComponent } from './verify-otp/verify-otp.component';
import { AuthSuccessComponent } from './auth-success/auth-success.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { VerifyResetCodeComponent } from './verify-reset-code/verify-reset-code.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { BecomeInstructorComponent } from './becomeinstructor/becomeinstructor.component';
import { HomepageComponent } from './homepage/homepage.component';
import { Guard } from './services/guard';

export const routes: Routes = [
    { path: 'register', component: CreateaccountComponent },
    { path: 'homepage', component: HomepageComponent, canActivate: [Guard] },
    { path: 'becomeinstructor', component: BecomeInstructorComponent },
    { path: 'signin', component: SigninComponent },
    { path: 'verify-otp', component: VerifyOtpComponent },
    { path: 'auth/success', component: AuthSuccessComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'verify-reset-code', component: VerifyResetCodeComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: '', redirectTo: '/register', pathMatch: 'full' }
];