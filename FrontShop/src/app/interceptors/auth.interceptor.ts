import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const excludedEndpoints = ['/login', '/signup', '/forgot-password', '/refresh-token'];
    const shouldSkip = excludedEndpoints.some(endpoint => req.url.includes(endpoint));

    if (shouldSkip) {
      return next.handle(req);
    }

    // Détecter si c'est une route admin
    const isAdminReq = req.url.includes('/api/admin');

    // Sélection du token approprié
    const token = isAdminReq ? this.authService.getAdminToken() : this.authService.getToken();

    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          // Logout et redirection si problème de token
          this.authService.logout();
          this.router.navigate(['/login-se']);
        }
        return throwError(() => error);
      })
    );
  }
}
