import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Category, Subcategory } from '../models/category.model';


@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  // Updated to use the correct port (3000) for your API
  private apiUrl = 'http://localhost:3000/api/categories'; // Correct port (3000)

  constructor(private http: HttpClient) {}

  // Get all categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching categories:', error);
        return of([]); // Return an empty array if an error occurs
      })
    );
  }

  // Get category by ID
  getCategoryById(categoryId: string): Observable<Category | null> {
    return this.http.get<Category>(`${this.apiUrl}/${categoryId}`).pipe(
      catchError(error => {
        console.error(`Error fetching category with ID ${categoryId}:`, error);
        return of(null); // Return null in case of error
      })
    );
  }

  // Get subcategories for a specific category
  getSubcategories(categoryId: string): Observable<Subcategory[]> {
    return this.http.get<Subcategory[]>(`${this.apiUrl}/${categoryId}/subcategories`).pipe(
      catchError(error => {
        console.error(`Error fetching subcategories for category ${categoryId}:`, error);
        return of([]); // Return an empty array if an error occurs
      })
    );
  }

  // Get products for a specific category and subcategory
  getProductsBySubcategory(categoryId: string, subcategoryId: string): Observable<any[]> {
    console.log('📡 Fetching products for category ID:', categoryId, 'and subcategory ID:', subcategoryId); // Debugging log
    // Ensure the correct URL with port 3000
    return this.http.get<any[]>(`http://localhost:3000/api/products/category/${categoryId}/subcategory/${subcategoryId}`).pipe(
      catchError(error => {
        console.error(`Error fetching products for category ${categoryId} and subcategory ${subcategoryId}:`, error);
        return of([]); // Return an empty array if an error occurs
      })
    );
  }

}
