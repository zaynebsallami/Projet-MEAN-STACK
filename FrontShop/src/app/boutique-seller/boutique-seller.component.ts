import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ProductService } from "../services/product.service";
import { SellerService, Seller } from "../services/seller.service";
import { CartService } from "../services/cart-service.service";
import { RateSellerResponse } from '../services/seller.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from "../services/auth.service";
import {
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: "app-boutique-seller",
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, FormsModule],
  templateUrl: "./boutique-seller.component.html",
  styleUrls: ["./boutique-seller.component.scss"],
  encapsulation: ViewEncapsulation.None
})
export class BoutiqueSellerComponent implements OnInit {
  sellerId = "";
  seller: Seller | null = null;
  products: any[] = [];
  loading = true;
  error = "";
  selectedProduct: any = null;
  loadingModalContent = false;  // <-- Added loading flag for modal
  showQuickView = false;
  confirmationMessage: string | null = null;
  currentUser: any = null; 
  isRatingSubmitted = false;
sellerRatings: any[] = []; // tableau d'avis initialisé vide
hoverRating: number = 0;
showReviews: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private sellerService: SellerService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private authservice:AuthService,  
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.sellerId = params["id"];
      this.currentUser = this.authservice.getCurrentUser(); 
      console.log("🔍 BOUTIQUE DEBUG - Seller ID from URL:", this.sellerId);
      this.loadSellerData();
this.userLoggedIn = !!this.currentUser; // ✅ true si utilisateur connecté

    });
  }

  loadSellerData(): void {
    this.loading = true;
    this.error = "";

    console.log("🔍 BOUTIQUE DEBUG - Loading seller data for ID:", this.sellerId);

    this.sellerService.getSellerById(this.sellerId).subscribe({
      next: (sellerData) => {
        this.seller = sellerData;
        console.log("🔍 BOUTIQUE DEBUG - Seller data loaded:", this.seller);
        this.loadSellerProducts();
        this.cdr.markForCheck();
            this.loadSellerRatings();

      },
      error: (err) => {
        this.loading = false;
        this.error = "Failed to load seller information";
        console.error("🔍 BOUTIQUE DEBUG - Error loading seller:", err);
        this.cdr.markForCheck();
      },
    });
  }
getListProductImageUrl(image: any): string {
  const baseUrl = 'http://localhost:3000/uploads';
  if (!image) return `${baseUrl}/default-product.png`;

  if (typeof image === 'string') {
    // Si le backend renvoie une URL cassée du style "http://localhost:30001755..."
    if (image.startsWith('http://localhost:3000') && !image.includes('/uploads/')) {
      const fileName = image.replace('http://localhost:3000', '');
      return `${baseUrl}/${fileName}`;
    }
    // Si c’est une URL déjà correcte
    if (image.startsWith('http')) {
      return image;
    }
  }

  return `${baseUrl}/${image}`;
}


loadSellerProducts(): void {
  this.productService.getProductsBySellerId(this.sellerId).subscribe({
    next: (response: any) => {
      // Supporter tous les formats de réponse possibles
      if (Array.isArray(response)) {
        this.products = response;
      } else if (response?.data?.products) {
        this.products = response.data.products;
      } else if (Array.isArray(response.products)) {
        this.products = response.products;
      } else {
        this.products = [];
      }

      console.log("Produits chargés:", this.products);
      this.products.forEach(p => {
        console.log(`Image path for ${p.name}:`, p.image);
      });

      this.loading = false;
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error("Erreur chargement produits:", err);
      this.products = [];
      this.loading = false;
      this.cdr.markForCheck();
    }
  });
  console.log(this.products);

}
  loadSellerRatings(): void {
this.sellerService.getSellerRatings(this.sellerId).subscribe({
  next: (response: any) => {
    this.sellerRatings = response.ratings; // 👈 extraire le tableau
    console.log('✅ Avis chargés:', this.sellerRatings);
    this.cdr.markForCheck();
  }
});


}




  debugAllProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (allProducts) => {
        const matchingProducts = allProducts.filter((product) => {
          const productSellerId = typeof product.seller === "object" ? product.seller._id : product.seller;
          return productSellerId === this.sellerId;
        });

        console.log("🔍 BOUTIQUE DEBUG - Products matching seller ID:", matchingProducts);
      },
      error: (err) => {
        console.error("🔍 BOUTIQUE DEBUG - Error fetching all products:", err);
      },
    });
  }

  getSellerRating(): number {
    return this.seller?.rating || 0;
  }

  getProductCount(): number {
    return this.products.length;
  }
