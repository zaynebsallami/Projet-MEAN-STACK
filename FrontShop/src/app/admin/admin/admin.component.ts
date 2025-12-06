import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Chart } from 'chart.js';
import { HeaderComponent } from '../header/header.component';
import { StatCardComponent } from '../stat-card/stat-card.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { ChartComponent } from '../chart/chart.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { UserService } from '../../services/user-service.service';
import { ProductService } from '../../services/product.service';
import { SellerService } from '../../services/seller.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { catchError, finalize, of } from 'rxjs';
import {
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';interface Order {
  _id: string;
  user?: {
    name: string;
    avatar?: string;
  };
  products: {
    product?: {
      name: string;
    };
    quantity: number;
  }[];
  total: number;
  status: string;
  createdAt: string;
}
interface SalesData {
  date: string;
  amount: number;
  count?: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    StatCardComponent,
    SidebarComponent,
    HeaderComponent,
    DataTableComponent,
    ChartComponent,
    TranslateModule
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  encapsulation: ViewEncapsulation.None,
 animations: [
  trigger('fadeInOut', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('300ms ease-in', style({ opacity: 1 }))
    ]),
    transition(':leave', [
      animate('300ms ease-out', style({ opacity: 0 }))
    ])
  ]),
  trigger('slideInOut', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(-20px) scale(0.95)' }),
      animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
    ]),
    transition(':leave', [
      animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px) scale(0.95)' }))
    ])
  ])
],
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
constructor(
    private userService: UserService,
    private productService: ProductService, 
        private sellerService: SellerService,
        private AdminService: AdminService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
        private translate: TranslateService,

  ) {
    {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }
  }
  productColumns = [
  { key: 'image', title: '', type: 'image' },
  { key: 'name', title: 'Nom' },
  { key: 'price', title: 'Prix', type: 'currency' },
  { key: 'category', title: 'Catégorie' },
  { key: 'stock', title: 'Stock', type: 'stock' }
];
  // Using signals for reactive state management (Angular 18 feature)
  dashboardStats = signal<any>(null);
  salesData = signal<any[]>([]);
  sellers = signal<any[]>([]);
customers = signal<any[]>([]); // Signal pour les clients uniquement
categories = signal<any[]>([]);
  userGrowthData = signal<any[]>([]);
  recentOrders = signal<any[]>([]);
  popularProducts = signal<any[]>([]);
  recentUsers = signal<any[]>([]);

  isCollapsed = signal<boolean>(false);
  activeTab = signal<string>('dashboard');
  isLoading = signal<boolean>(true);
  notifications = signal<any[]>([]);
  
  users = signal<any[]>([]);
  products = signal<any[]>([]);
orders = signal<any[]>([]);
  dashboardStatsData: any = {};
  isDarkMode = false;
orderSearchTerm = signal<string>('');
searchTerm = signal<string>('');
searchProductTerm = signal<string>('');
sellerSearchTerm = signal<string>('');

showSuccessModal = false;
showErrorModal = false;
showSubSuccessModal: boolean = false;
showSubErrorModal: boolean = false;
flashsales = signal<any[]>([]);
currentFlashSale: any = { name: '', startDate: '', endDate: '', discount: 0 ,isHighlighted: false};
isEditingFlashSale = false;
showFlashSaleModal = false;
showFlashSaleSuccess = false;
showFlashSaleError = false;
showFlashSaleConfirmDelete = false;
flashSaleToDeleteId: string | null = null;

  ngOnInit(): void {
    const savedDarkMode = localStorage.getItem("darkMode")
    this.loadDashboardData();
      this.loadCustomers(); // Chargement des clients seulement
        this.loadAllUsers(); // Remplace loadUsers() par loadAllUsers()
      this.loadProducts();
      this.loadSellers(); 
      this.loadOrders();
        this.loadCategories();
          this.loadFlashSales();



  }
