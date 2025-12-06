import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root', // Makes the service available application-wide
})
export class AuthserviceService {
  // BehaviorSubject to track authentication state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private router: Router) {
    // Check initial authentication state (e.g., from localStorage)
    this.checkAuthentication();
  }

  // Method to check if the user is authenticated
  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Method to log in the user
  login(username: string, password: string): void {
    // Simulate a login request to your backend
    // Replace this with your actual API call
    if (username === 'user' && password === 'password') {
      // Save authentication state (e.g., in localStorage)
      localStorage.setItem('isAuthenticated', 'true');
      this.isAuthenticatedSubject.next(true);
      this.router.navigate(['/']); // Redirect to home page
    } else {
      alert('Invalid credentials');
    }
  }

  // Method to log out the user
  logout(): void {
    // Clear authentication state
    localStorage.removeItem('isAuthenticated');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']); // Redirect to login page
  }

  // Method to check authentication state (e.g., from localStorage)
  private checkAuthentication(): void {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    this.isAuthenticatedSubject.next(isAuthenticated);
  }
  
}