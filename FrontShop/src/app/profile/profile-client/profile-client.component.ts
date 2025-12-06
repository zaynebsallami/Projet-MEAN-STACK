import { Component, OnInit } from '@angular/core';
import { Router,ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeAr from '@angular/common/locales/ar';
import { CartService } from "../../services/cart-service.service";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  ElementRef,
  ViewEncapsulation
} from '@angular/core';

import { Title, Meta } from '@angular/platform-browser';
registerLocaleData(localeFr);
registerLocaleData(localeAr);
interface User {
  _id: string;
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: Date | null;
  avatar?: string;
  role: string;
  nombreCommandes: number;
  wishlistCount: number;
  emailVerified: boolean;
  createdAt: Date;
  lastLogin?: Date | null;
  gender?: string;
  preferences: {
    darkMode: boolean;
    newsletter: boolean;
    language: string;
    notifications?: {
      email: boolean;
      push: boolean;
    };
  };
}
 export interface Activity {
  _id: string;
  userId: string;
  type: 'login' | 'order' | 'wishlist' | 'profile_update' | 'password_change';
  description: string;
  metadata?: any;
  createdAt: string | Date;
  updatedAt: string | Date;

  // UI only
  icon?: string;
  title?: string;
}

interface InvoiceItem {
  productId: {
    _id: string;
    name: string;
    image?: string;
    price: number;
  };
  quantity: number;
  total: number;
}

interface Invoice {
  _id: string;
  orderId: string;
  createdAt: Date | string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
}


interface Order {
  _id: string;   // use _id from backend
  createdAt: string | Date;  // you use createdAt, not date
  status: string;
  products: {
   productId: {
    _id: string;
    name: string;
    image?: string;
  };
  quantity: number;
  price: number;
  }[];
  total: number;
  currency?: string; 
}
interface OrderProduct {
  productId: {
    _id: string;
    name: string;
    image?: string;
  };
  quantity: number;
  price: number;
}

interface WishlistItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  sellerId: string; 
}
type TabType = 'profile' | 'orders' | 'wishlist' | 'settings' | 'invoices';

@Component({
  selector: 'app-profile-client',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './profile-client.component.html',
  styleUrls: ['./profile-client.component.scss']
})
export class ProfileClientComponent implements OnInit {
 user: User | null = null;
  loading = true;

invoices: Invoice[] = [];
selectedInvoice: Invoice | null = null;
isInvoiceModalOpen = false;


  emailChange = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordChangeSuccess: string = '';
  passwordChangeError: string = '';


  darkMode = false;
  newsletter = false;
  selectedLanguage = 'en';
  
  activeTab: TabType = 'profile';

  fabMenuOpen = false;
  showEditModal = false;
  showFieldEditModal = false;
  showDeleteModal = false;
  showDeactivateModal = false;
  showPasswordModal = false;
  showAvatarModal = false;

  notificationEmail = false;
  notificationPush = false;
  showNotificationSettings = false;

  recentActivities: Activity[] = [];
  recentOrders: Order[] = [];
  wishlistItems: WishlistItem[] = [];

  editingField = '';
  fieldEditValue = '';
  selectedFile: File | null = null;
  avatarPreview: string | ArrayBuffer | null = null;

  headerGradient = {
    from: '#ff7f50',
    to: '#ff69b4'
  };

  editForm = {
    nom: '',
    telephone: '',
    adresse: '',
    dateNaissance: '',
    gender: ''
  };

  constructor(
    private http: HttpClient, 
    private router: Router,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private title: Title, private meta: Meta,
    private cartService: CartService,
    
  ) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
    this.translate.onLangChange.subscribe(() => {
      this.cdr.markForCheck();
    });
  }
ngOnInit(): void {
  this.loadInitialData();
  this.setMetaTags();
  this.handleTabQueryParam();
  this.loadNotifications();
}
getWishlistImageUrl(image?: string | null): string {
  const baseUrl = 'http://localhost:3000/uploads';
  if (!image) return `${baseUrl}/default-product.png`;

  // Si l'image est déjà une URL absolue
  if (image.startsWith('http')) return image;

  return `${baseUrl}/${image}`;
}
getOrderImageUrl(image?: string | null): string {
  const baseUrl = 'http://localhost:3000/uploads';
  if (!image) return `${baseUrl}/default-product.png`;

  if (image.startsWith('http')) return image;

  return `${baseUrl}/${image}`;
}



