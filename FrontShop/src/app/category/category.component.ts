import { Component,  OnInit } from "@angular/core"
import { CommonModule, CurrencyPipe } from "@angular/common"
import { FormsModule } from "@angular/forms"
import {  ActivatedRoute,  Router, RouterModule } from "@angular/router"
import { catchError, of } from "rxjs"
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';

// Import the ProductDetailsComponent
import { ProductDetailsComponent } from "../product-details/product-details.component"

// REGULAR imports (not type-only) for services
import  { CategoryProductService } from "../services/category-product-service.service"
import  { ProductService } from "../services/product.service"
import  { CartService } from "../services/cart-service.service"
import { TruncatePipe } from "../truncate.pipe"
import {
  ViewEncapsulation
} from '@angular/core';
@Component({
  selector: "app-category",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule,TranslateModule, CurrencyPipe, TruncatePipe, ProductDetailsComponent],
  templateUrl: "./category.component.html",
  styleUrls: ["./category.component.scss"],
    encapsulation: ViewEncapsulation.None

})
export class CategoryComponent implements OnInit {
  categories: any[] = []
  selectedCategory: any = null
  selectedSubcategory: any = null

  products: any[] = []
  filteredProducts: any[] = []
  allProducts: any[] = [] // master list of all products

  isLoading = true
  error: string | null = null

  searchTerm = ""
  sortOption = ""

  // Modal properties
  isModalVisible = false
  selectedProductId: string | null = null

  constructor(
    private categoryProductService: CategoryProductService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
        private translate: TranslateService,

    
  ) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit(): void {
    this.loadCategories()

    this.route.paramMap.subscribe((params) => {
      if (!params.keys.length) {
        this.selectedCategory = null
        this.selectedSubcategory = null
        this.loadAllProducts()
      }
    })

    this.route.queryParams.subscribe((params) => {
      const search = params["search"]
      if (search) {
        this.searchTerm = search
        this.searchProducts()
      }
    })
  }

  // Modal methods
  viewProductDetails(product: any): void {
    this.selectedProductId = product._id
    this.isModalVisible = true
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden"
  }

  closeProductModal(): void {
    this.isModalVisible = false
    this.selectedProductId = null
    // Restore body scroll
    document.body.style.overflow = "auto"
  }

  onProductChanged(productId: string): void {
    this.selectedProductId = productId
  }

  private loadAllProducts(): void {
    this.isLoading = true
    this.error = null

    this.productService
      .getAllProducts()
      .pipe(
        catchError((error) => {
          this.handleError("Failed to load products.", error)
          return of([])
        }),
      )
      .subscribe((products) => {
        this.allProducts = products.map((product) => {
          if (product.category && typeof product.category !== "object") {
            product.category = { _id: String(product.category) }
          }
          if (product.subcategory && typeof product.subcategory !== "object") {
            product.subcategory = { _id: String(product.subcategory) }
          }
          return {
            ...product,
            image: this.getProductImageUrl(product.image),
          }
        })

        this.products = [...this.allProducts]
        this.updateCategoryCounts()
        this.applyFilters()
        this.isLoading = false
      })
  }

  private loadCategories(): void {
    this.isLoading = true
    this.error = null

    this.categoryProductService
      .getCategories()
      .pipe(
        catchError((error) => {
          this.handleError("Failed to load categories.", error)
          return of([])
        }),
      )
      .subscribe((categories) => {
        this.categories = categories
        this.isLoading = false
        this.checkRouteParams() // Make sure this is called after categories load
      })
  }

  private updateCategoryCounts(): void {
    // Reset all counters
    this.categories.forEach((category) => {
      category.productCount = 0
      if (category.subcategories) {
        category.subcategories.forEach((sub: any) => {
          sub.productCount = 0
        })
      }
    })

    this.allProducts.forEach((product) => {
      const categoryId =
        product.category && typeof product.category === "object"
          ? String(product.category._id)
          : String(product.category)
      const subcategoryId =
        product.subcategory && typeof product.subcategory === "object"
          ? String(product.subcategory._id)
          : String(product.subcategory)

      if (!categoryId) {
        return
      }

      const category = this.categories.find((c) => String(c._id) === categoryId)

      if (!category) {
        return
      }

      category.productCount = (category.productCount || 0) + 1

      if (subcategoryId && category.subcategories) {
        const subcategory = category.subcategories.find((sc: any) => String(sc._id) === subcategoryId)
        if (subcategory) {
          subcategory.productCount = (subcategory.productCount || 0) + 1
        }
      }
    })
  }

