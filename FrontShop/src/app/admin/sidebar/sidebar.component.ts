import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule,TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None

})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Input() activeTab = 'dashboard';
  @Output() tabChange = new EventEmitter<string>();
    @Output() logoutEvent = new EventEmitter<void>();

  setActiveTab(tab: string): void {
    this.tabChange.emit(tab);
  }
  constructor(private translate: TranslateService){
  this.translate.setDefaultLang('en');
    this.translate.use('en');
}
 logout() {
    this.logoutEvent.emit();
  }
  
}