handleImageError(event: Event) {
  const imgElement = event.target as HTMLImageElement;
  imgElement.src = 'assets/images/product-placeholder.jpg';
}
private setMetaTags(): void {
  // Fallback values before translation
  this.title.setTitle('My Profile');
  this.meta.updateTag({ name: 'description', content: 'Manage your personal information, orders, wishlist, and account settings.' });

  this.translate.get('PAGE_TITLE.PROFILE').subscribe(translatedTitle => {
    this.title.setTitle(translatedTitle);
  });

  this.translate.get('PAGE_DESC.PROFILE').subscribe(translatedDesc => {
    this.meta.updateTag({ name: 'description', content: translatedDesc });
  });
}

private handleTabQueryParam(): void {
  this.route.queryParams.subscribe(params => {
    const tab = params['tab'] as TabType;
    const allowedTabs: TabType[] = ['profile', 'orders', 'wishlist', 'settings'];
    this.activeTab = allowedTabs.includes(tab) ? tab : 'profile';
  });
}


setActiveTab(tab: TabType): void {
  this.activeTab = tab;
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { tab },
    queryParamsHandling: 'merge', // keep other query params
  });
}

  getTranslatedMonth(date: Date): string {
    const monthIndex = date.getMonth();
    let monthName = '';
    this.translate.get('MONTHS').subscribe((months: string[]) => {
      monthName = months[monthIndex] || '';
    });
    return monthName;
  }
getFormattedDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '';

  const date = new Date(dateInput);
  const day = date.getDate();
  const year = date.getFullYear();
  const monthIndex = date.getMonth();

  const lang = this.selectedLanguage || 'en'; // use current language
  let formattedDate = '';

  this.translate.get('MONTHS').subscribe((months: string[]) => {
    let monthName = months[monthIndex] || '';

    if (lang === 'ar') {
      formattedDate = `${this.toArabicNumber(day)} ${monthName} ${this.toArabicNumber(year)}`;
    } else {
      formattedDate = `${day} ${monthName} ${year}`;
    }
  });

  return formattedDate;
}

// Helper: convert numbers to Arabic numerals
private toArabicNumber(input: number | string): string {
  return input.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
}