 private checkRouteParams(): void {
  this.route.paramMap.subscribe((params) => {
    const categoryId = params.get("categoryId");
    const subcategoryId = params.get("subcategoryId");

    if (!categoryId) {
      // ✅ No categoryId → load all products
      this.selectedCategory = null;
      this.selectedSubcategory = null;
      this.loadAllProducts();
      return;
    }

    // Handle category/subcategory logic
    const category = this.categories.find((c) => String(c._id) === categoryId);
    if (category) {
      this.selectedCategory = category;
      if (subcategoryId) {
        this.selectedSubcategory = category.subcategories?.find((s: any) => String(s._id) === subcategoryId) || null;
      } else {
        this.selectedSubcategory = null;
      }
      this.loadProducts(category._id, this.selectedSubcategory?._id || null);
    }
  });
}

  selectCategory(category: any): void {
    this.selectedCategory = category
    this.selectedSubcategory = null

    this.router.navigate([`/category/${category._id}`])

    // Filter products from allProducts (master list)
    const subcategoryIds = category.subcategories?.map((sub: any) => String(sub._id)) || []
    this.filteredProducts = this.allProducts.filter(
      (p) =>
        String(typeof p.category === "object" ? p.category._id : p.category) === String(category._id) ||
        (p.subcategory &&
          subcategoryIds.includes(String(typeof p.subcategory === "object" ? p.subcategory._id : p.subcategory))),
    )

    this.loadProducts(category._id, null)
  }

  selectSubcategory(event: Event, sub: any): void {
    event.stopPropagation()
    if (!this.selectedCategory) return

    this.selectedSubcategory = sub
    this.router.navigate([`/category/${this.selectedCategory._id}/subcategory/${sub._id}`])

    this.loadProducts(this.selectedCategory._id, sub._id)
  }

  private loadProducts(categoryId: string, subcategoryId: string | null): void {
    this.isLoading = true
    this.error = null

    const request$ = subcategoryId
      ? this.productService.getProductsByCategoryAndSubcategory(categoryId, subcategoryId)
      : this.productService.getProductsByCategory(categoryId)

    request$
      .pipe(
        catchError((error) => {
          this.handleError("Failed to load products.", error)
          return of([])
        }),
      )
      .subscribe((products) => {
        this.products = products.map((product) => {
          if (product.category && typeof product.category !== "object") {
            product.category = { _id: String(product.category) }
          }
          if (product.subcategory && typeof product.subcategory !== "object") {
            product.subcategory = { _id: String(product.subcategory) }
          }
          return {
            ...product,
            image: this.getProductImageUrl(product.image),
          }
        })

        this.applyFilters()
        this.isLoading = false
      })
  }

  applyFilters(): void {
    this.filteredProducts = [...this.products]

    if (this.searchTerm) {
      const query = this.searchTerm.toLowerCase()
      this.filteredProducts = this.filteredProducts.filter(
        (product) => product.name?.toLowerCase().includes(query) || product.description?.toLowerCase().includes(query),
      )
    }

    this.sortProducts()
  }

  onSearch(): void {
    this.applyFilters()
  }

  onSortChange(): void {
    this.applyFilters()
  }

  sortProducts(): void {
    switch (this.sortOption) {
      case "price-asc":
        this.filteredProducts.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        this.filteredProducts.sort((a, b) => b.price - a.price)
        break
      case "name-asc":
        this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name-desc":
        this.filteredProducts.sort((a, b) => b.name.localeCompare(a.name))
        break
    }
  }

  addToCart(event: Event, product: any): void {
    event.stopPropagation()

    this.cartService.addToCart(product).subscribe({
      next: () => {
        this.router.navigate(["/panier"])
      },
      error: (err) => console.error("Error adding product to cart:", err),
    })
  }

  reload(): void {
    if (this.selectedCategory) {
      this.loadProducts(this.selectedCategory._id, this.selectedSubcategory?._id || null)
    } else {
      this.loadCategories()
    }
  }

  resetFilters(): void {
    this.searchTerm = ""
    this.sortOption = ""
    this.applyFilters()
  }

  private handleError(msg: string, error: any): void {
    console.error(error)
    this.error = msg
    this.isLoading = false
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

  searchProducts(): void {
    if (this.searchTerm.trim()) {
      this.productService.searchProducts(this.searchTerm).subscribe({
        next: (data: any) => {
          this.products = data
          this.applyFilters()
        },
        error: (error: any) => {
          console.error("Error searching products:", error)
        },
      })
    } else {
      this.reload()
    }
  }
}
