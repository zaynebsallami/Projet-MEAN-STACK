import { Component , computed, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from "./layout/layout.component";
import { FooterComponent } from "./footer/footer.component";
import { HeaderComponent } from "./header/header.component";
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LayoutComponent,
    FooterComponent,
    HeaderComponent,
    TranslateModule,
    RouterModule,
   
    
  ],
  template: `
     <ng-container *ngIf="(showHeaderFooter$ | async)">
      <app-header></app-header>
    </ng-container>

    <main>
      <router-outlet></router-outlet>
    </main>

    <ng-container *ngIf="(showHeaderFooter$ | async)">
      <app-footer></app-footer>
    </ng-container>
  `,
  styles: [`
    main {
      min-height: calc(100vh - 160px);
      padding: 20px;
    }
  `]
})
export class AppComponent {
  title = 'FrontShop';
showHeaderFooter$: Observable<boolean>;

  constructor(private router: Router, private translate: TranslateService) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');

    // Routes où le header/footer doivent être masqués
    this.showHeaderFooter$ = this.router.events.pipe(
  filter(event => event instanceof NavigationEnd),
  startWith({ url: this.router.url }), // pour initialiser correctement
  map((event: any) => !event.url.startsWith('/admin'))
);

  }
  
}