import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  constructor(private http: HttpClient) {}

createCheckoutSession(data: any): Observable<{ url: string }> {
  return this.http.post<{ url: string }>('http://localhost:3000/api/stripe/create-checkout-session', data);
}

}
