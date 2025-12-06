import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { CartService } from '../services/cart-service.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // ✅ import this

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.scss']
})
export class OrderConfirmationComponent implements OnInit {
  isOrderSaved = false;
  loading = true;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private cartService: CartService,
    private router: Router
  ) {}
ngOnInit(): void {
  const sessionId = this.route.snapshot.queryParamMap.get('session_id');
  const orderData = localStorage.getItem('pendingOrder');

  if (!sessionId || !orderData) {
    this.loading = false;
    this.router.navigate(['/']);
    return;
  }

  this.http.get(`http://localhost:3000/api/stripe/session/${sessionId}`).subscribe({
    next: (session: any) => {
      if (session.payment_status === 'paid') {
        // Proceed to save order as you do now
        this.saveOrder(orderData);
      } else {
        this.loading = false;
        this.isOrderSaved = false;
      }
    },
    error: (err) => {
      console.error('Error verifying payment:', err);
      this.loading = false;
      this.isOrderSaved = false;
    }
  });
}

saveOrder(orderData: string) {
  const { cartItems, shippingInfo, total } = JSON.parse(orderData);
  const orderPayload = {
    products: cartItems.map((item: any) => ({
      productId: item._id,
      sellerId: item.sellerId,
      quantity: item.quantity,
      price: item.price
    })),
    total,
    shippingAddress: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`,
    paymentMethod: 'card'
  };

  this.http.post('http://localhost:3000/api/orders', orderPayload).subscribe({
    next: () => {
      this.isOrderSaved = true;
      this.loading = false;
      localStorage.removeItem('pendingOrder');
      this.cartService.clearCart().subscribe();
    },
    error: (err) => {
      console.error('❌ Failed to save order:', err);
      this.loading = false;
      this.isOrderSaved = false;
    }
  });
}

}
