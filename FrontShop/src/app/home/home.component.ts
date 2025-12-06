import {
  Component,
   OnInit,
   AfterViewInit,
   OnDestroy,
  HostListener,
  ViewChild,
   ElementRef,
   signal,
} from "@angular/core"
import  { TranslateService } from "@ngx-translate/core"
import  { Router } from "@angular/router"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { TranslateModule } from "@ngx-translate/core"
import { FormsModule } from "@angular/forms"
import  { CategoryService } from "../services/category.service"
import { CurrencyPipe } from "@angular/common"
import { Subscription, interval } from "rxjs"
import  { CategoryProductService } from "../services/category-product-service.service"
import  { ProductService } from "../services/product.service"
import  { CartService } from "../services/cart-service.service"
import  { Title, Meta } from "@angular/platform-browser"
import {
  ViewEncapsulation
} from '@angular/core';
import { AdminService } from "../services/admin.service"
// Interfaces for type safety
interface HeroSlide {
  image: string
  title: string
  subtitle: string
}

interface FloatingShape {
  x: number
  y: number
  size: number
}

interface ProductFilter {
  key: string
  label: string
}

interface NewsletterParticle {
  x: number
  y: number
}

interface NewsletterBenefit {
  icon: string
  text: string
}
export interface FlashSaleConfig {
  title: string;
  description: string;
  endDate: string;   // ISO string
  active: boolean;
}
@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, FormsModule],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  providers: [CurrencyPipe],
  encapsulation: ViewEncapsulation.None
  
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("categoryCarousel") categoryCarousel!: ElementRef
  @ViewChild("productsGrid") productsGrid!: ElementRef

  // Existing properties
  isDarkMode = false
  categories: any[] = []
  isLoading = false

  // Enhanced featured products with more properties
  featuredProducts: any[] = [];

flashSale: any;

  // Hero Section Properties
 heroSlides: HeroSlide[] = [
  {
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop",
    title: "DISCOVER_AMAZING_PRODUCTS",
    subtitle: "DISCOVER_AMAZING_PRODUCTS_DESC"
  },
  {
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=600&fit=crop",
    title: "PREMIUM_QUALITY_GUARANTEED",
    subtitle: "PREMIUM_QUALITY_DESC"
  },
  {
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop",
    title: "EXCLUSIVE_DEALS_AWAIT",
    subtitle: "EXCLUSIVE_DEALS_DESC"
  }
]

  currentSlide = 0
  slideInterval!: Subscription

  // Floating Elements
  floatingShapes: FloatingShape[] = [
    { x: 15, y: 20, size: 60 },
    { x: 85, y: 30, size: 80 },
    { x: 70, y: 70, size: 50 },
    { x: 20, y: 80, size: 70 },
    { x: 50, y: 15, size: 40 },
  ]

  // Dynamic Text Arrays
  titleLines: string[] = ["WELCOME_TO_OUR_AMAZING_STORE"]
  subtitleWords: string[] = ["Discover_premium_products_with_exceptional_quality"]
  categoryTitleWords: string[] = ["EXPLORE_OUR_CATEGORIES"]
  productTitleWords: string[] = ["FEATURED_PRODUCTS"]
  newsletterTitleWords: string[] = ["STAY_UPDATED"]

  // Scroll Progress
  scrollProgress = 0

  // Category Carousel Properties
  categoryOffset = 0
  categoryTransition = "transform 0.5s ease"
  categoryIndex = 0
  maxCategoryIndex = 0
  categoryPages: number[] = []
  currentCategoryPage = 0
  itemsPerPage = 3

  // Product Filter Properties
  filteredProducts: any[] = []
  productFilters: ProductFilter[] = [
    { key: "all", label: "ALL_PRODUCTS" },
    { key: "new", label: "NEW_ARRIVALS" },
    { key: "trending", label: "TRENDING" },
    { key: "sale", label: "ON_SALE" },
  ]
  activeFilter = "all"
  isLoadingProducts = false
  flashsales = signal<any[]>([]);

  // Newsletter Properties
  newsletterEmail = ""
  isSubscribing = false
  subscriptionSuccess = false
  newsletterParticles: NewsletterParticle[] = []
  newsletterBenefits: NewsletterBenefit[] = [
    { icon: "fas fa-gift", text: "EXCLUSIVE_OFFERS" },
    { icon: "fas fa-bell", text: "EARLY_ACCESS" },
    { icon: "fas fa-star", text: "SPECIAL_DISCOUNTS" },
  ]
  hoveredProductIndex: number | null = null;

  // UI State
  wishlistItems: Set<string> = new Set()

  private subscriptions: Subscription = new Subscription()

  constructor(
    private router: Router,
    private translate: TranslateService,
    private categoryService: CategoryService,
    private categoryProductService: CategoryProductService,
    private productService: ProductService,
    private cartService: CartService,
    private currencyPipe: CurrencyPipe,
    private title: Title,
    private meta: Meta,
    private adminService: AdminService
  ) {
    this.translate.setDefaultLang("en")
    this.translate.use("en")
  }
