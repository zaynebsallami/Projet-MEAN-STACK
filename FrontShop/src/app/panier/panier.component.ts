import { Component, type OnInit, type OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { CartService, CartItem } from "../services/cart-service.service";
import { Subscription, timer } from "rxjs";
import { StripeService } from '../services/stripe.service';
import { CheckoutComponent } from '../checkout/checkout.component';
import { trigger, transition, animate, style } from '@angular/animations';
import { ProductService } from "../services/product.service";
import { ProductComponent } from '../product/product.component';
import { ViewEncapsulation } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { Title, Meta } from '@angular/platform-browser';

interface RecommendedProduct {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  discount?: number;
  category: string;
}

interface Coupon {
  code: string;
  description: string;
  discount: number;
  type: "percentage" | "fixed" | "shipping";
}

interface ShippingInfo {
  icon: string;
  title: string;
  description: string;
  class: string;
}

@Component({
  selector: "app-panier",
  standalone: true,
     encapsulation: ViewEncapsulation.None,
  imports: [FormsModule, CommonModule, RouterModule, CheckoutComponent, ProductComponent,TranslateModule],
  templateUrl: "./panier.component.html",
  styleUrls: ["./panier.component.scss"],  // fixed property name
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ],
})
export class PanierComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  recommendedProducts: RecommendedProduct[] = [];
  isLoadingRecommended = true;

  private cartSubscription: Subscription | null = null;

  couponCode = "";
  appliedCoupon: string | null = null;
  discount = 0;
  freeShippingThreshold = 75;

  validCoupons: Coupon[] = [
    { code: "WELCOME10", description: "10% off your order", discount: 0.1, type: "percentage" },
    { code: "FREESHIP", description: "Free shipping", discount: 0, type: "shipping" },
    { code: "SAVE25", description: "$25 off orders over $100", discount: 25, type: "fixed" },
    { code: "NEWUSER", description: "15% off for new customers", discount: 0.15, type: "percentage" },
  ];

  shippingInfo: ShippingInfo[] = [
    {
      icon: "🚚",
      title: "Free Shipping",
      description: "On orders over $75",
      class: "shipping",
    },
    {
      icon: "⏱️",
      title: "Fast Delivery",
      description: "2-3 business days",
      class: "time",
    },
    {
      icon: "🔒",
      title: "Secure Payment",
      description: "SSL encrypted checkout",
      class: "security",
    },
  ];

  showCheckout = false;

  constructor(
    private router: Router,
    private cartService: CartService,
    private translate: TranslateService,
    private stripeService: StripeService,
    private productService: ProductService,
    private title: Title, private meta: Meta
  ) {this.translate.setDefaultLang('en');
    this.translate.use('en');}

  ngOnInit(): void {
    this.loadCartItems();
    this.title.setTitle('Shopping Cart');
    this.meta.updateTag({ name: 'description', content: 'Review your selected items before completing your purchase.' });
    this.translate.get('PAGE_TITLE.PROFILE').subscribe(title => {
    this.title.setTitle(title);
    });
    this.translate.get('PAGE_DESC.PROFILE').subscribe(desc => {
      this.meta.updateTag({ name: 'description', content: desc });
    });
    
    this.productService.getRecommendedProducts().subscribe({
      next: (products) => {
        this.recommendedProducts = products.map(p => this.fixImagePath(p));
        this.isLoadingRecommended = false;
      },
      error: (err) => {
        console.error('Error loading recommended products', err);
        this.isLoadingRecommended = false;
      }
    });
  }

  fixImagePath(product: any): any {
    if (!product.image) {
      return { ...product, image: 'assets/default-product.png' };
    }
    if (product.image.startsWith('../../')) {
      return { ...product, image: product.image.replace(/^(\.\.\/)+/, '') };
    }
    return product;
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  private loadCartItems(): void {
    this.cartService.getCart().subscribe({
      next: (data) => {
        this.cartItems = data.items;
      },
      error: (err) => {
        console.error("Error loading cart", err);
      }
    });

    this.cartSubscription = this.cartService.cart$.subscribe((items) => {
      this.cartItems = items;
    });
  }

  // Computed properties
  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get itemCount(): number {
    return this.cartService.getItemCount();
  }

  get shipping(): number {
    return this.subtotal >= this.freeShippingThreshold || this.appliedCoupon === "FREESHIP" ? 0 : 8.99;
  }



get total(): number {
  return this.subtotal + this.shipping - this.discount;
}



  get savedAmount(): number {
    const appliedCouponData = this.validCoupons.find((c) => c.code === this.appliedCoupon);
    if (!appliedCouponData) return 0;

    switch (appliedCouponData.type) {
      case "percentage":
        return this.subtotal * appliedCouponData.discount;
      case "fixed":
        return Math.min(appliedCouponData.discount, this.subtotal);
      case "shipping":
        return this.shipping > 0 ? 8.99 : 0;
      default:
        return 0;
    }
  }

  getItemCategory(item: CartItem): string {
    return "General"; // placeholder logic
  }

  isItemInStock(item: CartItem): boolean {
    return true; // placeholder logic
  }
  getItemImageUrl(image?: string | null): string {
  if (!image) return 'http://localhost:3000/uploads/default-product.png';
  if (image.startsWith('http')) return image;
  return `http://localhost:3000/uploads/${image}`;
}

getRecommendedProductImageUrl(image?: string | null): string {
  if (!image) return 'http://localhost:3000/uploads/default-product.png';
  // Si l'image vient du backend et commence par http/https, on la garde
  if (image.startsWith('http')) return image;
  return `http://localhost:3000/uploads/${image}`;
}
handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = 'http://localhost:3000/uploads/default-product.png';
  img.onerror = null; // pour éviter la boucle infinie
}

  // Cart operations
  updateQuantity(productId: string, newQuantity: number): void {
    if (newQuantity >= 1) {
      this.cartService.updateQuantity(productId, newQuantity).subscribe({
        next: () => console.log("Quantity updated successfully"),
        error: (err) => console.error("Error updating quantity:", err),
      });
    }
  }

  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId).subscribe({
      next: () => console.log("Item removed successfully"),
      error: (err) => console.error("Error removing item:", err),
    });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      next: () => {
        console.log("Cart cleared successfully");
        this.removeCoupon();
      },
      error: (err) => console.error("Error clearing cart:", err),
    });
  }
