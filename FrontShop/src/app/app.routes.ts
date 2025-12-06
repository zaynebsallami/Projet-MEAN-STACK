// src/app/app-routing.module.ts (or wherever your routes are)
import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './home/home.component';
import { SellerComponent } from './seller/seller.component';
import { LoginSeComponent } from './login-se/login-se.component';
import { SignupSeComponent } from './signup-se/signup-se.component';
import { ProfileClientComponent } from './profile/profile-client/profile-client.component';
import { ProfileSellerComponent } from './profile/profile-seller/profile-seller.component';
import { PanierComponent } from './panier/panier.component';
import { BoutiqueSellerComponent } from './boutique-seller/boutique-seller.component';
import { CategoryComponent } from './category/category.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { AuthGuard } from './guards/auth.guard';
import { SellerDashbordComponent } from './dashbord/seller-dashbord/seller-dashbord.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { AdminProfileComponent } from './admin/pages/admin-profile/admin-profile.component';
import { AdminLoginComponent } from './admin/login-admin/login-admin.component';
import { AdminComponent } from './admin/admin/admin.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      // Public routes
      { path: '', component: HomeComponent },
      { path: 'login-se', component: LoginSeComponent },
      { path: 'signup-se', component: SignupSeComponent },
      { path: 'reset-password', component: ResetPasswordComponent },

      // Redirects
      { path: 'login', redirectTo: 'login-se', pathMatch: 'full' },
      { path: 'signup', redirectTo: 'signup-se', pathMatch: 'full' },

      // Client routes (require login + client role)
      { 
        path: 'profile-client', 
        component: ProfileClientComponent, 
        canActivate: [AuthGuard], 
        data: { roles: ['client'] } 
      },
      { 
        path: 'panier', 
        component: PanierComponent,
        canActivate: [AuthGuard],
        data: { roles: ['client', 'admin'] }
      },
      { 
        path: 'checkout', 
        component: CheckoutComponent,
        canActivate: [AuthGuard],
        data: { roles: ['client'] }
      },

      // Seller routes (require login + vendeur role)
      { path: 'seller', component: SellerComponent},
      { path: 'sellers', component: SellerComponent }, // Public version

      { 
        path: 'profile-seller', 
        component: ProfileSellerComponent,
        canActivate: [AuthGuard],
        data: { roles: ['vendeur'] } 
      },

      {
      path: 'dashboard/seller-dashboard',
      component: SellerDashbordComponent,
      canActivate: [AuthGuard],
      data: { roles: ['vendeur'] }
    },


      {
        path: 'boutique-seller/:id', 
        component: BoutiqueSellerComponent
      },

      // Category routes nested for clarity
      { 
        path: 'category', 
        children: [
          { path: '', component: CategoryComponent },
          { path: ':categoryId', component: CategoryComponent },
          { path: ':categoryId/subcategory/:subcategoryId', component: CategoryComponent },
        ]
      },

      // Product details lazy loaded
      {
        path: 'product/:id',
        loadComponent: () => import('./product-details/product-details.component').then(m => m.ProductDetailsComponent),
      },
      {
        path: 'order-confirmation',
        loadComponent: () =>
          import('./order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent)
      },
          {path: 'wishlist', 
      component: WishlistComponent,
      canActivate: [AuthGuard],  // probably requires login
      data: { roles: ['client'] }
          }
        ]
    },
     // Admin routes (outside LayoutComponent - no header/footer)
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/login-admin/login-admin.component').then(m => m.AdminLoginComponent),
    
  },
  {
   path: 'admin/profile',
  component: AdminProfileComponent
  },
 {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
  data: { roles: ['admin'] },
   children: [
    { path: 'profile', component: AdminProfileComponent },
   ]
  },

  // Fallback wildcard route
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