private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('authToken');
  console.log('Token from localStorage:', token);  // Add this debug line
  return new HttpHeaders({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  });
}

  private loadInitialData(): void {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    this.router.navigate(['/login']);
    return;
  }
  this.loadUserProfile();
}


  loadUserProfile(): void {
    this.http.get<{ success: boolean; user: User }>('http://localhost:3000/api/users/me', {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        if (response.success && response.user) {
          const prefs = response.user.preferences || {
            darkMode: false,
            newsletter: false,
            language: 'en',
            notifications: {
              email: false,
              push: false
            }
          };


          if (!prefs.notifications) {
            prefs.notifications = {
              email: false,
              push: false
            };
          }

          this.user = {
            ...response.user,
            dateNaissance: this.parseDate(response.user.dateNaissance),
            lastLogin: this.parseDate(response.user.lastLogin),
            createdAt: this.parseDate(response.user.createdAt) || new Date(),
            preferences: prefs,
            nombreCommandes: response.user.nombreCommandes ?? 0,

          };
          this.loadOrders();
          this.loadWishlist();

          this.darkMode = this.user.preferences.darkMode;
          this.newsletter = this.user.preferences.newsletter;
          this.selectedLanguage = this.user.preferences.language;
          this.notificationEmail = this.user.preferences.notifications?.email ?? false;
          this.notificationPush = this.user.preferences.notifications?.push ?? false;

          this.initEditForm();

          if (this.darkMode) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }

          this.translate.use(this.selectedLanguage);

          this.loading = false;
          this.cdr.markForCheck();
        } else {
          console.warn('User profile response invalid:', response);
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

private parseDate(date: any): Date | null {
  const parsed = Date.parse(date);
  return isNaN(parsed) ? null : new Date(parsed);
}

loadOrders(): void {
  if (!this.user) return;

  this.http
    .get<{ success: boolean; orders: Order[] }>(
      `http://localhost:3000/api/orders/user/${this.user._id}`,
      { headers: this.getAuthHeaders() }
    )
    .subscribe({
      next: (response) => {
        console.log('Orders API response:', response);

        if (response.success) {
          this.recentOrders = response.orders.map((order: Order) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            products: order.products.map((p: OrderProduct) => ({
              productId: p.productId
                ? {
                    ...p.productId,
                    image: p.productId.image || 'assets/images/product-placeholder.jpg',
                  }
                : {
                    _id: '',
                    name: 'Unknown Product',
                    image: 'assets/images/product-placeholder.jpg',
                  },
              quantity: p.quantity,
              price: p.price,
            })),
          }));

          if (this.user) {
            this.user.nombreCommandes = response.orders.length;
          }

          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error loading orders:', err);
      },
    });
}



  loadWishlist(): void {
    if (!this.user) return;

    this.http.get<{success: boolean; wishlist: WishlistItem[]}>(`http://localhost:3000/api/users/${this.user._id}/wishlist`,
  { headers: this.getAuthHeaders() }
).subscribe({
  next: (response) => {
    if (response.success) {
      this.wishlistItems = response.wishlist.map(item => ({
        ...item,
        image: item.image || 'assets/images/product-placeholder.jpg'
      }));

      // ✅ Update wishlist count here
      if (this.user) {
        this.user.wishlistCount = this.wishlistItems.length;
      }

      this.cdr.markForCheck();
    }
  },
  error: (err) => {
    console.error('Error loading wishlist:', err);
  }
});

  }

  getActivityIcon(type: string): string {
    switch(type) {
      case 'login': return 'fa-sign-in-alt';
      case 'order': return 'fa-shopping-cart';
      case 'wishlist': return 'fa-heart';
      case 'profile_update': return 'fa-user-edit';
      case 'password_change': return 'fa-key';
      default: return 'fa-info-circle';
    }
  }

  getActivityTitle(type: string): string {
    switch(type) {
      case 'login': return 'Logged In';
      case 'order': return 'Order Placed';
      case 'wishlist': return 'Wishlist Updated';
      case 'profile_update': return 'Profile Updated';
      case 'password_change': return 'Password Changed';
      default: return 'Activity';
    }
  }

addActivity(type: string, description: string): void {
  console.log('addActivity called with:', type, description);

  if (!this.user) return;

  const token = localStorage.getItem('authToken') || '';
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  this.http.post<{ success: boolean; activity: any }>(
    `http://localhost:3000/api/users/${this.user._id}/activities`,
    { type, description },
    { headers }
  ).subscribe({
    next: (res) => {
      if (res.success) {
        console.log('Activity added:', res.activity);
      } else {
        console.warn('Activity add response not successful', res);
      }
    },
    error: (err) => {
      console.error('Error adding activity:', err);
    }
  });
}




  private initEditForm(): void {
    if (!this.user) return;

    this.editForm = {
      nom: this.user.nom,
      telephone: this.user.telephone || '',
      adresse: this.user.adresse || '',
      dateNaissance: this.user.dateNaissance?.toISOString().split('T')[0] || '',
      gender: this.user.gender || ''
    };
  }

  // Modal Control Methods
  openEditModal(): void {
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  openFieldEditModal(field: string): void {
    if (!this.user) return;

    this.editingField = field;
    this.fieldEditValue = (this.user as any)[field] || '';

    if (field === 'dateNaissance' && this.user.dateNaissance) {
      this.fieldEditValue = this.user.dateNaissance.toISOString().split('T')[0];
    }

    this.showFieldEditModal = true;
  }

  closeFieldEditModal(): void {
    this.showFieldEditModal = false;
    this.editingField = '';
    this.fieldEditValue = '';
  }


  // Profile Actions
 emailUpdateSuccess = '';
emailUpdateError = '';

updateEmail(): void {
  this.emailUpdateSuccess = '';
  this.emailUpdateError = '';

  if (!this.user || !this.emailChange || this.emailChange === this.user.email) {
    this.emailUpdateError = this.translate.instant('ENTER_VALID_EMAIL');
    return;
  }

  this.http.put(
    `http://localhost:3000/api/users/${this.user._id}`,
    { email: this.emailChange },
    { headers: this.getAuthHeaders() }
  ).subscribe({
    next: () => {
      if (this.user) {
        this.user.email = this.emailChange;
      }
      this.emailChange = '';
      this.emailUpdateSuccess = this.translate.instant('EMAIL_UPDATED_SUCCESSFULLY');
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('Failed to update email:', err);
      this.emailUpdateError = this.translate.instant('EMAIL_UPDATE_FAILED');
      this.cdr.markForCheck();
    }
  });
}

changePassword(): void {
  this.passwordChangeSuccess = '';
  this.passwordChangeError = '';

  if (!this.user) return;

  if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
    this.passwordChangeError = this.translate.instant('PLEASE_FILL_ALL_PASSWORD_FIELDS');
    return;
  }

  if (this.newPassword !== this.confirmPassword) {
    this.passwordChangeError = this.translate.instant('PASSWORDS_DO_NOT_MATCH');
    return;
  }

  this.http.post(
    `http://localhost:3000/api/users/${this.user._id}/change-password`,
    {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    },
    { headers: this.getAuthHeaders() }
  ).subscribe({
    next: () => {
      this.passwordChangeSuccess = this.translate.instant('PASSWORD_UPDATED_SUCCESSFULLY');
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';

      // Add activity log here:
      this.addActivity('password_change', 'User changed their password');

      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('Failed to change password:', err);
      this.passwordChangeError = this.translate.instant('PASSWORD_UPDATE_FAILED');
      this.cdr.markForCheck();
    }
  });
}

 saveProfileChanges(): void {
  if (!this.user) return;

  this.http.put(
    `http://localhost:3000/api/users/${this.user._id}`,
    this.editForm,
    { headers: this.getAuthHeaders() }
  ).subscribe({
    next: () => {
      this.loadUserProfile();
      this.closeEditModal();
      alert('Profile updated successfully');
      
      // Add activity log here:
      this.addActivity('profile_update', 'User updated profile information');

      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('Failed to update profile:', err);
    }
  });
}

  saveFieldEdit(): void {
    if (!this.user || !this.editingField) return;

    const update = { [this.editingField]: this.fieldEditValue };
    
    this.http.put(
      `http://localhost:3000/api/users/${this.user._id}`,
      update,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => {
        if (this.user) {
          (this.user as any)[this.editingField] = this.fieldEditValue;
        }
        this.closeFieldEditModal();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to update field:', err);
      }
    });
  }

  // Wishlist Actions
  removeFromWishlist(itemId: string): void {
    if (!this.user) return;

    this.http.delete(
      `http://localhost:3000/api/users/${this.user._id}/wishlist/${itemId}`,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => {
        this.wishlistItems = this.wishlistItems.filter(item => item._id !== itemId);
        if (this.user) {
          this.user.wishlistCount = Math.max(0, this.user.wishlistCount - 1);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to remove from wishlist:', err);
      }
    });
  }

  // UI Helpers
  toggleFabMenu(): void {
    this.fabMenuOpen = !this.fabMenuOpen;
    this.cdr.markForCheck();
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    this.updatePreferences();
  }

  toggleNewsletter(): void {
    this.newsletter = !this.newsletter;
    this.updatePreferences();
  }



  updatePreferences(): void {
    if (!this.user) return;

    const preferences = {
      darkMode: this.darkMode,
      newsletter: this.newsletter,
      language: this.selectedLanguage,
      notifications: {
        email: this.notificationEmail,
        push: this.notificationPush
      }
    };

    this.http.put(
      `http://localhost:3000/api/users/${this.user._id}/preferences`,
      { preferences },
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => {
        this.user!.preferences = preferences;
        this.translate.use(preferences.language);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to update preferences:', err);
      }
    });
  }

  // Navigation
  goToCart(): void {
    this.router.navigate(['/panier']);
  }

  goToShop(): void {
    this.router.navigate(['/category']);
  }

  contactSupport(): void {
    this.router.navigate(['/contact']);
  }

