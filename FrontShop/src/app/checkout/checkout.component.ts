import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CartService, CartItem } from '../services/cart-service.service';
import { StripeService } from '../services/stripe.service';  // <-- Fix import case
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  ViewEncapsulation
} from '@angular/core';
interface ShippingInfo {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface PaymentInfo {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [CurrencyPipe],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CheckoutComponent implements OnInit, OnDestroy {
  shippingInfo: ShippingInfo = {
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: ''
  };

  paymentInfo: PaymentInfo = {
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  };

  cartItems: CartItem[] = [];
  itemCount = 0;
  subtotal = 0;
  shipping = 0;
  discount = 0;
  total = 0;

  private cartSubscription!: Subscription;

  constructor(
    private cartService: CartService,
    private http: HttpClient,
    private router: Router,
    private stripeService: StripeService  // <-- Fix import and injection
  ) {}

  ngOnInit(): void {
    this.cartSubscription = this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.calculateSummary();
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  calculateSummary() {
    this.itemCount = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    this.subtotal = this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.shipping = this.subtotal > 100 ? 0 : 10; // example shipping logic
    this.discount = 0; // no discount for now
    this.total = this.subtotal + this.shipping - this.discount;
  }

  placeOrder(form: NgForm) {
    if (form.invalid) {
      alert('Please fill out the form correctly.');
      return;
    }

    const paymentData = {
      items: this.cartItems.map(i => ({
        productId: i._id,
        quantity: i.quantity,
        price: i.price
      })),
      shippingInfo: this.shippingInfo,
      amount: Math.round(this.total * 100), // Stripe expects amount in cents
      currency: 'eur'  // better lowercase ISO code, but uppercase may also work
    };

    // Save order data locally BEFORE redirecting to Stripe
    localStorage.setItem('pendingOrder', JSON.stringify({
      cartItems: this.cartItems.map(item => ({
    _id: item._id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    sellerId: item.sellerId  // <-- add this here
  })),
  shippingInfo: this.shippingInfo,
  total: this.total
})),

    this.stripeService.createCheckoutSession(paymentData).subscribe({
      next: (session: { url?: string }) => {
        if (session.url) {
          window.location.href = session.url; // redirect to Stripe checkout
        } else {
          alert('Stripe session failed.');
        }
      },
     error: (err: unknown) => {
    console.error('Stripe checkout error:', err);
    alert('Error during payment process.');
  }

    });
  }
}