loadCustomers(): void {
  this.adminService.getOnlyCustomers().subscribe(customers => {
    this.customers.set(customers);
  });
}
loadOrders(): void {
  this.isLoading.set(true);
  this.adminService.getAllOrders().subscribe({
    next: (orders) => {
      this.orders.set(orders);
      this.isLoading.set(false);
    },
    error: (err) => {
      console.error('Error:', err);
      this.isLoading.set(false);
    }
  });
}
toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode
    localStorage.setItem("darkMode", this.isDarkMode.toString())
  }
  loadProducts(): void {
  this.productService.getAllProducts().subscribe(products => {
    this.products.set(products);
  });
}
    loadSellers(): void {
    this.sellerService.getSellers().subscribe(sellers => {
      this.sellers.set(sellers);
    });
  }
loadAllUsers(): void {
  this.AdminService.getAllUsersAndSellers().subscribe(users => {
    this.users.set(users);
  });
}
 loadDashboardData(): void {
  this.isLoading.set(true);

  this.adminService.getDashboardStats().subscribe(data => {
    this.dashboardStats.set(data);
    this.cdr.detectChanges(); // <-- add this line
  });

  this.adminService.getSalesData().subscribe(data => {
    this.salesData.set(data);
    this.cdr.detectChanges();
  });

  this.adminService.getUserGrowthData().subscribe(data => {
    this.userGrowthData.set(data);
    this.cdr.detectChanges();
  });

  this.adminService.getRecentOrders().subscribe(data => {
    this.recentOrders.set(data);
    this.cdr.detectChanges();
  });

  this.adminService.getProducts().subscribe((data: any[]) => {
     const productsWithImage = data.map(p => ({
    ...p,
    image: this.getProductImageUrl(p.image) // 👈 ici
  }));
  this.popularProducts.set(productsWithImage); // ✅ utilise bien les produits avec image
    this.cdr.detectChanges();
  });

  this.adminService.getRecentUsers().pipe(
    catchError(err => {
      console.error('Erreur chargement utilisateurs récents', err);
      return of([]);
    }),
    finalize(() => {
      this.isLoading.set(false);
      this.cdr.detectChanges();
    })
  ).subscribe(data => {
    this.recentUsers.set(data);
    this.cdr.detectChanges();
  });
}
getProductImageUrl(image?: string | null): string {
  const baseUrl = 'http://localhost:3000/uploads'; // adapte si nécessaire
  if (!image) return `${baseUrl}/default-product.png`; // image par défaut
  if (image.startsWith('http')) return image;
  return `${baseUrl}/${image}`;
}

get filteredCustomers() {
  const term = this.searchTerm().toLowerCase().trim();
  if (!term) {
    return this.customers();
  }
  return this.customers().filter(c => 
    (c.nom?.toLowerCase().includes(term) || 
     c.name?.toLowerCase().includes(term) || 
     c.email?.toLowerCase().includes(term) || 
     (c.telephone || '').toLowerCase().includes(term))
  );
}