getStarArray(rating: number): boolean[] {
  const fullStars = Math.round(rating);
  return Array(5).fill(false).map((_, i) => i < fullStars);
}

  retryLoading(): void {
    this.loadSellerData();
  }

  viewProduct(product: any): void {
    this.router.navigate(["/product", product._id]);
  }
addToCart(event: Event, product: any): void {
  event.stopPropagation();

  this.cartService.addToCart(product).subscribe({
    next: () => {
      console.log("Product added to cart:", product.name);
      this.closeModal();

      this.confirmationMessage = `${product.name} added to cart!`;
      // Hide confirmation message after 3 seconds
      setTimeout(() => {
        this.confirmationMessage = null;
      }, 3000);
    },
    error: (err) => {
      console.error("Error adding product to cart:", err);
      this.confirmationMessage = `Failed to add ${product.name} to cart.`;
      setTimeout(() => {
        this.confirmationMessage = null;
      }, 3000);
    },
  });
}


handleImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.src = 'assets/default-product.png'; // 🚀 Angular servira automatiquement depuis /assets/
  img.onerror = null;
}
// TS stays the same


getModalProductImageUrl(imageName: string | null | undefined): string {
  if (!imageName) return 'assets/default-product.png'; // placeholder
  return `http://localhost:3000/uploads/${imageName}`;
}


 openModal(product: any): void {
  const productId = product._id || product.id;

  if (!productId) {
    console.error("Product ID is missing.");
    return;
  }

  this.selectedProduct = null;
  this.loadingModalContent = true;
  this.cdr.markForCheck();

  this.productService.getProductById(productId).subscribe({
    next: (res) => {
      const fullProduct = res?.product || res?.data?.product || res;
      console.log("✅ Full product fetched for modal:", fullProduct);
      this.selectedProduct = fullProduct;
      this.loadingModalContent = false;
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error("❌ Failed to load full product details:", err);
      this.selectedProduct = null;
      this.loadingModalContent = false;
      this.cdr.markForCheck();
    }
  });
}

  closeModal(): void {
    this.selectedProduct = null;
    this.loadingModalContent = false;
  }

  selectedRating = 0;
ratingComment = '';
ratingSuccessMessage = '';
ratingErrorMessage = '';
userLoggedIn = false; // valeur par défaut


selectRating(star: number) {
  console.log("🔍 BOUTIQUE DEBUG - selectRating called with star:", star);
  if (!this.currentUser) return;
  
  this.selectedRating = star;
  this.isRatingSubmitted = false; // Réinitialise l'état de soumission
  this.ratingErrorMessage = '';
}

submitRating() {
  console.log('Current token:', localStorage.getItem('token')); // Add this
  console.log('AuthService token:', this.authservice.getToken()); // And this
  if (!this.currentUser) {
    this.ratingErrorMessage = this.translate.instant('ERRORS.LOGIN_TO_RATE');
    return;
  }

  if (this.selectedRating === 0) {
    this.ratingErrorMessage = this.translate.instant('ERRORS.SELECT_RATING');
    return;
  }

  console.log("Submitting rating with:", {
    sellerId: this.sellerId,
    rating: this.selectedRating,
    comment: this.ratingComment,
    userId: this.currentUser._id
  });

  this.sellerService.rateSeller(
    this.sellerId, 
    this.selectedRating, 
    this.ratingComment
  ).subscribe({
    next: (res: RateSellerResponse) => {
      this.ratingSuccessMessage = this.translate.instant('RATING.SUCCESS');
      if (this.seller) {
        this.seller.rating = res.averageRating;
      }
      this.isRatingSubmitted = true;
      this.ratingComment = '';
      this.selectedRating = 0;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error("Full error:", err);
      this.ratingErrorMessage = err.error?.message || 
        this.translate.instant('ERRORS.RATING_FAILED');
      this.cdr.detectChanges();
    }
  });
}
getStorePhotoUrl(): string {
  if (this.seller?.boutique?.storePhoto) {
    return 'http://localhost:3000/' + this.seller.boutique.storePhoto.replace(/\\/g, '/');
  }
  return 'assets/d.jpg';
}

}
