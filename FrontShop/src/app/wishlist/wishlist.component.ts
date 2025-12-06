import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { WishlistService, WishlistItem } from '../services/wishlist.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { CartService } from '../services/cart-service.service'; 
import { AuthService } from '../services/auth.service'; // ✅

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [TranslateModule, FormsModule, CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent implements OnInit {
  wishlist: WishlistItem[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private wishlistService: WishlistService,
    private translate: TranslateService,
    private router: Router,
    private cartService:CartService,
    private cdr: ChangeDetectorRef,
      private authService: AuthService, // ✅ inject

  ) {
    this.translate.setDefaultLang("en");
    this.translate.use("en");
    this.translate.onLangChange.subscribe(() => this.cdr.markForCheck());
  }

  ngOnInit(): void {
    this.loadWishlist();
  }
getWishlistImageUrl(imageName: string | null | undefined): string {
  const filename = imageName ? imageName : 'default-product.png';
  return `http://localhost:3000/uploads/${filename}`;
}


  loadWishlist(): void {
  const userId = this.authService.getCurrentUserId(); // ✅ you need a method like this

  if (!userId) {
    this.error = 'User not authenticated';
    this.loading = false;
    return;
  }

  this.loading = true;
  this.error = null;

  this.wishlistService.loadWishlist(userId).subscribe({
    next: () => {
      this.wishlist = this.wishlistService.getWishlist(); // from localStorage
      this.loading = false;
      this.cdr.markForCheck();
    },
    error: () => {
      this.error = 'Failed to load wishlist';
      this.loading = false;
      this.cdr.markForCheck();
    }
  });
}

removeItem(productId: string): void {
  const userId = this.authService?.getCurrentUserId?.(); // <- FIX HERE

  if (!userId) {
    this.error = 'User not logged in';
    return;
  }

  this.wishlistService.removeItem(userId, productId).subscribe(() => {
    this.loadWishlist();
  });
}


  clearWishlist(): void {
    this.wishlistService.clearWishlist();
    this.loadWishlist();
  }
    moveToCart(item: WishlistItem): void {
    // You'll need to inject CartService in the constructor
    this.cartService.addToCart({
      _id: item._id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      sellerId: item.sellerId || '', 
    });
    this.removeItem(item._id); // Remove from wishlist after adding to cart
    this.cdr.markForCheck();
  }
}
