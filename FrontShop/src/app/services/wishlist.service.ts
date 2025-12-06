import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

const WISHLIST_KEY = 'user_wishlist';
// ✅ At top of file
export interface WishlistItem {
  _id: string;
  name: string;
  price: number;
  image?: string;
  sellerId: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private apiUrl = 'http://localhost:3000/api/users';
  private wishlistSubject = new BehaviorSubject<WishlistItem[]>([]);
  wishlistChanged = this.wishlistSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadWishlist(userId: string) {
    return this.http.get<{ wishlist: WishlistItem[] }>(`${this.apiUrl}/${userId}/wishlist`)
      .pipe(
        tap(res => {
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(res.wishlist));
          this.wishlistSubject.next(res.wishlist);
        })
      );
  }

  addItem(userId: string, item: WishlistItem) {
    return this.http.post(`${this.apiUrl}/${userId}/wishlist`, { productId: item._id })
      .pipe(
        tap(() => {
          const wishlist = this.getWishlist();
          if (!wishlist.find(i => i._id === item._id)) {
            wishlist.push(item);
            this.saveWishlist(wishlist);
          }
        })
      );
  }

removeItem(userId: string, productId: string) {
  return this.http.delete(`${this.apiUrl}/${userId}/wishlist/${productId}`)
    .pipe(
      tap(() => {
        const updated = this.getWishlist().filter(i => i._id !== productId);
        this.saveWishlist(updated);
      })
    );
}


  getWishlist(): WishlistItem[] {
    const json = localStorage.getItem(WISHLIST_KEY);
    return json ? JSON.parse(json) : [];
  }

  private saveWishlist(wishlist: WishlistItem[]) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    this.wishlistSubject.next(wishlist);
  }

  clearWishlist() {
    localStorage.removeItem(WISHLIST_KEY);
    this.wishlistSubject.next([]);
  }
}