// Countdown timer
// Timer FlashSale
hours: number = 0;
minutes: number = 0;
seconds: number = 0;
timerInterval!: any;
updateTimer!: () => void;

  ngOnInit() {
    const savedDarkMode = localStorage.getItem("darkMode")
    this.isDarkMode = savedDarkMode === "true"
    this.loadFeaturedProducts();
    this.loadCategories()
    this.initializeData()
    this.startHeroSlideshow()
    this.generateNewsletterParticles()
    this.calculateCategoryPages()
      this.loadFlashSale();

    this.title.setTitle("Modern E-commerce Store - Premium Products & Exclusive Deals")
    this.meta.updateTag({
      name: "description",
      content:
        "Discover amazing products with exclusive deals, premium quality, and fast shipping. Shop electronics, fashion, home & garden, and more.",
    })
    this.translate.get("PAGE_TITLE.HOME").subscribe((title) => {
      this.title.setTitle(title)
    })
    this.translate.get("PAGE_DESC.HOME").subscribe((desc) => {
      this.meta.updateTag({ name: "description", content: desc })
    })
    
  }

  ngAfterViewInit(): void {
    this.checkScrollAnimation()
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
    if (this.slideInterval) {
      this.slideInterval.unsubscribe()
    }
  }

  // Initialize additional data
  private initializeData(): void {
    this.filteredProducts = [...this.featuredProducts]
    this.maxCategoryIndex = Math.max(0, this.categories.length - this.itemsPerPage)
  }

  // Hero Slideshow Methods
  private startHeroSlideshow(): void {
    this.slideInterval = interval(5000).subscribe(() => {
      this.nextSlide()
    })
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length
  }

  goToSlide(index: number): void {
    this.currentSlide = index
  }

  // Enhanced scroll methods
  @HostListener("window:scroll", [])
  onWindowScroll() {
    this.updateScrollProgress()
    this.checkScrollAnimation()
  }

  updateScrollProgress() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
    const scrolled = (winScroll / height) * 100
    this.scrollProgress = scrolled

    const progressBar = document.getElementById("scrollProgress")
    if (progressBar) {
      ;(progressBar as HTMLElement).style.width = scrolled + "%"
    }
  }

  checkScrollAnimation() {
    const revealElements = document.querySelectorAll(".reveal-text, .reveal-item")
    revealElements.forEach((el) => {
      const elementTop = (el as HTMLElement).getBoundingClientRect().top
      const elementVisible = 150
      if (elementTop < window.innerHeight - elementVisible) {
        el.classList.add("revealed")
        if (el.hasAttribute("data-delay")) {
          ;(el as HTMLElement).style.transitionDelay = el.getAttribute("data-delay") + "ms"
        }
      }
    })
  }

  scrollToCategories() {
    document.getElementById("categories-section")?.scrollIntoView({ behavior: "smooth" })
  }

  scrollToProducts() {
    document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })
  }

  // Category Methods
  onCategoryHover(index: number): void {
    console.log("Category hovered:", index)
  }

  onCategoryLeave(index: number): void {
    console.log("Category left:", index)
  }

  previousCategory(): void {
    if (this.categoryIndex > 0) {
      this.categoryIndex--
      this.updateCategoryOffset()
    }
  }

  nextCategory(): void {
    if (this.categoryIndex < this.maxCategoryIndex) {
      this.categoryIndex++
      this.updateCategoryOffset()
    }
  }

  private updateCategoryOffset(): void {
    const cardWidth = 350 + 32 // card width + gap
    this.categoryOffset = -this.categoryIndex * cardWidth
    this.currentCategoryPage = Math.floor(this.categoryIndex / this.itemsPerPage)
  }

  goToCategoryPage(pageIndex: number): void {
    this.categoryIndex = pageIndex * this.itemsPerPage
    this.updateCategoryOffset()
  }

  private calculateCategoryPages(): void {
    const totalPages = Math.ceil(this.categories.length / this.itemsPerPage)
    this.categoryPages = Array.from({ length: totalPages }, (_, i) => i)
  }

  navigateToCategory(category: any) {
    this.router.navigate(["/category", category._id])
  }

  navigateToSubcategory(categoryId: string, subcategoryId: string) {
    this.router.navigate(["/category", categoryId, "subcategory", subcategoryId])
  }

  // Enhanced Product Methods
  filterProducts(filterKey: string): void {
    this.activeFilter = filterKey

    if (filterKey === "all") {
      this.filteredProducts = [...this.featuredProducts]
    } else {
      this.filteredProducts = this.featuredProducts.filter((product) => {
        switch (filterKey) {
          case "new":
            return product.isNew
          case "trending":
            return product.isTrending
          case "sale":
            return product.onSale
          default:
            return true
        }
      })
    }

    // Update filter button states
    const filterButtons = document.querySelectorAll(".filter-btn")
    filterButtons.forEach((btn) => {
      btn.classList.remove("active")
      if (
        btn.textContent?.toLowerCase().includes(filterKey.toLowerCase()) ||
        (filterKey === "all" && btn.textContent?.toLowerCase().includes("all"))
      ) {
        btn.classList.add("active")
      }
    })

    this.isLoading = true
    setTimeout(() => {
      this.isLoading = false
    }, 800)
  }

  onProductHover(index: number): void {
  this.hoveredProductIndex = index;
}

