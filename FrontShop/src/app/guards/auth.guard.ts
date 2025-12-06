import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {

    // Roles attendus pour la route
    const expectedRoles: string[] = (route.data['roles'] || []).map((r: string) => r.toLowerCase());

    // Si la route est réservée aux admins, on vérifie seulement le token admin
    if (expectedRoles.includes('admin')) {
      const adminToken = this.authService.getAdminToken();
      if (!adminToken || !this.authService.isTokenValid(adminToken)) {
        return this.router.createUrlTree(['/admin/login']);
      }
      return true; // admin peut passer même si un client/vendeur est connecté
    }

    // Pour les routes client/vendeur
    const token = this.authService.getToken();
    const user = this.authService.getCurrentUser();

    if (!token || !user || !this.authService.isTokenValid(token)) {
      this.authService.logout();
      return this.router.createUrlTree(['/login-se']);
    }

    const userRole = (user.role || '').toLowerCase();

    // Si le rôle n’est pas autorisé
    if (expectedRoles.length > 0 && !expectedRoles.includes(userRole)) {
      if (userRole === 'client') return this.router.createUrlTree(['/profile-client']);
      if (userRole === 'vendeur' || userRole === 'seller') return this.router.createUrlTree(['/dashboard/seller-dashboard']);
      return this.router.createUrlTree(['/']);
    }

    return true;
  }
}
