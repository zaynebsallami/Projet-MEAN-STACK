import { Injectable } from "@angular/core"
import  { HttpClient, HttpErrorResponse, HttpEventType, HttpResponse } from "@angular/common/http"
import  { Observable } from "rxjs"
import { throwError, of } from "rxjs"
import { catchError,map, tap } from "rxjs/operators"
import { AuthService } from "./auth.service"
@Injectable({
  providedIn: "root",
})
export class ProductService {
  private apiUrl = "http://localhost:3000/api/products" // Your API URL

  constructor(private http: HttpClient, private auth: AuthService) {}

  getProductById(productId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${productId}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error fetching product with ID ${productId}:`, error)
        return throwError(() => new Error("Product not found"))
      }),
    )
  }
// product.service.ts
getProductDetails(id: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
    map(product => {
      if (!product.sellerId) {
        // Essayez différentes méthodes pour trouver le sellerId
        product.sellerId = product.seller?._id 
                         || product.sellerId 
                         || 'default-seller-id'; // Fallback
        console.warn('Product missing sellerId, using:', product.sellerId);
      }
      return product;
    })
  );
}
// product.service.ts
getProductWithSeller(productId: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/${productId}`).pipe(
    map(product => {
      if (!product.sellerId) {
        console.error('Product missing sellerId', product);
        throw new Error('Product is missing seller information');
      }
      return product;
    }),
    catchError(error => {
      console.error('Error fetching product', error);
      return throwError(() => error);
    })
  );
}
  // Fixed: Use the correct backend route structure and proper typing
 getProductsBySellerId(sellerId: string): Observable<any> {
  return this.http.get<any>(`http://localhost:3000/api/products/seller-products/${sellerId}`).pipe(
    map(response => {
      console.log('Réponse brute:', response);
      return {
        data: {
          products: Array.isArray(response)
            ? response
            : response?.data?.products || []
        }
      };
    }),
    catchError(err => {
      console.error('Erreur API:', err);
      return of({ data: { products: [] } });
    })
  );
}
addProduct(productData: any): Observable<any> {
  // Decide if productData is FormData or JSON
  if (productData instanceof FormData) {
    return this.createProduct(productData);
  } else {
    // Wrap as FormData if your backend expects FormData
    const formData = new FormData();
    for (const key in productData) {
      if (productData.hasOwnProperty(key)) {
        formData.append(key, productData[key]);
      }
    }
    return this.createProduct(formData);
  }
}


getSellerProducts(sellerId: string): Observable<any> {
  // URL finale sera : http://localhost:3000/api/products/seller-products/{sellerId}
  return this.http.get<any>(`${this.apiUrl}/seller-products/${sellerId}`).pipe(
    map(response => {
      console.log('Réponse brute:', response);
      return {
        data: {
          products: Array.isArray(response) 
            ? response 
            : response?.data?.products || []
        }
      };
    }),
    catchError(err => {
      console.error('Erreur API:', err);
      return of({ data: { products: [] } });
    })
  );
}
  // product.service.ts
getRecommendedProducts() {
  return this.http.get<any[]>(`${this.apiUrl}/recommended`);
}

  searchProducts(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?q=${query}`)
  }

  // 🔹 Fetch all products
  getAllProducts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(catchError(this.handleError))
  }

  // 🔹 Fetch products by category ID
  getProductsByCategory(categoryId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/category/${categoryId}`).pipe(catchError(this.handleError))
  }

  // 🔹 Fetch products by category and subcategory IDs
  getProductsByCategoryAndSubcategory(categoryId: string, subcategoryId: string): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/category/${categoryId}/subcategory/${subcategoryId}`)
      .pipe(catchError(this.handleError))
  }
// Exemple dans product.service.ts

  // 🔹 Update an existing product
updateProduct(productId: string, productData: FormData | any): Observable<any> {
  // Don't set Content-Type header for FormData - the browser will do it automatically
  if (productData instanceof FormData) {
    return this.http.put(`${this.apiUrl}/${productId}`, productData).pipe(
      catchError(err => {
        console.error('Detailed update error:', err);
        return throwError(() => err);
      })
    );
  } else {
    // For regular JSON data
    return this.http.put(`${this.apiUrl}/${productId}`, productData, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      catchError(err => {
        console.error('Detailed update error:', err);
        return throwError(() => err);
      })
    );
  }
}

  // 🔹 Delete a product by ID
  deleteProduct(productId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${productId}`).pipe(catchError(this.handleError))
  }

  // 🔹 Helper method to handle errors
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error("API Error:", error.message)
    return throwError(() => error)
  }
  getFeaturedProducts(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/featured`);
}
createProduct(productData: FormData): Observable<any> {
  console.log('Données envoyées au backend (ProductService):', productData); // Debug
  return this.http.post('http://localhost:3000/api/products', productData);
}


}