onProductLeave(index: number): void {
  this.hoveredProductIndex = null;
}


  toggleWishlist(productId: string): void {
    if (this.wishlistItems.has(productId)) {
      this.wishlistItems.delete(productId)
    } else {
      this.wishlistItems.add(productId)
    }
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistItems.has(productId)
  }

  quickView(productId: string): void {
    console.log("Quick view product:", productId)
  }

  addToCompare(productId: string): void {
    console.log("Add to compare:", productId)
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

  loadMoreProducts(): void {
    console.log("Loading more products")
    this.isLoadingProducts = true
    setTimeout(() => {
      this.isLoadingProducts = false
      // Add more products logic here
    }, 1500)
  }

  viewProduct(productId: string) {
    console.log("Viewing product:", productId)
    this.router.navigate(["/product", productId])
  }

  // Newsletter Methods
  subscribeNewsletter(): void {
    if (!this.newsletterEmail || this.isSubscribing) {
      return
    }

    this.isSubscribing = true

    // Simulate API call
    setTimeout(() => {
      this.isSubscribing = false
      this.subscriptionSuccess = true
      this.newsletterEmail = ""

      // Reset success state after 3 seconds
      setTimeout(() => {
        this.subscriptionSuccess = false
      }, 3000)
    }, 2000)
  }

  private generateNewsletterParticles(): void {
    for (let i = 0; i < 20; i++) {
      this.newsletterParticles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
      })
    }
  }

  // Video Methods
  playIntroVideo(): void {
    console.log("Play intro video")
  }

  // Existing methods preserved
  loadCategories() {
    this.categoryService.getCategories().subscribe(
      (data) => {
        this.categories = data.map((category) => ({
          ...category,
          name: this.translate.instant(category.name),
           subcategories: category.subcategories,
productCount: category.productCount != null ? category.productCount : Math.floor(Math.random() * 200) + 50,
          image:
            category.image ||
            `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000000)}?w=300&h=200&fit=crop`,
        }))
        this.calculateCategoryPages()
        this.maxCategoryIndex = Math.max(0, this.categories.length - this.itemsPerPage)
      },
      (error) => {
        console.error("Error fetching categories", error)
      },
    )
  }

  changeLanguage(lang: string) {
    this.translate.use(lang)
  }

  formatPrice(price: number): string {
    const formattedPrice = this.currencyPipe.transform(price, "USD")
    return formattedPrice ? formattedPrice : "$0.00"
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode
    localStorage.setItem("darkMode", this.isDarkMode.toString())
  }

  addToWishlist(productId: string) {
    this.toggleWishlist(productId)
  }

  getRandomProgress(): number {
    return Math.floor(Math.random() * 70) + 30
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }


  loadFeaturedProducts(): void {
  this.isLoadingProducts = true;
  this.productService.getFeaturedProducts().subscribe({
    next: (products) => {
      console.log('Featured products from API:', products);
      this.featuredProducts = products;
      this.filteredProducts = [...products];
      this.isLoadingProducts = false;
    },
    error: (err) => {
      console.error('Error loading featured products:', err);
      this.isLoadingProducts = false;
    },
  });
}
getCategoryImageUrl(image: any): string {
  const baseUrl = 'http://localhost:3000/uploads';

  // Pas d'image → image par défaut
  if (!image) return `${baseUrl}/default-category.png`; // ← tu peux mettre ton image par défaut de catégorie

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

// Gestion de l'erreur si l'image ne charge pas
onCategoryImageError(event: any, category: any): void {
  event.target.src = 'http://localhost:3000/uploads/default-category.png'; // image fallback
  category.image = null; // optionnel : pour éviter les reloads
}

loadFlashSale(): void {
  this.adminService.getFlashSale().subscribe({
    next: (sales: any[]) => {
      const highlighted = sales.filter(s => s.isHighlighted);
      this.flashsales.set(highlighted);

      this.flashSale = highlighted.length ? highlighted[0] : null;

      // ✅ Démarrer le timer seulement après avoir assigné flashSale
      if (this.flashSale) {
        this.startFlashSaleTimer();
      }
    },
    error: (err: any) => console.error("Error fetching flash sale:", err),
  });
}


  get highlightedFlashSale() {
    return this.flashsales().length ? this.flashsales()[0] : null;
  }
startFlashSaleTimer(): void {
  if (!this.flashSale || !this.flashSale.startDate || !this.flashSale.endDate) return;

  const start = new Date(this.flashSale.startDate).getTime();
  const end = new Date(this.flashSale.endDate).getTime();

  const updateFlashSaleTime = () => {
    const now = new Date().getTime();

    if (now < start) {
      // Avant le début de la FlashSale
      this.calculateTimeDifference(start - now);
    } else if (now >= start && now <= end) {
      // Pendant la FlashSale
      this.calculateTimeDifference(end - now);
    } else {
      // Après la FlashSale
      clearInterval(this.timerInterval);
      this.hours = this.minutes = this.seconds = 0;
    }
  }

  this.updateTimer = updateFlashSaleTime;
  this.updateTimer(); // mise à jour immédiate

  this.timerInterval = setInterval(() => {
    this.updateTimer();
  }, 1000);
}
private calculateTimeDifference(diff: number) {
  const totalSeconds = Math.floor(diff / 1000);
  this.hours = Math.floor(totalSeconds / 3600);
  this.minutes = Math.floor((totalSeconds % 3600) / 60);
  this.seconds = totalSeconds % 60;
}

}
