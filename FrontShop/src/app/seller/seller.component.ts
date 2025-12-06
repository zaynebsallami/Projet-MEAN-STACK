import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation } from "@angular/core";
import { trigger, transition, style, animate, stagger, query } from "@angular/animations";
import { SellerService, Seller } from "../services/seller.service";
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { RouterModule,Router } from "@angular/router";
import { CategoryService } from "../services/category.service";
import { CategoryComponent } from "../category/category.component";
@Component({
  selector: "app-seller",
  templateUrl: "./seller.component.html",
  styleUrls: ["./seller.component.scss"],
  standalone: true,
  imports:[TranslateModule,FormsModule,CommonModule,RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger("listAnimation", [
      transition("* => *", [
        query(
          ":enter",
          [
            style({ opacity: 0, transform: "translateY(20px)" }),
            stagger("100ms", [
              animate("300ms ease-out", style({ opacity: 1, transform: "translateY(0)" }))
            ])
          ],
          { optional: true }
        )
      ])
    ])
  ]
})
export class SellerComponent implements OnInit {
  searchTerm = "";
  categoryFilter = "";
  subcategoryFilter = "";
filteredSubcategories: any[] = [];

  sellers: {
    _id: string;
    name: string;
    avatar: string;
    categoryId: string;
    subcategoryId: string;
    categoryName?: string;
    subcategoryName?: string;
    rating: number;
    products: number;
  }[] = [];
    subcategories: any[] = [];

  constructor(
    private sellerService: SellerService,
    private translate: TranslateService,
    private router: Router,
    private cdr: ChangeDetectorRef,
        private categoryService: CategoryService
  ) {
    this.translate.setDefaultLang("en");
    this.translate.use("en");
    this.translate.onLangChange.subscribe(() => this.cdr.markForCheck());
  }
categories: any[] = [];

ngOnInit(): void {
  this.categoryService.getCategories().subscribe(cats => {
    this.categories = cats;
    this.cdr.markForCheck();
  });

  this.sellerService.getSellers().subscribe((data: Seller[]) => {
  this.sellers = data.map((seller) => ({
  _id: seller._id,
  name: seller.nom,
  avatar: seller.boutique.storePhoto ? seller.boutique.storePhoto.replace(/\\/g, "/") : "assets/default-avatar.png",
categoryId: seller.boutique.productType, // <-- c'est ici la correction !
  subcategoryId: seller.boutique.subcategory, // <-- adapte ici
  rating: seller.rating ?? 0,
  products: seller.products ?? 0
}));
    this.cdr.markForCheck();
  });
}

get filteredSellers() {
  return this.sellers.filter(
    seller =>
      seller.name.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
      (this.categoryFilter === "" || seller.categoryId === this.categoryFilter)
  );
}

  onSearchChange(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }
onCategoryChange() {
  const selectedCategory = this.categories.find(cat => cat.name === this.categoryFilter);
  if (selectedCategory && selectedCategory.subcategories) {
    this.filteredSubcategories = selectedCategory.subcategories;
  } else {
    this.filteredSubcategories = [];
  }
  this.subcategoryFilter = "";
}
  onSubcategoryChange(event: Event) {
  this.subcategoryFilter = (event.target as HTMLSelectElement).value;
}
getCategoryNameById(name: string): string {
  const cat = this.categories.find(c => c.name === name);
  return cat ? cat.name : name;
}

getSubcategoryNameById(id: string): string {
  const sub = this.filteredSubcategories.find(s => s._id === id);
  return sub ? sub.name : id;
}
}
