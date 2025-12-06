import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss'],
    encapsulation: ViewEncapsulation.None

})
export class StatCardComponent {
  @Input() icon = '';
  @Input() title = '';
  @Input() value: string | number = 0;
  @Input() trend = '';
  @Input() trendDirection: 'up' | 'down' = 'up';
  @Input() color: 'blue' | 'green' | 'orange' | 'purple' | 'red' = 'blue';
  constructor(private translate: TranslateService){
  this.translate.setDefaultLang('en');
    this.translate.use('en');
}
}