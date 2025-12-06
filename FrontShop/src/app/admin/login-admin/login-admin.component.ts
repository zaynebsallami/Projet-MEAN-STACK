import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder,ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import{ environment } from '../../../environments/environment';
import { AdminService } from '../../services/admin.service';
import {
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

interface AdminAccount {
  email: string;
  password: string;
  role: string;
}
@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './login-admin.component.html',
  styleUrl: './login-admin.component.scss',
    encapsulation: ViewEncapsulation.None

})
export class AdminLoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  isBlocked = false;
  loginAttempts = 0;
  showPassword = false;
  notification = {
    show: false,
    type: 'success' as 'success' | 'error',
    message: ''
  };



  constructor(private fb: FormBuilder,
     private router: Router,
    private http: HttpClient,
    private adminService: AdminService,
    private translate: TranslateService
    ) {
      this.translate.setDefaultLang('en');
    this.translate.use('en');
    }

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  showNotification(type: 'success' | 'error', message: string) {
    this.notification = { show: true, type, message };
    setTimeout(() => {
      this.notification.show = false;
    }, 5000);
  }
onSubmit(): void {
    if (this.isBlocked || this.isLoading) return;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

  this.adminService.login(email, password).subscribe({
  next: (res: any) => {
    // ✔️ Stocker le token
    localStorage.setItem('admin_token', res.token); // UN SEUL nom de clé
    this.showNotification('success', 'Connexion réussie !');

    setTimeout(() => {
      this.router.navigate(['/admin']);
    }, 1500);
  },
  error: (error) => {
    this.handleLoginError(error);
  }
});

  }
  private handleLoginError(error: any): void {
    this.isLoading = false;
    this.loginAttempts++;

    if (this.loginAttempts >= 5) {
      this.isBlocked = true;
      this.showNotification('error', 'Compte bloqué pendant 15 minutes');
      setTimeout(() => {
        this.isBlocked = false;
        this.loginAttempts = 0;
      }, 900000);
    } else {
      const message = error.error?.message || 'Email ou mot de passe incorrect';
      this.showNotification('error', `${message} (${5 - this.loginAttempts} tentatives restantes)`);
    }
  }
   goToHome() {
    console.log('Tentative de navigation vers /');  // Debug
    this.router.navigate(['/']).then(success => {
      if (!success) {
        console.error('Échec de la navigation !');
      }
    });
  }
}
