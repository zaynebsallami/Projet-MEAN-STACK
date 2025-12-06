import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'; 
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart-service.service';
import { TranslateService,TranslateModule } from '@ngx-translate/core';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-login-se',
  standalone: true,
 imports: [FormsModule, FormsModule, TranslateModule, CommonModule],
   templateUrl: './login-se.component.html',
  styleUrls: ['./login-se.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LoginSeComponent implements OnInit {
  signupConfirmPassword = '';
  userType = '';
  isSignup = false;
  formErrorMessage = '';
  confirmationMessage = '';
  loginEmail = '';
  loginPassword = '';
  signupNom = '';
  signupEmail = '';
  signupPassword = '';
  signupAdresse = '';  
  signupTelephone = '';  
  signupDateNaissance = ''; 

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private cartService: CartService,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private title: Title, private meta: Meta

  ) {this.translate.setDefaultLang('en');
    this.translate.use('en');

    this.translate.onLangChange.subscribe(() => {
      this.cdr.markForCheck();
    });}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
    this.isSignup = params['form'] === 'signup';
    this.title.setTitle('Login or Sign Up');
    this.meta.updateTag({ name: 'description', content: 'Access your account or create a new one to start shopping.' });

    });
  }

 onSignupClick(): void {
  this.isSignup = true;
  this.isResetPassword = false; // cache reset password
  this.formErrorMessage = '';
  this.confirmationMessage = '';
}

onLoginClick(): void {
  this.isSignup = false;
  this.isResetPassword = false; // cache reset password
  this.formErrorMessage = '';
  this.confirmationMessage = '';
}

onForgotPasswordClick(): void {
  this.isResetPassword = true;
  this.isSignup = false; // cache signup
  this.formErrorMessage = '';
  this.confirmationMessage = '';
  this.resetEmail = '';
}

cancelForgotPassword(): void {
  this.isResetPassword = false;
  this.isSignup = false; // cache signup pour revenir au login
  this.formErrorMessage = '';
  this.confirmationMessage = '';
  this.resetEmail = '';
}


 onLoginSubmit(): void {
  this.formErrorMessage = '';

  if (!this.loginEmail || !this.loginPassword) {
    this.formErrorMessage = 'Email and password are required';
    return;
  }

  const credentials = {
    email: this.loginEmail.trim(),
    password: this.loginPassword
  };

  // First attempt: Client login
  this.authService.login(credentials).subscribe({
    next: (response) => {
      if (response.success) {
        this.handleLoginSuccess('client', response.token, response.user);
      }
    },
    error: (error) => {
      console.warn('Client login failed, trying seller login...');
      // Fallback to seller login
      this.authService.loginSeller(credentials.email, credentials.password).subscribe({
        next: (sellerResponse) => {
          if (sellerResponse.success) {
            this.handleLoginSuccess('vendeur', sellerResponse.token, sellerResponse.user);
          }
        },
        error: (sellerError) => {
          console.error('Seller login failed:', sellerError);
          this.formErrorMessage = sellerError.error?.message || 'Login failed. Please try again.';
        }
      });
    }
  });
}



  handleLoginSuccess(userType: string, token: string, user: any): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify({
      id: user._id,
      email: user.email,
      role: userType
    }));

    if (userType === 'vendeur') {
      localStorage.setItem('sellerId', user._id);
    }

    this.cartService.loadCartFromStorage();

    const redirectUrl = userType === 'client'
      ? '/profile-client'
      : '/dashboard/seller-dashboard';

    this.router.navigate([redirectUrl]);
  }

 onSignupSubmit(): void {
  this.formErrorMessage = '';
  this.confirmationMessage = '';

  if (this.userType === 'vendeur') {
    this.router.navigate(['/signup-se'], {
      state: {
        sellerData: {
          email: this.signupEmail,
          nom: this.signupNom,
          adresse: this.signupAdresse,
          telephone: this.signupTelephone,
          dateNaissance: this.signupDateNaissance,
          password: this.signupPassword
        }
      }
    });
    return;
  }

  if (
    !this.signupNom ||
    !this.signupEmail ||
    !this.signupPassword ||
    !this.signupConfirmPassword ||
    !this.signupAdresse ||
    !this.signupTelephone ||
    !this.signupDateNaissance
  ) {
    this.formErrorMessage = 'Tous les champs sont obligatoires.';
    return;
  }

  if (this.signupPassword !== this.signupConfirmPassword) {
    this.formErrorMessage = "Les mots de passe ne correspondent pas.";
    return;
  }

  const signupData = {
    email: this.signupEmail,
    nom: this.signupNom,
    password: this.signupPassword,
    adresse: this.signupAdresse,
    telephone: this.signupTelephone,
    dateNaissance: this.signupDateNaissance
  };

  this.authService.signupClient(signupData).subscribe({
    next: (response: any) => {
      if (response.success) {
        // ✅ Instead of auto-login, go back to login form
        this.isSignup = false;   // switch back to login tab
        this.confirmationMessage = 'Signup successful! Please log in.'; 
        this.cdr.markForCheck(); // force UI refresh (OnPush)
      } else {
        this.formErrorMessage = 'Inscription échouée. Veuillez réessayer.';
      }
    },
    error: (error) => {
      this.formErrorMessage = error.error?.message || 'Inscription échouée. Veuillez réessayer.';
      this.cdr.markForCheck();
    }
  });
}

  isResetPassword = false;
  resetEmail = '';
onForgotPasswordSubmit(): void {
  this.formErrorMessage = '';
  this.confirmationMessage = '';

  if (!this.resetEmail) {
    this.formErrorMessage = this.translate.instant('LOGIN.EMAIL_REQUIRED');
    return;
  }

  this.authService.forgotPassword(this.resetEmail).subscribe({
    next: () => {
      this.confirmationMessage = this.translate.instant('LOGIN.RESET_SUCCESS');
      this.cdr.markForCheck(); // <- IMPORTANT for OnPush
    },
    error: (err) => {
      this.formErrorMessage = err.error?.message || this.translate.instant('LOGIN.RESET_FAILED');
      this.cdr.markForCheck(); // <- IMPORTANT for OnPush
    }
  });
}



}