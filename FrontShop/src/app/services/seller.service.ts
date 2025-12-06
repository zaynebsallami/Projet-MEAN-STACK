import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export interface Seller {
  avatar: null;
  image: null;
  _id: string;
  nom: string;
  email: string;
  telephone: string;
  role: string;
  boutique: {
    subcategory: any;
    businessName: string;
    productType: string;
    description: string;
    documentation?: string;
    storePhoto?: string;
    rating?: number;
  };
  rating?: number;
  products?: number;
}

export interface RateSellerResponse {
  averageRating: number;
}

export interface SellerStats {
  totalProducts: number;
  totalRevenue: number;
  monthlySales: number;
  totalCustomers: number;
}

@Injectable({
  providedIn: 'root',
})
export class SellerService {
  private apiUrl = 'http://localhost:3000/api/sellers';

  constructor(private http: HttpClient, private authService: AuthService) {}

  /** Signup seller */
  signupSeller(sellerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, sellerData).pipe(
      tap((res) => console.log('Signup response:', res)),
      catchError((error) => throwError(() => error))
    );
  }

  /** Add boutique info for seller */
  addBoutique(sellerId: string, boutiqueData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-boutique/${sellerId}`, boutiqueData).pipe(
      tap((res) => console.log('Boutique added:', res)),
      catchError((error) => throwError(() => error))
    );
  }

  /** Get all sellers */
  getSellers(): Observable<Seller[]> {
    return this.http.get<Seller[]>(this.apiUrl).pipe(
      tap((res) => console.log('Sellers data:', res)),
      catchError(() => of([]))
    );
  }

  /** Get single seller by ID */
  getSellerById(id: string): Observable<Seller> {
    return this.http.get<Seller>(`${this.apiUrl}/${id}`).pipe(
      tap((res) => console.log('Seller data:', res)),
      catchError((error) => throwError(() => error))
    );
  }

  /** Register seller with FormData */
  registerSeller(data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/sellers`, data).pipe(
      tap((res) => console.log('Seller registered:', res)),
      catchError((error) => throwError(() => error))
    );
  }

  /** Rate a seller */
  rateSeller(sellerId: string, rating: number, comment: string): Observable<RateSellerResponse> {
    const token = localStorage.getItem('authToken');
    if (!token) return throwError(() => new Error('Token missing'));

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.post<RateSellerResponse>(
      `${this.apiUrl}/rating/${sellerId}/rate`,
      { rating, comment },
      { headers }
    ).pipe(
      tap(res => console.log('Seller rated:', res)),
      catchError(error => throwError(() => error))
    );
  }

  /** Get all ratings of a seller */
  getSellerRatings(sellerId: string): Observable<{ success: boolean; ratings: any[] }> {
    return this.http.get<{ success: boolean; ratings: any[] }>(
      `${this.apiUrl}/rating/${sellerId}/ratings`
    ).pipe(
      tap(res => console.log('Seller ratings:', res)),
      catchError(() => of({ success: false, ratings: [] }))
    );
  }

  /** Get stats for dashboard */
  getStatsBySeller(sellerId: string): Observable<SellerStats> {
    return this.http.get<SellerStats>(`${this.apiUrl}/${sellerId}/stats`).pipe(
      tap(res => console.log('Seller stats:', res)),
      catchError(() => of({ totalProducts: 0, totalRevenue: 0, monthlySales: 0, totalCustomers: 0 }))
    );
  }

 
getCustomersBySeller(sellerId: string): Observable<any> {
  return this.http.get<any>(`http://localhost:3000/api/sellers/${sellerId}/customers`);
}
// seller.service.ts
updateSellerProfile(sellerId: string, formData: FormData) {
  return this.http.put(`http://localhost:3000/api/sellers/update/${sellerId}`, formData);
}
}