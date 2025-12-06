import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, delay, map, Observable, of, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http'; // Assure-toi que c'est importé

interface AdminProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: Date;
  address?: string;
  avatar?: string;
  createdAt?: Date;
  lastLogin?: Date;
}
interface AdminProfileUpdate {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: Date | string;
  oldPassword?: string;
  newPassword?: string;
}
@Injectable({
  providedIn: 'root'
})
export class AdminService {

    private adminDataSubject = new BehaviorSubject<AdminProfile | null>(null);
  adminData$ = this.adminDataSubject.asObservable();
  constructor(private http: HttpClient, private router: Router) {
    this.loadInitialData();
  }
  private loadInitialData(): void {
    const savedData = localStorage.getItem('admin_data');
    if (savedData) {
      this.adminDataSubject.next(JSON.parse(savedData));
    }
  }

    private apiUrl = 'http://localhost:3000/api/admin';

 getDashboardStats(): Observable<{
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}> {
  return this.http.get<any>(`${this.apiUrl}/dashboard-stats`).pipe(
    catchError(error => {
      console.error('Error fetching dashboard stats:', error);
      return of({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0
      });
    })
  );
}

getUsers() {
    return this.http.get('http://localhost:3000/api/admin/users');
  }
// Renommez getOnlyUsers() en getOnlyCustomers() pour plus de clarté
getOnlyCustomers(): Observable<any[]> {
  return this.http.get<any[]>('http://localhost:3000/api/users/only-customers');
}

getProducts(): Observable<any[]> {
  return this.http.get<any[]>('http://localhost:3000/api/products');
}

  getOrders() {
    return this.http.get('http://localhost:3000/api/admin/orders');
  }

  getVendors() {
    return this.http.get('http://localhost:3000/api/admin/vendors');
  }
 getAllUsersAndSellers() {
  return this.http.get<any[]>('http://localhost:3000/api/admin/all-users');
}

  getUserGrowthData(): Observable<any[]> {
  return this.http.get<any[]>('http://localhost:3000/api/admin/user-growth');
}
    
   

    


    
    getRecentOrders(): Observable<any[]> {
      const statuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        id: `ORD-${10000 + i}`,
        customer: `Customer ${i + 1}`,
        date: new Date(Date.now() - i * 86400000), // i days ago
        amount: Math.floor(Math.random() * 500) + 50,
        status: statuses[Math.floor(Math.random() * statuses.length)]
      }));
      
      return of(mockData).pipe(delay(1500));
    }
// Remplacez la méthode getRecentUsers() existante par :
getRecentUsers(): Observable<any[]> {
  return this.http.get<any[]>('http://localhost:3000/api/admin/all-users').pipe(
    map(users => {
      // Transformez les données pour qu'elles correspondent au format attendu
      return users.map(user => ({
        id: user._id,
        name: user.nom || user.name || 'N/A',
        email: user.email,
        avatar: user.avatar || user.photo || 'https://www.gravatar.com/avatar/default?d=mp',
        role: user.role || user.type || 'Customer',
        joinDate: user.createdAt || new Date(),
        active: user.active !== undefined ? user.active : true
      }));
    }),
    catchError(error => {
      console.error('Error fetching recent users:', error);
      return of([]); // Retourne un tableau vide en cas d'erreur
    })
  );
}
    
    updateOrderStatus(orderId: string, status: string): Observable<any> {
      // In a real app, this would be an HTTP PUT request
      console.log(`Updating order ${orderId} to status: ${status}`);
      return of({ success: true }).pipe(delay(800));
    }
    
    exportData(type: string): Observable<Blob> {
      // In a real app, this would be an HTTP request that returns a file
      console.log(`Exporting data as ${type}`);
      return of(new Blob(['Mock export data'], { type: 'text/plain' })).pipe(delay(1000));
    }
    
  // Méthode de login
login(email: string, password: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
    tap((response: any) => {
      if (response.token) {
        console.log('Token reçu (login admin):', response.token);
        const decodedPayload = JSON.parse(atob(response.token.split('.')[1]));
        console.log('Payload décodé:', decodedPayload);
        localStorage.setItem('admin_token', response.token);
        localStorage.setItem('admin_data', JSON.stringify(response.admin));
      }
    })
  );
}

   isLoggedIn(): boolean {
    return !!localStorage.getItem('admin_token');
  }
  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    this.router.navigate(['/admin/login']);
  }
  getAdminData(): any {
  const data = localStorage.getItem('admin_data');
  if (data) {
    const admin = JSON.parse(data);
    return {
      // Mappez les champs backend -> frontend
      firstName: admin.prenom || '',
      lastName: admin.nom || '',
      name: `${admin.prenom || ''} ${admin.nom || ''}`.trim(),
      email: admin.email,
      phone: admin.telephone,
      address: '', 
      birthDate: admin.dateNaissance,
      avatar: admin.avatar
    };
  }
  return null;
}
// Ajoutez cette méthode
refreshAdminData(): void {
  const currentData = this.adminDataSubject.value;
  if (currentData) {
    // Crée un nouvel objet pour forcer le changement
    this.adminDataSubject.next({...currentData});
  } else {
    // Recharge les données si null
    this.loadInitialData();
  }
}

