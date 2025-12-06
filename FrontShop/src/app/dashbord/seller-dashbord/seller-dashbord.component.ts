import { Component,  OnInit, ViewChild,  ElementRef,  AfterViewInit } from "@angular/core"
import { trigger, transition, style, animate, query, stagger } from "@angular/animations"
import { CommonModule } from "@angular/common"
import {  FormBuilder,  FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms"
import { Chart } from "chart.js"
import  { Router } from "@angular/router"
import  { AuthService } from "../../services/auth.service"
import  { ProductService } from "../../services/product.service"
import  { OrdersService } from "../../services/orders.service"
import  { SellerService } from "../../services/seller.service"
import  { NgForm } from "@angular/forms"
import  { ChangeDetectorRef } from "@angular/core"
import { ViewEncapsulation } from "@angular/core"
import {  TranslateService, TranslateModule } from "@ngx-translate/core"
import  { CategoryProductService } from "../../services/category-product-service.service"
import  { HttpClient } from "@angular/common/http"
import { response } from "express"

export interface Order {
  _id: string
  orderNumber: string
  userId: {
    name: string
    email: string
    _id: string
  }
  totalAmount: number
  status: "pending" | "shipped" | "delivered" | "cancelled"
  createdAt: string
  products: {
    productId: {
      name: string
      _id: string
    }
    quantity: number
    price: number
  }[]
}

interface Customer {
  _id: string
  name: string
  email: string
  orderCount?: number
}

interface StatItem {
  icon: string
  title: string
  value: number | string
  suffix?: string
  prefix?: string
}

interface SellerStats {
  totalProducts: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  averageRating: number
}

interface MonthlySales {
  month: number
  totalSales: number
  orderCount: number
}

@Component({
  selector: "app-seller-dashbord", // Updated selector to match naming convention
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: "./seller-dashbord.component.html", // Fixed template path to match actual file name
  styleUrls: ["./seller-dashbord.component.scss"], // Fixed style path to match actual file name
  animations: [
    trigger("containerAnimation", [
      transition("* => *", [
        query(":enter", [style({ opacity: 0 }), stagger("100ms", [animate("300ms ease-out", style({ opacity: 1 }))])], {
          optional: true,
        }),
      ]),
    ]),
    trigger("itemAnimation", [
      transition(":enter", [
        style({ opacity: 0, transform: "translateY(20px)" }),
        animate("300ms ease-out", style({ opacity: 1, transform: "translateY(0)" })),
      ]),
      transition(":leave", [animate("300ms ease-in", style({ opacity: 0, transform: "translateY(20px)" }))]),
    ]),
  ],
  encapsulation: ViewEncapsulation.None,
})
export class SellerDashbordComponent implements OnInit, AfterViewInit {
  // Changed class name to match import expectations
  sidebarCollapsed = false
  isDarkMode = false

  successMessage = ""
  errorMessage = ""
  loading = false
  error: string | undefined
  showCustomersTab = true
  activeTab = "overview" // Default to overview tab
  isEditing = false
  searchTerm = ""
  sortOption = "name"

  currentProduct = {
    _id: "",
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "",
    subcategory: "",
    image: null as File | null,
  }

  categories: any[] = []
  customers: Customer[] = []
  subcategories: any[] = []
  products: any[] = []
  orders: Order[] = []
  filteredProducts: any[] = []
  filteredSubcategories: { _id: string; name: string }[] = []
  selectedFiles: File[] = []
  imagePreview: string | ArrayBuffer | null = null

  @ViewChild("salesChart") salesChartRef!: ElementRef
  salesChart!: Chart
  sellerInfo: any
  availableYears: number[] = [2024, 2025, 2026]
  selectedYear = new Date().getFullYear()
  productForm: FormGroup

  stats: StatItem[] = [
    {
      icon: "📦",
      title: "sellerDashboard.stats.products",
      value: 0,
      suffix: "",
    },
    {
      icon: "📋",
      title: "Total Orders",
      value: 0,
      suffix: "",
    },
    {
      icon: "⏳",
      title: "Pending Orders",
      value: 0,
      suffix: "",
    },
    {
      icon: "👥",
      title: "sellerDashboard.stats.customers",
      value: 0,
      suffix: "",
    },
  ]

  constructor(
    private productService: ProductService,
    private categoryService: CategoryProductService,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private ordersService: OrdersService,
    private sellerService: SellerService,
    private cd: ChangeDetectorRef,
    private translate: TranslateService,
    private http: HttpClient,
  ) {
    this.productForm = this.fb.group({
      name: ["", Validators.required],
      description: [""],
      price: ["", [Validators.required, Validators.min(0)]],
      stock: ["", [Validators.required, Validators.min(0)]],
      category: ["", Validators.required],
      subcategory: [""],
    })
    this.translate.setDefaultLang("en")
    this.translate.use("en")
  }

 ngOnInit() {
    const savedDarkMode = localStorage.getItem("darkMode")
    if (savedDarkMode === "true") {
      this.isDarkMode = true
      document.body.classList.add("dark-mode")
    }
    
    this.loadSellerInfo();
    this.loadCategories();
    this.loadSellerProducts();
    this.loadSellerOrders();
    this.loadSellerStats();
    this.loadCustomers();
    this.profileForm = this.fb.group({
  name: [this.sellerInfo?.name || '', Validators.required],
  email: [this.sellerInfo?.email || [Validators.required, Validators.email]],
});

  }
getSellerImageUrl(image: string | null): string {
  if (!image) return 'http://localhost:3000/uploads/default-seller.png';
  return image.startsWith('http') ? image : `http://localhost:3000/${image}`;
}
loadSellerInfo(): void {
  const sellerId = localStorage.getItem("sellerId");
  if (sellerId) {
    this.sellerService.getSellerById(sellerId).subscribe({
      next: (seller) => {
        this.sellerInfo = {
          name: seller.nom,
          email: seller.email,
          boutique: seller.boutique?.businessName || "N/A",
        };
        // Patch the form after data is loaded
        if (this.profileForm) {
          this.profileForm.patchValue({
            name: this.sellerInfo.name,
            email: this.sellerInfo.email,
            boutique: this.sellerInfo.boutique,
          });
        }
      },
      error: (err) => {
        console.error("Error loading seller info:", err);
        this.sellerInfo = null;
      },
    });
  }
}

onSellerImageError(event: any) {
  event.target.src = 'http://localhost:3000/uploads/default-seller.png';
}


  
loadSellerStats(): void {
  const sellerId = localStorage.getItem("sellerId")
  if (!sellerId) {
    console.error("No seller ID found")
    this.router.navigate(["/login-seller"])
    return
  }

  this.http
    .get(`http://localhost:3000/api/sellers/dashboard/${sellerId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })
    .subscribe({
      next: (response: any) => {
        this.updateStatsFromBackend(response.stats)

        // 🔥 Construire correctement sellerInfo au lieu d’écraser
        this.sellerInfo = {
          name: response.seller.nom,
          email: response.seller.email,
          image: response.seller.image || null,
          boutique: response.seller.boutique?.businessName || "N/A",
        }
      },
      error: (err: any) => {
        console.error("Error loading stats:", err)
        this.errorMessage = "Error loading dashboard stats"
      },
    })
}


  updateStatsFromBackend(stats: SellerStats): void {
    this.stats = [
      { icon: "📦", title: "sellerDashboard.stats.products", value: stats.totalProducts },
      { icon: "📋", title: "sellerDashboard.stats.totalOrders", value: stats.totalOrders },
      { icon: "⏳", title: "sellerDashboard.stats.pendingOrders", value: stats.pendingOrders },
      { icon: "⭐", title: "sellerDashboard.stats.averageRating", value: stats.averageRating, suffix: "/5" },
    ];
    this.cd.detectChanges();
  }

 loadCustomers(): void {
  const sellerId = localStorage.getItem("sellerId");
  console.log("[v1] 🔍 Loading customers for seller:", sellerId);

  if (!sellerId) {
    console.error("[v1] ❌ No seller ID found in localStorage");
    this.customers = [];
    return;
  }

  // API call to fetch all customers for this seller
  this.sellerService.getCustomersBySeller(sellerId).subscribe({
    next: (response: any) => {
      if (response && response.customers && Array.isArray(response.customers)) {
        this.customers = response.customers;

        console.log(`[v1] ✅ Loaded ${this.customers.length} customers`);
        this.customers.forEach((c, i) => {
          console.log(`[v1] Customer ${i + 1}: ${c.name} (${c.email}) - Orders: ${c.orderCount}`);
        });

        // Update stats for customers count
        if (this.stats[3]) {
          this.stats[3].value = this.customers.length.toString();
        }
      } else {
        console.warn("[v1] ⚠️ No customers returned from API");
        this.customers = [];
      }
    },
    error: (err) => {
      console.error("[v1] ❌ Error loading customers:", err);
      this.customers = [];
    },
  });
}



  ngAfterViewInit() {
    this.initChart()
  }

  initChart() {
    const sellerId = localStorage.getItem("sellerId")
    if (!sellerId) return

    this.ordersService.getMonthlySales(sellerId).subscribe({
      next: (response: any) => {
        this.createChart(response.monthlySales)
      },
      error: (err) => {
        console.error("Error loading monthly sales:", err)
        this.createChart([])
      },
    })
  }

  private createChart(monthlyData: MonthlySales[]) {
    if (!this.salesChartRef) return

    const ctx = this.salesChartRef.nativeElement.getContext("2d")
    if (!ctx) return

    if (this.salesChart) {
      this.salesChart.destroy()
    }

    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]

    this.salesChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: monthNames,
        datasets: [
          {
            label: "Ventes mensuelles (DT)",
            data: monthlyData.map((data) => data.totalSales),
            backgroundColor: "rgba(224, 52, 122, 0.7)",
            yAxisID: "y",
          },
          {
            label: "Nombre de commandes",
            data: monthlyData.map((data) => data.orderCount),
            type: "line",
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.1)",
            borderWidth: 2,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "Montant (DT)",
            },
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: "Nombre de commandes",
            },
          },
        },
      },
    })
  }

  setTab(tabName: string) {
    this.activeTab = tabName

    if (tabName === "overview") {
      setTimeout(() => {
        this.initChart()
      }, 0)
    }
  }

  private refreshProducts() {
    this.loadSellerProducts()
    this.cd.detectChanges()
  }

  editProduct(product: any) {
    this.currentProduct = {
      ...product,
      _id: product.id || product._id,
      category: product.category?._id || product.category,
      subcategory: product.subcategory?._id || product.subcategory,
      image: null,
    }
    this.isEditing = true

    setTimeout(() => {
      this.productForm.patchValue({
        name: this.currentProduct.name,
        description: this.currentProduct.description,
        price: this.currentProduct.price,
        stock: this.currentProduct.stock,
        category: this.currentProduct.category,
        subcategory: this.currentProduct.subcategory,
      })
      this.cd.detectChanges()
    })
  }

  deleteProduct(productId: string): void {
    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        this.products = this.products.filter((p) => p._id !== productId)
        this.filterProducts()
        this.successMessage = "Produit supprimé avec succès !"
        setTimeout(() => (this.successMessage = ""), 3000)
      },
      error: (err) => {
        console.error("Erreur lors de la suppression du produit:", err)
      },
    })
  }

  resetForm(form?: NgForm): void {
    this.isEditing = false
    this.currentProduct = {
      _id: "",
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
      subcategory: "",
      image: null,
    }
    this.selectedFiles = []
    this.imagePreview = null

    if (form) {
      form.resetForm()
    }

    this.cd.detectChanges()
  }

  resetFormCompletely(): void {
    this.isEditing = false
    this.currentProduct = {
      _id: "",
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
      subcategory: "",
      image: null,
    }
    this.selectedFiles = []
    this.imagePreview = null
    this.filteredSubcategories = []

    // Reset reactive form
    this.productForm.reset()
    this.productForm.patchValue({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      subcategory: "",
    })

    // Clear any file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }

    this.cd.detectChanges()
  }

  onCategoryChange() {
    const selectedCategory = this.categories.find((cat) => cat._id === this.currentProduct.category)
    if (selectedCategory) {
      this.filteredSubcategories = selectedCategory.subcategories || []
    } else {
      this.filteredSubcategories = []
    }
    this.currentProduct.subcategory = ""
  }

  onSubcategoryChange(value: string) {
    this.currentProduct.subcategory = value
  }

  onOrderStatusChange(orderId: string, event: Event) {
    const target = event.target as HTMLSelectElement
    if (target && target.value) {
      this.changeOrderStatus(orderId, target.value)
    }
  }

  loadSellerProducts(): void {
    const sellerId = localStorage.getItem("sellerId")
    if (!sellerId) {
      this.router.navigate(["/login-seller"])
      return
    }

    this.productService.getProductsBySellerId(sellerId).subscribe({
      next: (response: any) => {
        console.log("[v0] Products API response:", response) // Added debugging
        this.products = Array.isArray(response?.data?.products)
          ? response.data.products
          : Array.isArray(response)
            ? response
            : []

        console.log("[v0] Products loaded:", this.products.length) // Added debugging
        this.stats[0].value = this.products.length.toString()
        this.filterProducts()
      },
      error: (err) => {
        console.error("[v0] Error loading products:", err) // Enhanced error logging
        this.errorMessage = err.message
        this.products = []
        this.filteredProducts = []
      },
    })
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response: any) => {
        console.log("[v0] Categories loaded:", response)
        this.categories = Array.isArray(response) ? response : response.data || []
        this.cd.detectChanges()
      },
      error: (err) => {
        console.error("[v0] Error loading categories:", err)
        this.categories = []
      },
    })
  }

  loadSellerCategories(): void {
    const uniqueCategories = [...new Set(this.products.map((p) => p.category))]
    this.categories = uniqueCategories.map((name) => ({ name }))
  }
getProductImageUrl(image: any): string {
  const baseUrl = 'http://localhost:3000/uploads';

  // Pas d'image → image par défaut
  if (!image) return `${baseUrl}/default-product.png`;

  // Si c’est une string
  if (typeof image === 'string') {
    // Cas : backend renvoie une URL cassée type "http://localhost:30001755280468314-collier.jpeg"
    if (image.startsWith('http://localhost:3000') && !image.includes('/uploads/')) {
      const fileName = image.replace('http://localhost:3000', '');
      return `${baseUrl}/${fileName}`;
    }

    // Cas : URL déjà correcte
    if (image.startsWith('http')) {
      return image;
    }
  }

  // Cas : backend renvoie juste le nom de fichier
  return `${baseUrl}/${image}`;
}


onImageError(event: any, product: any) {
  console.error("❌ Image introuvable :", product.image, " → URL générée :", this.getProductImageUrl(product.image));
  event.target.src = "https://via.placeholder.com/300x300?text=Image+Not+Found";
}

  filterProducts() {
    let filtered = this.products

    if (this.searchTerm) {
      filtered = filtered.filter((p) => {
        const name = p.name ? p.name.toLowerCase() : ""
        const description = p.description ? p.description.toLowerCase() : ""
        const term = this.searchTerm.toLowerCase()
        return name.includes(term) || description.includes(term)
      })
    }

    if (this.currentProduct.category) {
      filtered = filtered.filter((p) => {
        if (typeof p.category === "object" && p.category !== null) {
          return p.category._id === this.currentProduct.category
        }
        return p.category === this.currentProduct.category
      })

      if (this.currentProduct.subcategory) {
        filtered = filtered.filter((p) => {
          if (typeof p.subcategory === "object" && p.subcategory !== null) {
            return p.subcategory._id === this.currentProduct.subcategory
          }
          return p.subcategory === this.currentProduct.subcategory
        })
      }
    }

    if (this.sortOption === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    } else if (this.sortOption === "price") {
      filtered.sort((a, b) => a.price - b.price)
    }

    this.filteredProducts = filtered
  }

  getCategoryNameById(id: string): string {
    const cat = this.categories.find((c) => c._id === id)
    return cat ? cat.name : id
  }

  getSubcategoryNameById(catId: string, subId: string): string {
    const cat = this.categories.find((c) => c._id === catId)
    if (cat && cat.subcategories) {
      const sub = cat.subcategories.find((s: any) => s._id === subId)
      return sub ? sub.name : subId
    }
    return subId
  }

  loadSellerOrders(): void {
    const sellerId = localStorage.getItem("sellerId")

    if (!sellerId) {
      console.error("Aucun vendeur connecté")
      this.error = "Vendeur non connecté"
      this.loading = false
      return
    }

    this.loading = true
    this.ordersService.getOrdersBySeller(sellerId).subscribe({
      next: (response: any) => {
        this.orders = response.orders.map((order: any) => ({
          ...order,
          userId: {
            name: order.userId?.name || "Client inconnu",
            email: order.userId?.email || "",
            _id: order.userId?._id || "",
          },
        }))
        this.loading = false
      },
      error: (error: any) => {
        console.error("Erreur:", error)
        this.loading = false
        this.error = "Erreur lors du chargement"
      },
    })
  }

  changeOrderStatus(orderId: string, newStatus: string): void {
    this.ordersService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        this.successMessage = `Commande ${orderId} mise à jour en "${newStatus}"`
        this.loadSellerOrders()
      },
      error: (err) => {
        console.error("Erreur lors de la mise à jour de la commande :", err)
      },
    })
  }

  getStatusText(status: string): string {
    switch (status) {
      case "pending":
        return "En attente"
      case "shipped":
        return "Expédiée"
      case "delivered":
        return "Livrée"
      case "cancelled":
        return "Annulée"
      default:
        return status
    }
  }

  private validateProduct(): boolean {
    const sellerId = localStorage.getItem("sellerId")

    if (!sellerId) {
      console.error("No seller ID found in localStorage")
      this.errorMessage = "Session expired. Please login again."
      return false
    }

    if (!this.currentProduct.name?.trim()) {
      console.error("Product name is required")
      this.errorMessage = "Product name is required"
      return false
    }

    const price =
      typeof this.currentProduct.price === "string"
        ? Number.parseFloat(this.currentProduct.price)
        : this.currentProduct.price
    if (!price || price <= 0) {
      console.error("Valid product price is required")
      this.errorMessage = "Valid product price is required"
      return false
    }

    if (!this.currentProduct.category) {
      console.error("Product category is required")
      this.errorMessage = "Product category is required"
      return false
    }

    return true
  }

  private createFormData(): FormData {
    const formData = new FormData()
    formData.append("name", this.currentProduct.name)
    formData.append("price", String(this.currentProduct.price))
    formData.append("category", this.currentProduct.category)
    formData.append("subcategory", this.currentProduct.subcategory)
    formData.append("seller", localStorage.getItem("sellerId") || "")

    if (this.currentProduct.description) {
      formData.append("description", this.currentProduct.description)
    }
    if (this.currentProduct.stock) {
      formData.append("stock", String(this.currentProduct.stock))
    }
    if (this.selectedFiles.length > 0) {
      formData.append("image", this.selectedFiles[0])
    }

    return formData
  }

  private handleUpdateSuccess(updatedProduct: any): void {
    const index = this.products.findIndex((p) => p._id === this.currentProduct._id)

    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updatedProduct }
    }

    this.showSuccess("Product updated successfully!")
    this.resetFormCompletely()
    this.refreshProducts()
  }

  private handleCreateSuccess(response: any): void {
    const newProduct = response.product || response
    this.products = [...this.products, newProduct]
    this.showSuccess("Product added successfully!")
    this.resetFormCompletely()
    this.refreshProducts()
  }

  private handleError(err: any): void {
    console.error("Error:", err)
    this.errorMessage = err.error?.message || "An error occurred"
    this.cd.detectChanges()
  }

  private showSuccess(message: string): void {
    this.successMessage = message
    setTimeout(() => {
      this.successMessage = ""
      this.cd.detectChanges()
    }, 4000)
  }

  saveProduct(): void {
    this.errorMessage = ""

    if (this.productForm.valid) {
      const formValues = this.productForm.value
      this.currentProduct.name = formValues.name
      this.currentProduct.price =
        typeof formValues.price === "string" ? Number.parseFloat(formValues.price) : formValues.price
      this.currentProduct.stock =
        typeof formValues.stock === "string" ? Number.parseInt(formValues.stock) : formValues.stock
      this.currentProduct.description = formValues.description
      this.currentProduct.category = formValues.category
      this.currentProduct.subcategory = formValues.subcategory
    }

    if (!this.validateProduct()) return

    const formData = this.createFormData()
    console.log("[v0] Saving product, isEditing:", this.isEditing, "productId:", this.currentProduct._id) // Added debugging

    if (this.isEditing && this.currentProduct._id) {
      this.productService.updateProduct(this.currentProduct._id, formData).subscribe({
        next: (updatedProduct) => {
          console.log("[v0] Product updated successfully:", updatedProduct) // Added debugging
          this.handleUpdateSuccess(updatedProduct)
        },
        error: (err) => {
          console.error("[v0] Error updating product:", err) // Enhanced error logging
          this.handleError(err)
        },
      })
    } else {
      this.productService.addProduct(formData).subscribe({
        next: (response: any) => {
          console.log("[v0] Product created successfully:", response) // Added debugging
          this.handleCreateSuccess(response)
        },
        error: (err: any) => {
          console.error("[v0] Error creating product:", err) // Enhanced error logging
          this.handleError(err)
        },
      })
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files)
    } else {
      this.selectedFiles = []
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode
    if (this.isDarkMode) {
      document.body.classList.add("dark-mode")
    } else {
      document.body.classList.remove("dark-mode")
    }
    localStorage.setItem("darkMode", this.isDarkMode.toString())
  }

  getPageTitle(): string {
    switch (this.activeTab) {
      case "overview":
        return this.translate.instant("SIDEBAR.DASHBOARD")
      case "products":
        return this.translate.instant("SIDEBAR.PRODUCTS")
      case "orders":
        return this.translate.instant("SIDEBAR.ORDERS")
      case "customers":
        return this.translate.instant("SIDEBAR.CUSTOMERS")
      default:
        return this.translate.instant("sellerDashboard.title")
    }
  }

// Ajoutez ces variables près des autres messages
profileSuccessMessage = "";
profileForm!: FormGroup;
// seller-dashbord.component.ts
saveProfile() {
  if (!this.profileForm.valid) return;

  const formValues = this.profileForm.value;

  const formData = new FormData();
  formData.append('nom', formValues.name);
  formData.append('email', formValues.email);

  // Boutique object
  const boutiqueObj = {
    businessName: formValues.boutique || '',
    productType: formValues.productType || '',
    description: formValues.description || ''
  };
  formData.append('boutique', JSON.stringify(boutiqueObj));

  // Append store photo if selected
  if (this.selectedStorePhoto) {
    formData.append('storePhoto', this.selectedStorePhoto);
  }

  const sellerId = localStorage.getItem('sellerId');
  if (!sellerId) {
    alert('No seller ID found. Please login again.');
    return;
  }

  this.sellerService.updateSellerProfile(sellerId, formData).subscribe({
    next: (res: any) => {
            this.profileSuccessMessage = 'Profile updated successfully!';

      console.log('Profile updated:', res);
      this.loadSellerInfo(); // Refresh profile info
    },
    error: (err) => {
      console.error('Error updating profile:', err);
      alert('Failed to update profile');
    }
  });
}
// File input change
onStorePhotoChange(event: any) {
  if (event.target.files.length > 0) {
    this.selectedStorePhoto = event.target.files[0];
  } else {
    this.selectedStorePhoto = null; // Reset if user removes file
  }
}


selectedStorePhoto: File | null = null; // For boutique store photo

storePhotoPreview: string | ArrayBuffer | null = null;
avatarFile: File | null = null; // for uploaded picture
profileImagePreview: string | ArrayBuffer | null = null;
onProfilePhotoChange(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.avatarFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.profileImagePreview = reader.result;
    };
    reader.readAsDataURL(file);
  }
}


getProfileImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null; // no default
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
  return `http://localhost:3000/uploads/${imagePath}`;
}
}