selectedOrderProducts: OrderProduct[] = [];
isOrderModalOpen = false;

viewOrderDetails(orderId: string): void {
  const order = this.recentOrders.find(o => o._id === orderId);
  if (order && order.products) {
    this.selectedOrderProducts = order.products;
    this.isOrderModalOpen = true;
    this.cdr.markForCheck();
  }
}
goToProduct(productId: string): void {
  this.router.navigate(['/product', productId]);
}

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  // Utility Methods
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreview = reader.result;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  uploadAvatar(): void {
    if (!this.user || !this.selectedFile) return;

    const formData = new FormData();
    formData.append('avatar', this.selectedFile);

    this.http.post(
      `http://localhost:3000/api/users/${this.user._id}/avatar`,
      formData,
      { headers: this.getAuthHeaders().delete('Content-Type') }
    ).subscribe({
      next: (response: any) => {
        if (this.user && response.avatarUrl) {
          this.user.avatar = response.avatarUrl;
        }
        this.showAvatarModal = false;
        this.selectedFile = null;
        this.avatarPreview = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to upload avatar:', err);
      }
    });
  }

  reorderItems(orderId: string): void {
    alert(`Reordering items from order ${orderId}`);
    // Implement actual reorder logic
  }

 addToCart(item: WishlistItem): void {
  this.cartService.addToCart({
    _id: item._id,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: 1,
    sellerId: item.sellerId || '', 
  });

  this.removeFromWishlist(item._id);
}


  openAvatarUpload(): void {
    this.showAvatarModal = true;
  }

  // Account Actions
  confirmDeactivate(): void {
  this.accountMessage = '';
  this.accountError = '';
  this.showDeactivateModal = true;
}