addToCart(product: RecommendedProduct): void {
  const cartItem: CartItem = {
    _id: product._id,
    name: product.name,
    price: product.price,
    quantity: 1,
    image: product.image,
    sellerId: (product as any).sellerId || '', // ✅ Fix: include sellerId, or fallback
  };

  this.cartService.addToCart(cartItem).subscribe({
    next: () => console.log("Product added to cart"),
    error: (err) => console.error("Error adding product to cart:", err),
  });
}


  // Coupon operations
  applyCoupon(): void {
    if (!this.couponCode.trim()) return;

    const coupon = this.validCoupons.find(
      (c) => c.code.toLowerCase() === this.couponCode.trim().toLowerCase()
    );

    if (coupon) {
      this.appliedCoupon = coupon.code;
      this.calculateDiscount(coupon);
      this.couponCode = "";
    } else {
      console.log("Invalid coupon code");
    }
  }

  applyCouponCode(code: string): void {
    this.couponCode = code;
    this.applyCoupon();
  }

  removeCoupon(): void {
    this.appliedCoupon = null;
    this.discount = 0;
  }

  private calculateDiscount(coupon: Coupon): void {
    switch (coupon.type) {
      case "percentage":
        this.discount = this.subtotal * coupon.discount;
        break;
      case "fixed":
        this.discount = Math.min(coupon.discount, this.subtotal);
        break;
      case "shipping":
        this.discount = 0; // shipping discount handled in getter
        break;
    }
  }

  continueToCheckout() {
    this.router.navigate(['/checkout'], { state: { cart: this.cartItems } });
  }

  // Delegate to cartService
  setCart(items: CartItem[]): void {
    this.cartService.setCart(items);
  }

  continueShopping(): void {
    this.router.navigate(["/category"]);
  }

  openCheckout() {
    this.showCheckout = true;
  }

  closeCheckout() {
    this.showCheckout = false;
  }

  trackByProductId(index: number, product: any): string | number {
    return product._id || product.id || index;
  }
}
