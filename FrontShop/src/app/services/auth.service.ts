import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CartService } from './cart-service.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cartService: CartService
  ) {
    this.initializeAuthState();
  }
getCurrentUserId(): string | null {
  if (this.currentUserSubject.value?._id) {
    return this.currentUserSubject.value._id;
  }

  const userJson = localStorage.getItem('currentUser');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      return user?._id || user?.id || null; // ✅ fallback to id
    } catch {
      return null;
    }
  }
  return null;
}

  private initializeAuthState(): void {
    const token = this.getToken();
    const user = this.getCurrentUserFromStorage();

    if (token && this.isTokenValid(token) && user) {
      this.isAuthenticatedSubject.next(true);
      this.currentUserSubject.next(user);
    } else {
      this.clearAuthData();
    }
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<{
      success: boolean;
      token: string;
      userType: string;
      user: any;
    }>(`${this.apiUrl}/users/login`, credentials).pipe(
      tap((response) => {
        if (response.success && response.token) {
          this.handleSuccessfulAuth(response.token, response.user);
          this.router.navigate([this.getRedirectRoute(response.user)]);
        }
      }),
      catchError(this.handleAuthError)
    );
  }
  getSellerById(id: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/sellers/${id}`);
}
  loginSeller(email: string, password: string): Observable<any> {
    return this.http.post<{
      success: boolean;
      token: string;
      user: any;
    }>(`${this.apiUrl}/sellers/login`, { email, password }).pipe(
      tap((response) => {
        if (response.success && response.token) {
          const sellerUser = { ...response.user, role: 'vendeur' };
          this.handleSuccessfulAuth(response.token, sellerUser);
          this.router.navigate(['/dashboard/seller-dashboard']);
        }
      }),
      catchError(this.handleAuthError)
    );
  }

private handleSuccessfulAuth(token: string, user: any): void {
  if (user.role?.toLowerCase() === 'admin') {
    localStorage.setItem('admin_token', token);
  } else {
    localStorage.setItem('authToken', token);
  }
  localStorage.setItem('userId', user._id);
  localStorage.setItem('currentUser', JSON.stringify(user));

  // Emit immediately
  this.currentUserSubject.next(user);
  this.isAuthenticatedSubject.next(true);
}

  private getRedirectRoute(user: any): string {
    switch (user.role.toLowerCase()) {
      case 'client': return '/profile-client';
      case 'vendeur': return '/dashboard/seller-dashboard';
      case 'admin': return '/admin';
      default: return '/';
    }
  }

  private handleAuthError(error: any): Observable<never> {
    console.error('Authentication error:', error);
    let errorMessage = 'An error occurred during authentication';
    if (error.status === 401) {
      errorMessage = error.error?.message || 'Invalid credentials';
    }
    return throwError(() => new Error(errorMessage));
  }

  signupClient(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/signup`, data).pipe(
      catchError(this.handleAuthError)
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/forgot-password`, { email }).pipe(
      catchError(this.handleAuthError)
    );
  }

  getProfile(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }

    return this.http.get(`${this.apiUrl}/users/me`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    }).pipe(
      tap((user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(this.handleAuthError)
    );
  }

getToken(): string | null {
  // Pour les routes générales (client/vendeur)
  return localStorage.getItem('authToken');
}

getAdminToken(): string | null {
  return localStorage.getItem('admin_token');
}

  isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }



  logout(): void {
    this.clearAuthData();
    this.cartService.clearCart().subscribe({
      complete: () => {
        this.router.navigate(['/login-se']);
      }
    });
  }

  private clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }
   isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && this.isTokenValid(token);
  }
 getCurrentUserFromStorage(): any {
  const userJson = localStorage.getItem('currentUser');
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}
 
}