import { Component, Input, Output, EventEmitter,  OnInit,  OnDestroy,  OnChanges } from "@angular/core"
import { CommonModule, CurrencyPipe } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { catchError, finalize, of } from "rxjs"
import { WishlistService } from '../services/wishlist.service'; 
import { ViewEncapsulation } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
// REGULAR imports (not type-only) for dependency injection
import  { ProductService } from "../services/product.service"
import  { CartService } from "../services/cart-service.service"
import { Router } from "@angular/router"
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Location } from '@angular/common';
import { AuthService } from '../services/auth.service'; // adjust path if needed

@Component({
  selector: "app-product-details",
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe,TranslateModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: "./product-details.component.html",
  styleUrls: ["./product-details.component.scss"],
})
export class ProductDetailsComponent implements OnInit, OnDestroy, OnChanges {
   @Input() productId: string | null = null
  @Input() isVisible = false
  @Output() closeModalEvent = new EventEmitter<void>()
  @Output() productChanged = new EventEmitter<string>()
   private routeSub?: Subscription;
  product: any = null
  relatedProducts: any[] = []
  isLoading = false
  error: string | null = null
  quantity = 1
  notFound = false
  isRouteView = false;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public router: Router,
    private wishlistService: WishlistService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private location: Location,
    private authService: AuthService, // ✅ add this line
 


  ) {this.translate.setDefaultLang('en');
    this.translate.use('en');}

  ngOnInit(): void {
      this.isRouteView = this.router.url.startsWith('/product/'); // ✅ detect route use

      this.routeSub = this.route.paramMap.subscribe(params => {
      this.productId = params.get('id');
      if (this.productId) {
        this.loadProductDetails(this.productId);
      }
    });
    document.addEventListener("keydown", this.handleEscapeKey.bind(this));
  }

 ngOnDestroy() {
  this.routeSub?.unsubscribe();
  if (!this.isRouteView) {
    document.removeEventListener("keydown", this.handleEscapeKey.bind(this));
  }
}

goToSeller(sellerId: string): void {
  this.closeModal(); // optional: close the modal first
  this.router.navigate(['/boutique-seller', sellerId]);
}


  ngOnChanges(): void {
    if (this.isVisible && this.productId) {
      this.loadProductDetails(this.productId)
    }
  }

  private handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === "Escape" && this.isVisible) {
      this.closeModal()
    }
  }

  private loadProductDetails(productId: string): void {
  this.isLoading = true;
  this.error = null;
  this.notFound = false;
  this.quantity = 1;

  this.productService
    .getProductById(productId)
    .pipe(
      catchError((error) => {
        if (error.status === 404) {
          this.notFound = true;
          this.error = "The product you are looking for does not exist or has been removed.";
        } else {
          this.error = "Failed to load product details. Please try again later.";
        }
        console.error("Error loading product:", error);
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      }),
    )
    .subscribe((product) => {
      if (product) {
        // Normalize sellerId from product or nested seller object
        const sellerIdFromProduct = product.sellerId || product.seller?._id || '';

        this.product = {
          ...product,
          image: this.getProductImageUrl(product.image),
          seller: product.seller || {},
          sellerId: sellerIdFromProduct,
        };

        // Optional: Log to verify sellerId presence
        if (!sellerIdFromProduct) {
          console.warn(`Warning: Product ${productId} has no sellerId assigned.`);
        }

        this.loadRelatedProducts(product.category?._id);
      }
    });
}


  private loadRelatedProducts(categoryId: string): void {
    if (!categoryId) return

    this.productService
      .getProductsByCategory(categoryId)
      .pipe(catchError(() => of([])))
      .subscribe((products) => {
        this.relatedProducts = products
          .filter((p) => p._id !== this.product._id)
          .slice(0, 4)
          .map((product) => ({
            ...product,
            image: this.getProductImageUrl(product.image),
          }))
      })
  }

  addToCart(): void {
  if (this.product) {
    const cartItem = {
      _id: this.product._id,
      name: this.product.name,
      price: this.product.price,
      image: this.product.image,
      quantity: this.quantity,
      sellerId: this.product.sellerId,
    };
    this.cartService.addToCart(cartItem).subscribe(() => {
this.showFeedback('🛒 Added to cart!');
      this.quantity = 1;
    });
  }
}

addToWishlist(): void {
  const userId = this.authService.getCurrentUserId();

  if (!userId) {
    this.showFeedback('⚠️ Please login to add items to wishlist');
    return;
  }

  if (this.product) {
    this.wishlistService.addItem(userId, {
      _id: this.product._id,
      name: this.product.name,
      price: this.product.price,
      image: this.product.image,
      sellerId: this.product.sellerId || this.product.seller?._id || '',
    }).subscribe({
      next: () => this.showFeedback('❤️ Added to wishlist!'),
      error: err => {
        console.error('Wishlist error:', err);
        this.showFeedback('⚠️ Failed to add to wishlist');
      }
    });
  }
}


feedbackMessage: string | null = null;
private feedbackTimeout: any;

showFeedback(message: string): void {
  // Clear any existing timeout
  if (this.feedbackTimeout) {
    clearTimeout(this.feedbackTimeout);
  }

  this.feedbackMessage = message;
  
  // Close both after 2 seconds
  this.feedbackTimeout = setTimeout(() => {
    this.feedbackMessage = null;
    this.closeModal(); // This closes the main modal
  }, 1500);
}



  openRelatedProduct(product: any): void {
    this.productChanged.emit(product._id)
  }

  increaseQuantity(): void {
    this.quantity++
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--
    }
  }
  
  closeModal(): void {
   if (this.isRouteView) {
      this.location.back(); // Go back when opened via route
  } else {
    this.isVisible = false;
    this.closeModalEvent.emit();
  }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement
    img.src = "assets/default-product.png"
  }

 getProductImageUrl(imagePath: string): string {
  if (!imagePath || imagePath.trim() === '') return 'https://via.placeholder.com/300x300?text=No+Image';

  const trimmed = imagePath.trim().toLowerCase();

  if (trimmed.startsWith('http') || trimmed.startsWith('data:')) {
    return imagePath; // return original with original casing
  }

  if (imagePath.startsWith('assets/') || imagePath.includes('../assets/')) {
    return imagePath.replace('../', '');
  }

  return `http://localhost:3000/uploads/${imagePath}`;
}


}
