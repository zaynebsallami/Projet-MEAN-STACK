import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
 private apiUrl = 'http://localhost:3000/api/orders';

  constructor(private http: HttpClient) { }
  // Dans product.service.ts (ou order.service.ts)
getSellerOrders(sellerId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/seller/${sellerId}`);
}
getOrdersBySeller(sellerId: string): Observable<{ success: boolean; orders: any[] }> {
  return this.http.get<{ success: boolean; orders: any[] }>(`http://localhost:3000/api/orders/seller/${sellerId}`);
}
  // Met à jour le statut d'une commande
updateOrderStatus(orderId: string, status: string): Observable<any> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });
  
  return this.http.patch(
    `${this.apiUrl}/${orderId}/status`, 
    { status },
    { headers }
  );
}
   getSellerStats(sellerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/${sellerId}`);
  }
  // Dans orders.service.ts
getMonthlySales(sellerId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/monthly-sales/${sellerId}`);
}
}
