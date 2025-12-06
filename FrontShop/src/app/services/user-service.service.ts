import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api'; // Directly set your backend URL here

  constructor(private http: HttpClient) { }

  // Token management
  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
getAllUsers() {
  return this.http.get<any[]>('http://localhost:3000/api/users');
}
  // User Profile
  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/me`, { 
      headers: this.getAuthHeaders() 
    });
  }

  updateProfile(userId: string, updates: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}`, updates, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Password
  changePassword(userId: string, currentPwd: string, newPwd: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/users/${userId}/change-password`,
      { currentPassword: currentPwd, newPassword: newPwd },
      { headers: this.getAuthHeaders() }
    );
  }

  // Account actions
  deactivateAccount(userId: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/users/${userId}/deactivate`, 
      {},
      { headers: this.getAuthHeaders() }
    );
  }

 

  // Password reset (no auth required)
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/reset-password`, { 
      token, 
      password: newPassword 
    });
  }

  // Avatar upload (using FormData)
  uploadAvatar(userId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.http.post(
      `${this.apiUrl}/users/${userId}/avatar`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }
  deleteAccount(userId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/users/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }
deleteUser(userId: string) {
  const token = this.getToken();
  let headers = new HttpHeaders();
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  return this.http.delete(`http://localhost:3000/api/users/${userId}`, { headers });
}
  // Password reset (no auth required)
 
}