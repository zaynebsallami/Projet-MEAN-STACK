import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostListener,
    OnInit,
    ElementRef,
    ViewEncapsulation
  } from '@angular/core';
  import { FormsModule } from '@angular/forms';
  import { RouterModule, Router } from '@angular/router';
  import { CommonModule } from '@angular/common';
  import { TranslateService, TranslateModule } from '@ngx-translate/core';
  import { CategoryService } from '../services/category.service';
  import { ProductService } from '../services/product.service';
  import { CategoryProductService } from '../services/category-product-service.service';
  import { Category, Subcategory } from '../models/category.model';
  import { AuthService } from '../services/auth.service';
  import { WishlistService } from '../services/wishlist.service';
  import { CartService } from '../services/cart-service.service';

  @Component({
    selector: 'app-header',
    standalone: true,
    imports: [FormsModule, RouterModule, TranslateModule, CommonModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
  })
  export class HeaderComponent implements OnInit {

    searchQuery: string = '';
    selectedLanguage: string = 'en';
    isConnected: boolean = false;
    isDropdownOpen = false;
    isCategoryDropdownOpen = false;
    isLanguageOpen = false;
    currentLang = 'en';
    sellerId: string | null = null;

    selectedCategory: Category | null = null;
    selectedSubcategory: Subcategory | null = null;
    categories: Category[] = [];
    filteredProducts: any[] = [];
    role: string | null = null;

    wishlistCount = 0;
    cartCount = 0;
isLoggedIn: boolean = false; 

   constructor(
  private translate: TranslateService,
  private cdr: ChangeDetectorRef,
  private authService: AuthService,
  private router: Router,
  private wishlistService: WishlistService,  
  private cartService: CartService,
  private categoryService: CategoryService,
  private categoryProductService: CategoryProductService,
  private productService: ProductService,
  private elementRef: ElementRef
) {
  this.translate.setDefaultLang('en');
  this.translate.use('en');

  // Subscribe to auth changes
  this.authService.isAuthenticated$.subscribe((loggedIn) => {
    this.isConnected = loggedIn;
    this.isLoggedIn = loggedIn;

    // Update role
    const user = this.authService.getCurrentUser();
    this.role = user?.role || null;

    // Load wishlist and cart only if connected
    if (loggedIn && this.role === 'client') {
      this.loadWishlistCount();
      this.cartService.cart$.subscribe(cartItems => {
        this.cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        this.cdr.markForCheck();
      });
    } else {
      this.wishlistCount = 0;
      this.cartCount = 0;
    }

    this.cdr.markForCheck();
  });
}


ngOnInit(): void {
  this.initializeHeaderAuthState();

  // Existing category fetch and theme/lang setup
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') document.body.classList.add('dark-mode');

  const savedLang = localStorage.getItem('appLanguage') || 'en';
  this.currentLang = savedLang;
  this.translate.use(savedLang);

  this.categoryService.getCategories().subscribe(
    (data) => this.categories = data,
    (error) => console.error('Error fetching categories', error)
  );
}

// --- New method ---
private initializeHeaderAuthState(): void {
  const token = this.authService.getToken();
  const user = this.authService.getCurrentUserFromStorage();

  if (token && user) {
    this.isConnected = true;
    this.isLoggedIn = true;
    this.role = user.role;

    if (this.role === 'client') {
      this.loadWishlistCount(); // Load wishlist from service/localStorage
      this.cartService.cart$.subscribe(cartItems => {
        this.cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        this.cdr.markForCheck();
      });
    }
  } else {
    this.isConnected = false;
    this.isLoggedIn = false;
    this.role = null;
    this.wishlistCount = 0;
    this.cartCount = 0;
  }

  this.cdr.markForCheck();
}

  loadWishlistCount(): void {
    this.wishlistService.wishlistChanged.subscribe(wishlist => {
    this.wishlistCount = wishlist.length; // use length, because wishlist is an array
      });
    }
  private updateUserRole(): void {
    const user = this.authService.getCurrentUser(); // <-- you need to add this method to your AuthService (see below)
    this.role = user?.role || null;
    this.cdr.markForCheck();
  }

toggleDarkMode(): void {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}


  modalMessage: string | null = null;

  showModal(message: string) {
    this.modalMessage = message;
  }

  closeModal() {
    this.modalMessage = null;
  }

  handleCartClick(event: Event): void {
    if (!this.isConnected) {
      event.preventDefault();
      this.showModal(this.translate.instant('PLEASE_LOGIN_TO_ACCESS_CART'));
    }
  }

  handleWishlistClick(event: Event): void {
    if (!this.isConnected) {
      event.preventDefault();
      this.showModal(this.translate.instant('PLEASE_LOGIN_TO_ACCESS_WISHLIST'));
    }
  }
    // --- Category Navigation ---
    selectCategory(category: Category): void {
    console.log('Header selectCategory called:', category._id);
    this.selectedCategory = category;
    this.selectedSubcategory = null;
    this.router.navigate(['/category', category._id]).then(() => {
      this.toggleCategoryDropdown();
      this.scrollToTop();
    });
  }
  refreshConnectionState(): void {
    console.log('Connection state refreshed:', this.isConnected); // Debug
    this.cdr.detectChanges(); // Force la mise à jour du DOM
  }

    selectSubcategory(event: Event, subcategory: Subcategory): void {
      event.stopPropagation();
      this.selectedSubcategory = subcategory;
      if (this.selectedCategory)
        this.router.navigate(['/category', this.selectedCategory._id, 'subcategory', subcategory._id]);
      this.scrollToTop();
      this.toggleCategoryDropdown();
    }

    onCategoryClick(category: Category): void {
      this.router.navigate(['/category', category._id]);
      this.toggleCategoryDropdown();
    }

    onSubcategoryClick(category: Category, subcategory: Subcategory): void {
      this.router.navigate(['/category', category._id, 'subcategory', subcategory._id]);
      this.toggleCategoryDropdown();
    }

    navigateToCategory(category: any): void {
      this.router.navigate(['/category', category._id]);
      this.scrollToTop();
      this.toggleCategoryDropdown();
    }


    navigateToSubcategory(categoryId: string, subId: string): void {
      this.router.navigate(['/category', categoryId, 'subcategory', subId]);
      this.scrollToTop();
      this.toggleCategoryDropdown();
    }

    // --- Search ---
    onSearch(): void {
      if (this.searchQuery.trim()) {
        this.router.navigate(['/category'], {
          queryParams: { search: this.searchQuery }
        });
        this.toggleCategoryDropdown();
      }
    }

    // --- Dropdowns ---
    toggleDropdown(): void {
      this.isDropdownOpen = !this.isDropdownOpen;
    }

    toggleCategoryDropdown(): void {
      this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
    }

    toggleLanguageDropdown(): void {
      this.isLanguageOpen = !this.isLanguageOpen;
    }

    closeDropdown(): void {
      this.isDropdownOpen = false;
    }

    @HostListener('document:click', ['$event'])
    onOutsideClick(event: Event) {
      const clickedInside = this.elementRef.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.isDropdownOpen = false;
        this.isCategoryDropdownOpen = false;
        this.isLanguageOpen = false;
      }
    }

    // --- Auth ---
   logout(): void {
  this.authService.logout();
  this.isConnected = false;
  this.cartCount = 0;
  this.wishlistCount = 0;
  this.closeDropdown();
  this.cdr.detectChanges();
}

  onLogoClick(): void {
    if (this.isConnected) {
      this.router.navigate(['/seller-dashbord']);
    } else {
      this.scrollToTop();
    }
  }
    onLoginSelected(): void {
      this.router.navigate(['/login-se']);
      this.closeDropdown();
      this.scrollToTop();
    }

    onSignUpSelected(): void {
      this.router.navigate(['/login-se']);
      this.closeDropdown();
      this.scrollToTop();
    }

    // --- Language ---
   changeLanguage(event: Event): void {
  const lang = (event.target as HTMLInputElement).value;
  this.currentLang = lang;
  localStorage.setItem('appLanguage', lang);  // Save lang to localStorage
  this.translate.use(lang).subscribe(() => {
    this.cdr.markForCheck();
  });
}


    getLanguageName(code: string): string {
      switch (code) {
        case 'en': return 'English';
        case 'fr': return 'Français';
        case 'ar': return 'العربية';
        default: return '🌐';
      }
    }

    // --- Utility ---
    scrollToTop(): void {
      window.scrollTo(0, 0);
    }
    debugAuthState() {
    console.log('Current auth state:', {
      localStorage: localStorage.getItem('isAuthenticated'),
      serviceState: this.authService.isLoggedIn(),
      componentState: this.isConnected
    });
    
    // Force l'actualisation
    this.isConnected = this.authService.isLoggedIn();
    this.cdr.detectChanges();
  }
  @HostListener('document:click', ['$event'])
    onClickOutside(event: Event): void {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-container') && !target.closest('.dropdownc') && !target.closest('.nav-links')) {
        this.isCategoryDropdownOpen = false;
      }
    }
    
  }