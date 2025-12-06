import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ViewEncapsulation } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule,TranslateModule],
    styleUrls: ['./reset-password.component.scss'], 
  encapsulation: ViewEncapsulation.None,

})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirmPassword = '';
  token = '';
  success = false;
  errorMessage = '';

  constructor(private http: HttpClient, private route: ActivatedRoute,private translate: TranslateService,
) {this.translate.setDefaultLang('en');
    this.translate.use('en');}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit(): void {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.http.post('http://localhost:3000/api/users/reset-password', {
      token: this.token,
      password: this.password,
    }).subscribe({
      next: () => {
        this.success = true;
        this.errorMessage = '';
      },
      error: (err) => {
        this.success = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la réinitialisation.';
      }
    });
  }
}