get filteredProducts() {
  const term = this.searchProductTerm().toLowerCase().trim();
  if (!term) {
    return this.products();
  }
  return this.products().filter(p =>
    p.name.toLowerCase().includes(term) ||
    (p.category?.name || '').toLowerCase().includes(term)
  );
}
get filteredOrders() {
  const term = this.orderSearchTerm().toLowerCase().trim();
  if (!term) {
    return this.orders();
  }
  return this.orders().filter(order => {
    // Par exemple on peut chercher par ID, boutique, status, etc.
    const orderId = order._id.toLowerCase();
    const boutiqueName = (order.products[0]?.seller?.boutique?.businessName || order.products[0]?.seller?.nom || '').toLowerCase();
    const status = order.status.toLowerCase();

    return orderId.includes(term) ||
           boutiqueName.includes(term) ||
           status.includes(term);
  });
}
get filteredSellers() {
  const term = this.sellerSearchTerm().toLowerCase().trim();
  if (!term) {
    return this.sellers();
  }
  return this.sellers().filter(seller =>
    (seller.nom?.toLowerCase().includes(term) ||
     seller.email?.toLowerCase().includes(term) ||
     (seller.telephone || '').toLowerCase().includes(term) ||
     (seller.boutique?.businessName || '').toLowerCase().includes(term))
  );
}

 


  toggleSidebar(): void {
    this.isCollapsed.update(value => !value);
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  updateOrderStatus(orderId: string, event: Event): void {
  const selectElement = event.target as HTMLSelectElement;
  const newStatus = selectElement.value;
  
  this.adminService.updateOrderStatus(orderId, newStatus).subscribe({
    next: () => {
      this.orders.update(orders => 
        orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    },
    error: (err) => console.error('Error updating order status:', err)
  });
}
  toggleTheme(): void {
  }

  exportData(type: string): void {
    this.adminService.exportData(type).subscribe(response => {
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin-${type}-export-${new Date().toISOString().split('T')[0]}.${type === 'csv' ? 'csv' : 'xlsx'}`;
      link.click();
      window.URL.revokeObjectURL(url);
      
    });
  }

deleteUser(userId: string) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
    return;
  }

  this.adminService.deleteUser(userId).subscribe({
    next: () => {
      // Mets à jour le signal "customers" car c’est celui utilisé dans le template
      const currentCustomers = this.customers();
      const updatedCustomers = currentCustomers.filter(c => c._id !== userId);
      this.customers.set(updatedCustomers);

      this.adminService.deleteUser(userId).subscribe({
    next: () => {
      this.customers.set(this.customers().filter(c => c._id !== userId));
    },
  });
    },
    error: (err) => {
      console.error('Erreur suppression client:', err);
    }
  });
}


// Dans admin.component.ts
deleteProduct(productId: string) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

  this.adminService.deleteProduct(productId).subscribe({
    next: () => {
      this.loadProducts();
    },
    error: (err) => {
      console.error('Erreur suppression:', err);
    }
  });
}

deleteSeller(sellerId: string) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce vendeur ?')) {
    return;
  }

  this.adminService.deleteVendor(sellerId).subscribe({
    next: () => {
      // Lire l'ancienne liste
      const updatedSellers = this.sellers().filter(s => s._id !== sellerId);
this.loadProducts();
      this.sellers.set(updatedSellers);
    },
    error: (err) => {
      console.error('Erreur suppression vendeur:', err);
    }
  });
}



filterOrders(): void {
  // Implémentez la logique de filtrage si nécessaire
}
getStatusText(status: string): string {
  switch(status) {
    case 'pending': return 'Pending';
    case 'processing': return 'Processing';
    case 'shipped': return 'Shipped';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}
loadCategories() {
  this.adminService.getCategories().subscribe({
    next: (data: any[]) => {
      console.log("📂 Catégories reçues:", data);
      this.categories.set(data);
    },
    error: (err: any) => console.error("❌ Erreur:", err)
  });
}
showAddCategoryModal = false;
isSubmitting = false;
newCategory = {
  name: '',
  description: '',
    image: null as File | null  // <- ajouter

};
// Pour le modal d'ajout de sous-catégorie
showAddSubCategoryModalFlag = false;
currentCategory: any = null; // catégorie sélectionnée
newSubCategory = {
  name: '',
};
onCategoryImageSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.newCategory.image = input.files[0];
  }
}

openAddCategoryModal(): void {
  this.showAddCategoryModal = true;
  this.newCategory = { name: '', description: '', image: null }; // Réinitialiser le formulaire
}
closeAddCategoryModal(): void {
  this.showAddCategoryModal = false;
}
openAddSubCategoryModal(category: any) {
  this.currentCategory = category; // stocke la catégorie parent
  this.newSubCategory = { name: '' }; // réinitialiser le formulaire
  this.showAddSubCategoryModalFlag = true;
}
closeAddSubCategoryModal() {
  this.showAddSubCategoryModalFlag = false;
  this.currentCategory = null;
}

// Soumettre le formulaire de catégorie
onSubmitCategory(): void {
  if (this.isSubmitting) return;

  if (!this.newCategory.name?.trim()) {
    return;
  }

  this.isSubmitting = true;

  // Créer un FormData pour inclure l'image
  const formData = new FormData();
  formData.append('name', `CATEGORY_${this.newCategory.name.trim().toUpperCase().replace(/\s+/g, '_')}`);
  formData.append('description', this.newCategory.description || '');
  
  if (this.newCategory.image) {
    formData.append('image', this.newCategory.image); // ← ajoute l'image
  }

  this.adminService.addCategory(formData).subscribe({
    next: (response) => {
      console.log('✅ Catégorie ajoutée:', response);
      this.isSubmitting = false;
      this.showAddCategoryModal = false;
      this.loadCategories();
      this.loadFlashSales();

      setTimeout(() => {
        this.showSuccessModal = true;
      }, 50);
    },
    error: (error) => {
      console.error('❌ Erreur lors de l\'ajout:', error);
      this.isSubmitting = false;
      this.showErrorModal = true;
    }
  });
}

onSubmitSubCategory() {
  if (!this.newSubCategory.name?.trim()) return;

  const subCategoryToSend = {
    name: this.newSubCategory.name.trim(),
    categoryId: this.currentCategory._id 
  };

  this.adminService.addSubCategory(subCategoryToSend).subscribe({
    next: (response) => {
      console.log('✅ Sous-catégorie ajoutée:', response);
      this.loadCategories(); // recharge les catégories avec les sous-catégories
      this.closeAddSubCategoryModal();
      this.showSubSuccessModal = true;  // ✅ Affiche le modal succès
        this.loadCategories();
    },
    error: (err) => {
      console.error('❌ Erreur ajout subcategory:', err);
       this.isSubmitting = false;
        this.showSubErrorModal = true;   // ❌ Affiche le modal erreur
    }
  });
}
// Pour confirmation suppression
showConfirmDeleteModal: boolean = false;
deleteTarget: { type: 'category' | 'subcategory', categoryId: string, subCategoryId?: string } | null = null;


deleteSubCategory(categoryId: string, subCategoryId: string) {
  if (confirm(this.translate.instant('MESSAGES.CONFIRM_DELETE_SUBCATEGORY'))) {
    this.adminService.deleteSubCategory(categoryId, subCategoryId).subscribe({
      next: () => {
        this.loadCategories(); // recharge la liste après suppression
      },
      error: (err: any) => {
        console.error('Erreur suppression sous-catégorie:', err);
      }
    });
  }
}

// Ouvrir le modal de confirmation
confirmDeleteCategory(categoryId: string) {
  this.deleteTarget = { type: 'category', categoryId };
  this.showConfirmDeleteModal = true;
}

confirmDeleteSubCategory(categoryId: string, subCategoryId: string) {
  this.deleteTarget = { type: 'subcategory', categoryId, subCategoryId };
  this.showConfirmDeleteModal = true;
}

// Action "OK"
onConfirmDelete() {
  if (!this.deleteTarget) return;

  if (this.deleteTarget.type === 'category') {
    this.deleteCategory(this.deleteTarget.categoryId);
  } else if (this.deleteTarget.type === 'subcategory' && this.deleteTarget.subCategoryId) {
    this.deleteSubCategory(this.deleteTarget.categoryId, this.deleteTarget.subCategoryId);
  }

  this.closeConfirmModal();
}

// Fermer le modal (Cancel ou après suppression)
closeConfirmModal() {
  this.showConfirmDeleteModal = false;
  this.deleteTarget = null;
}

deleteCategory(id: string) {
  this.adminService.deleteCategory(id).subscribe({
    next: () => this.loadCategories(),
    error: (err: any) => console.error(err)
  });}
viewOrderDetails(orderId: string): void {
  // Implémentez la navigation vers la page de détails
}
// Ouvrir modal Ajouter
openAddFlashSaleModal(): void {
  this.isEditingFlashSale = false;
  this.currentFlashSale = { name: '', startDate: '', endDate: '', discount: 0, isHighlighted: false };
  this.showFlashSaleModal = true;
}

// Ouvrir modal Editer
openEditFlashSaleModal(flash: any): void {
  this.isEditingFlashSale = true;
  this.currentFlashSale = {
    name: flash.title, // ⚡ map backend title -> frontend name
    startDate: flash.startDate,
    endDate: flash.endDate,
    discount: flash.discount,
    isHighlighted: flash.isHighlighted || false,
    _id: flash._id
  };
  this.showFlashSaleModal = true;
}
get highlightedFlashSales() {
  const highlighted = this.flashsales().filter(f => f.isHighlighted);
  return highlighted.length ? [highlighted[highlighted.length - 1]] : [];
}



// Fermer modal
closeFlashSaleModal(): void {
  this.showFlashSaleModal = false;
}


// Soumettre formulaire FlashSale
onSubmitFlashSale(): void {
  if (!this.currentFlashSale.name?.trim() || !this.currentFlashSale.startDate || !this.currentFlashSale.endDate) {
    this.showFlashSaleError = true;
    return;
  }

  const payload = {
    title: this.currentFlashSale.name,
    startDate: this.currentFlashSale.startDate,
    endDate: this.currentFlashSale.endDate,
    discount: this.currentFlashSale.discount,
    isHighlighted: !!this.currentFlashSale.isHighlighted
  };

  const request$ = this.isEditingFlashSale
    ? this.adminService.updateFlashSale(this.currentFlashSale._id, payload)
    : this.adminService.addFlashSale(payload);

  request$.subscribe({
    next: (savedFlash) => {
      this.showFlashSaleModal = false;
      this.showFlashSaleSuccess = true;

      // 🔄 Recharge automatiquement toutes les FlashSales
      this.loadFlashSales();
    },
    error: (err: any) => {
      console.error('Erreur FlashSale:', err);
      this.showFlashSaleError = true;
    }
  });
}





loadFlashSales(): void {
  this.adminService.getFlashSale().subscribe({
    next: (data) => {
      // Si plusieurs sont highlightées, ne garder que la dernière
      const highlightIndex = data.findIndex(f => f.isHighlighted);
      const updatedData = data.map((f, i) => ({
        ...f,
        isHighlighted: i === highlightIndex // seul le dernier highlight reste actif
      }));

      this.flashsales.set(updatedData); // ✅ mise à jour du signal
    },
    error: (err) => {
      console.error('Erreur lors du chargement des flashsales:', err);
    }
  });
}

// Charger toutes les FlashSales


// Confirmer suppression
confirmDeleteFlashSale(flashId: string): void {
  this.flashSaleToDeleteId = flashId;
  this.showFlashSaleConfirmDelete = true;
}

// Supprimer FlashSale
deleteFlashSale(): void {
  if (!this.flashSaleToDeleteId) return;

  this.adminService.deleteFlashSale(this.flashSaleToDeleteId).subscribe({
    next: () => {
      this.flashsales.update(fs => fs.filter(f => f._id !== this.flashSaleToDeleteId));
      this.showFlashSaleConfirmDelete = false;
      this.flashSaleToDeleteId = null;
    },
    error: (err: any) => {
      console.error('Erreur suppression FlashSale:', err);
      this.showFlashSaleConfirmDelete = false;
      this.flashSaleToDeleteId = null;
    }
  });
}
// Fermer le modal de confirmation de suppression FlashSale
closeFlashSaleConfirm(): void {
  this.showFlashSaleConfirmDelete = false;
  this.flashSaleToDeleteId = null;
}

}