confirmDelete(): void {
  this.accountMessage = '';
  this.accountError = '';
  this.showDeleteModal = true;
}

closeDeactivateModal(): void {
  this.showDeactivateModal = false;
}

closeDeleteModal(): void {
  this.showDeleteModal = false;
}



// Messages
accountMessage = '';
accountError = '';


deactivateAccount(): void {
  if (!this.user) return;

  this.http.put(
    `http://localhost:3000/api/users/${this.user._id}/deactivate`,
    {},
    { headers: this.getAuthHeaders() }
  ).subscribe({
    next: () => {
      this.closeDeactivateModal();
      this.logout();
      this.accountMessage = 'Account has been deactivated';
      this.accountError = '';
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('Error deactivating account:', err);
      this.accountError = 'Failed to deactivate account';
      this.accountMessage = '';
      this.cdr.markForCheck();
    }
  });
}
deleteAccount(): void {
  if (!this.user) return;

  console.log('Deleting user ID:', this.user._id);
  console.log('Auth Headers:', this.getAuthHeaders());

  this.http.delete(
    `http://localhost:3000/api/users/${this.user._id}`,
    { headers: this.getAuthHeaders() }
  ).subscribe({
    next: () => {
      this.closeDeleteModal();
      this.logout();
      this.accountMessage = 'Account has been permanently deleted';
      this.accountError = '';
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('Error deleting account:', err);
      this.accountError = `Failed to delete account (Status: ${err.status})`;
      this.accountMessage = '';
      this.cdr.markForCheck();
    }
  });
}




  // Edit Profile Method
  editProfile(): void {
    if (this.user) {
      this.editForm = {
        nom: this.user.nom,
        telephone: this.user.telephone || '',
        adresse: this.user.adresse || '',
        dateNaissance: this.user.dateNaissance?.toISOString().split('T')[0] || '',
        gender: this.user.gender || ''
      };
    }
    this.showEditModal = true;
  }

  // Newsletter Preference Method
  updateNewsletterPreference(): void {
    if (!this.user) return;

    const newValue = this.newsletter;
    
    this.http.put(
      `http://localhost:3000/api/users/${this.user._id}/preferences`,
      { newsletter: newValue },
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => {
        if (this.user?.preferences) {
          this.user.preferences.newsletter = newValue;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to update preference:', err);
        this.newsletter = !newValue;
        alert('Failed to update newsletter preference');
        this.cdr.markForCheck();
      }
    });
  }

 notificationSuccess = '';
