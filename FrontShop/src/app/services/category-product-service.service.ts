import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

interface Category {
  _id: string;
  name: string;
  subcategories: Subcategory[];
    trendingPercentage?: number; // ← ajouté

}

interface Subcategory {
  _id: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryProductService {
  private selectedCategorySource = new BehaviorSubject<Category | null>(null);
  private selectedSubcategorySource = new BehaviorSubject<Subcategory | null>(null);
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  setSelectedCategory(category: Category): void {
    this.selectedCategorySource.next(category);
  }

  setSelectedSubcategory(subcategory: Subcategory): void {
    this.selectedSubcategorySource.next(subcategory);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`).pipe(
      catchError(error => {
        console.error('Error fetching categories:', error);
        return of([]); // Return an empty array on error
      })
    );
  }

  getSelectedCategory(): Observable<Category | null> {
    return this.selectedCategorySource.asObservable();
  }

  getSelectedSubcategory(): Observable<Subcategory | null> {
    return this.selectedSubcategorySource.asObservable();
  }
}
