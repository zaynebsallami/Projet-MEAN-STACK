import { Component, OnInit,Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../services/product.service';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-product',
  standalone:true,
  imports:[TranslateModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit {
  productId: string = '';
@Input() product: any; 
  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private translate: TranslateService,

  ) {this.translate.setDefaultLang('en');
    this.translate.use('en');}

  ngOnInit(): void {
    // Get the productId from the route parameters
    this.productId = this.route.snapshot.paramMap.get('productId') || '';
    
    // Fetch product details based on the productId
    this.loadProduct();
  }

  loadProduct(): void {
    if (this.productId) {
      this.productService.getProductById(this.productId).subscribe(
        (data) => {
          this.product = data; // Set the product details
        },
        (error) => {
          console.error('Error fetching product details:', error);
        }
      );
    }
  }
  
}