notificationError = '';

toggleNotification(type: 'email' | 'push'): void {
  this.notificationSuccess = '';
  this.notificationError = '';

  if (!this.user) return;

  if (type === 'email') {
    this.notificationEmail = !this.notificationEmail;
  } else if (type === 'push') {
    this.notificationPush = !this.notificationPush;
  }

  const updatedPreferences = {
    ...this.user.preferences,
    notifications: {
      email: this.notificationEmail,
      push: this.notificationPush,
    }
  };

  this.http.put(
    `http://localhost:3000/api/users/${this.user._id}/preferences`,
    { preferences: updatedPreferences },
    { headers: this.getAuthHeaders() }
  ).subscribe({
    next: () => {
      if (this.user) {
        this.user.preferences = updatedPreferences;
      }
      this.notificationSuccess = this.translate.instant('NOTIFICATIONS_UPDATED');
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('Failed to update notification preferences:', err);
      if (type === 'email') {
        this.notificationEmail = !this.notificationEmail;
      } else if (type === 'push') {
        this.notificationPush = !this.notificationPush;
      }
      this.notificationError = this.translate.instant('NOTIFICATIONS_UPDATE_FAILED');
      this.cdr.markForCheck();
    }
  });
}


  openNotificationSettings(): void {
    if (!this.user) return;

    const notifications = this.user.preferences.notifications || { email: false, push: false };

    this.notificationEmail = notifications.email;
    this.notificationPush = notifications.push;
    this.showNotificationSettings = true;
    this.cdr.markForCheck();
  }

  closeNotificationSettings(): void {
    this.showNotificationSettings = false;
    this.cdr.markForCheck();
  }
  notifications: { title: string; message: string; createdAt: Date }[] = [];

loadNotifications(): void {
  if (!this.user) return;

  this.http.get<{ success: boolean; notifications: any[] }>(
    `http://localhost:3000/api/notifications/${this.user._id}`,
    { headers: this.getAuthHeaders() }
  ).subscribe({
    next: (res) => {
      if (res.success) {
        this.notifications = res.notifications.map(n => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
        this.cdr.markForCheck();
      }
    },
    error: (err) => {
      console.error('Failed to load notifications:', err);
    }
  });
}
 loadInvoices(): void {
  if (!this.user) return;

  this.http.get<{ success: boolean; invoices: Invoice[] }>(
    `http://localhost:3000/api/invoices/user/${this.user._id}`,
    { headers: this.getAuthHeaders() }
  ).subscribe({
    next: (res) => {
      if (res.success) {
        this.invoices = res.invoices.map(inv => ({
          ...inv,
          createdAt: new Date(inv.createdAt)
        }));
        this.cdr.markForCheck();
      }
    },
    error: (err) => {
      console.error('Failed to load invoices:', err);
    }
  });
}
viewInvoice(invoiceId: string): void {
  const invoice = this.invoices.find(inv => inv._id === invoiceId);
  if (invoice) {
    this.selectedInvoice = invoice;
    this.isInvoiceModalOpen = true;
    this.cdr.markForCheck();
  }
}

closeInvoiceModal(): void {
  this.selectedInvoice = null;
  this.isInvoiceModalOpen = false;
}
downloadInvoice(order: Order) {
  // Get formatted date using your existing method
  const formattedDate = this.getFormattedDate(order.createdAt);

  // Generate invoice content
  const invoiceContent = `
Invoice #${order._id}
Date: ${formattedDate}
Total: ${order.total} ${order.currency || ''}

Products:
${order.products.map((p: OrderProduct) => `${p.productId.name} x${p.quantity} - ${p.price}`).join('\n')}
`;

  // Download as text file
  const blob = new Blob([invoiceContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice_${order._id}.txt`; 
  a.click();
  window.URL.revokeObjectURL(url);
}


}