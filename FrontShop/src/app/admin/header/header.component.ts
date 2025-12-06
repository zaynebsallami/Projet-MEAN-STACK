import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
    encapsulation: ViewEncapsulation.None
  
})
export class HeaderComponent implements OnInit {
  @Input() notifications: any[] = [];
  @Input() isDarkMode = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleTheme = new EventEmitter<void>();
  adminData: any;
  constructor(private AdminService: AdminService,    private translate: TranslateService,      private cdr: ChangeDetectorRef,
) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }
  isMobile = false;
    isLanguageOpen = false;
      currentLang = 'en';

  ngOnInit(): void {
      this.adminData = this.AdminService.getAdminData(); // récupéré depuis localStorage

    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }
  toggleDarkMode(): void {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
toggleLanguageDropdown(): void {
      this.isLanguageOpen = !this.isLanguageOpen;
    }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }
  
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'error': return 'fas fa-times-circle';
      case 'info': 
      default: return 'fas fa-info-circle';
    }
  }
  logout(): void {
  this.AdminService.logout();
}
currentLanguage = 'en'; // default language

changeLanguage(event: Event): void {
  const lang = (event.target as HTMLInputElement).value;
  this.currentLang = lang;
  localStorage.setItem('appLanguage', lang);  // Save lang to localStorage
  this.translate.use(lang).subscribe(() => {
    this.cdr.markForCheck();
  });
}
}