// Modifiez updateAdminProfile
updateAdminProfile(profileData: AdminProfileUpdate): Observable<any> {
  const token = localStorage.getItem('admin_token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.put(`${this.apiUrl}/profile`, profileData, { headers }).pipe(
  tap((response: any) => {
  if (response.admin) {
    const normalizedData = {
      firstName: response.admin.prenom || response.admin.firstName || '',
      lastName: response.admin.nom || response.admin.lastName || '',
      prenom: response.admin.prenom || response.admin.firstName || '',
      nom: response.admin.nom || response.admin.lastName || '',
      email: response.admin.email || '',
      phone: response.admin.telephone || response.admin.phone || '',
      telephone: response.admin.telephone || response.admin.phone || '', // <-- AJOUTE CETTE LIGNE
      address: response.admin.adresse || response.admin.address || '',
      birthDate: response.admin.dateNaissance || response.admin.birthDate || '',
      createdAt: response.admin.createdAt || '',
      avatar: response.admin.avatar || ''
    };
    localStorage.setItem('admin_data', JSON.stringify(normalizedData));
    this.adminDataSubject.next(normalizedData);
    this.refreshAdminData();
  }
}),
    catchError(error => {
      console.error('Erreur lors de la modification du profil admin:', error);
      return of({ error: true, message: 'Erreur modification profil' });
    })
  );
}

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword
    });
  }
   getAllOrders(): Observable<any[]> {
  const token = localStorage.getItem('admin_token'); // récupère token JWT
  if (!token) {
    console.error('No token found, user not authenticated');
    return of([]); // ou throwError selon logique
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get<any>('http://localhost:3000/api/orders', { headers }).pipe(
    map(response => {
      if (response.orders) {
        return response.orders;
      }
      return response;
    }),
    catchError(error => {
      console.error('Error fetching orders:', error);
      return of([]);
    })
  );
}
getSalesData(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/sales-data`).pipe(
    catchError(error => {
      console.error('Error fetching sales data:', error);
      return of([]);
    })
  );
}
// Dans admin.service.ts
deleteProduct(productId: string): Observable<any> {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return throwError(() => new Error('No admin token found'));
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  return this.http.delete(`${this.apiUrl}/products/${productId}`, { headers }).pipe(
    catchError(error => {
      console.error('Error deleting product:', error);
      return throwError(() => error);
    })
  );
}

deleteVendor(sellerId: string): Observable<any> {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return throwError(() => new Error('No admin token found'));
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

 return this.http.delete(`${this.apiUrl}/sellers/${sellerId}`, { headers })
.pipe(
    catchError(error => {
      console.error('Error deleting vendor:', error);
      return throwError(() => error);
    })
  );
}
deleteUser(userId: string): Observable<any> {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return throwError(() => new Error('No admin token found'));
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.delete(`${this.apiUrl}/users/${userId}`, { headers }).pipe(
    catchError(error => {
      console.error('Error deleting user:', error);
      return throwError(() => error);
    })
  );
}
getCategories(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/categories`);
}
// admin.service.ts



addCategory(category: FormData): Observable<any> {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    console.error('Token manquant !');
    return throwError(() => new Error('Token manquant'));
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}` // <-- ok pour auth
    // Ne pas mettre 'Content-Type', Angular gère FormData
  });

  return this.http.post<any>(`${this.apiUrl}/categories`, category, { headers });
}


addSubCategory(subCategory: any): Observable<any> {
  const token = localStorage.getItem('admin_token'); // récupère le token JWT
  if (!token) {
    console.error('Token manquant !');
    return throwError(() => new Error('Token manquant'));
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // URL backend complète
  return this.http.post<any>('http://localhost:3000/api/admin/subcategories', subCategory, { headers });
}
deleteSubCategory(categoryId: string, subCategoryId: string): Observable<any> {
  const token = localStorage.getItem('admin_token'); // récupère le token JWT
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  return this.http.delete<any>(
  `${this.apiUrl}/categories/${categoryId}/subcategories/${subCategoryId}`,
  { headers }
);
}

deleteCategory(id: string): Observable<any> {
  const token = localStorage.getItem('admin_token'); // attention à bien prendre 'admin_token' et pas 'token'
  if (!token) {
    return throwError(() => new Error('Token manquant'));
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.delete<any>(`${this.apiUrl}/categories/${id}`, { headers });
}



createFlashSale(data: any): Observable<any> {
  const token = localStorage.getItem('admin_token');
  return this.http.post<any>(
    `${this.apiUrl}/flash-sale`,
    data,
    { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) }
  );
}
  // ===== FLASHSALES =====
    private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('admin_token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getFlashSale(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/flashsales`, { headers: this.getAuthHeaders() });
  }

  addFlashSale(flashSale: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/flashsales`, flashSale, { headers: this.getAuthHeaders() });
  }

  updateFlashSale(flashId: string, flashSale: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/flashsales/${flashId}`, flashSale, { headers: this.getAuthHeaders() });
  }

  deleteFlashSale(flashId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/flashsales/${flashId}`, { headers: this.getAuthHeaders() });
  }
}
