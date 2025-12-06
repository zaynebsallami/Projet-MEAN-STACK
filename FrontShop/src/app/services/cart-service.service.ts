import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  stripePriceId?: string;
   sellerId: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private apiUrl = 'api/cart'; // Replace with your API endpoint if you add backend support

  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCartFromStorage();
  }

  /** Add product to cart, increment quantity if exists */
  addToCart(product: CartItem): Observable<any> {
    const existingItem = this.cartItems.find(item => item._id === product._id);
    const quantityToAdd = product.quantity || 1;

    if (existingItem) {
      existingItem.quantity += quantityToAdd;
    } else {
      this.cartItems.push({ ...product, quantity: quantityToAdd });
    }

    this.cartSubject.next([...this.cartItems]);
    this.saveCartToStorage();

    return of({ success: true });
  }

  /** Get current cart items as observable */
  getCart(): Observable<{ items: CartItem[] }> {
    // Uncomment and implement backend call if needed
    /*
    return this.http.get<{ items: CartItem[] }>(`${this.apiUrl}`).pipe(
      tap(res => {
        this.cartItems = res.items;
        this.cartSubject.next([...this.cartItems]);
        this.saveCartToStorage();
      }),
      catchError(this.handleError)
    );
    */

    // Using localStorage as source of truth here
    return of({ items: [...this.cartItems] });
  }

  /** Replace cart items */
  setCart(items: CartItem[]): void {
    this.cartItems = [...items];
    this.cartSubject.next([...this.cartItems]);
    this.saveCartToStorage();
  }

  /** Remove product from cart */
  removeFromCart(productId: string): Observable<any> {
    this.cartItems = this.cartItems.filter(item => item._id !== productId);
    this.cartSubject.next([...this.cartItems]);
    this.saveCartToStorage();

    // Uncomment for API call
    /*
    return this.http.delete(`${this.apiUrl}/${productId}`).pipe(
      tap(() => this.cartSubject.next([...this.cartItems])),
      catchError(this.handleError)
    );
    */

    return of({ success: true });
  }

  /** Update product quantity */
  updateQuantity(productId: string, quantity: number): Observable<any> {
    const item = this.cartItems.find(i => i._id === productId);
    if (item) {
      item.quantity = quantity;
      this.cartSubject.next([...this.cartItems]);
      this.saveCartToStorage();
    }

    // Uncomment for API call
    /*
    return this.http.patch(`${this.apiUrl}/${productId}`, { quantity }).pipe(
      tap(() => this.cartSubject.next([...this.cartItems])),
      catchError(this.handleError)
    );
    */

    return of({ success: true });
  }

  /** Clear all cart items */
  clearCart(): Observable<any> {
    this.cartItems = [];
    this.cartSubject.next([]);
    this.saveCartToStorage();
    localStorage.removeItem('cart');

    return of({ success: true });

  }

  /** Get current cart items (sync) */
  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  /** Get total price */
  getTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /** Get total item count */
  getItemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  /** Save cart per user in localStorage */
  private saveCartToStorage(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser?._id || currentUser?.id; // check your user id key
    if (userId) {
      localStorage.setItem(`cart_${userId}`, JSON.stringify(this.cartItems));
    } else {
      // fallback: save to general cart key if no user logged in
      localStorage.setItem('cart', JSON.stringify(this.cartItems));
    }
  }

  /** Load cart from localStorage per user */
  public loadCartFromStorage(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser?._id || currentUser?.id;
    let savedCart: string | null = null;

    if (userId) {
      savedCart = localStorage.getItem(`cart_${userId}`);
    }
    if (!savedCart) {
      savedCart = localStorage.getItem('cart'); // fallback for guests
    }

    if (savedCart) {
      this.cartItems = JSON.parse(savedCart);
      this.cartSubject.next([...this.cartItems]);
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('CartService error:', error);
    throw error;
  }
 


}
