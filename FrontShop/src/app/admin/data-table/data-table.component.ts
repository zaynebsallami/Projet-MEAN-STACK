import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

import {
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
interface Column {
  key: string;
  title: string;
  type?: string;
  sortable?: boolean;
}

interface Action {
  label: string;
  icon: string;
  action: string;
  class?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  encapsulation: ViewEncapsulation.None

})
export class DataTableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: Column[] = [];
  @Input() actions: Action[] = [];
  @Input() statusOptions: string[] = [];
  @Input() showToolbar = true;
  @Input() showPagination = true;
  @Input() pageSize = 10;
  
  @Output() actionClick = new EventEmitter<{action: string, item: any}>();
  @Output() statusChange = new EventEmitter<{id: string, status: string}>();
  @Output() export = new EventEmitter<string>();
  
  constructor(private translate: TranslateService){
  this.translate.setDefaultLang('en');
    this.translate.use('en');
}
  filteredData: any[] = [];
  searchTerm = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.applyFilter();
    }
  }
  
  applyFilter(): void {
    let result = [...this.data];
    
    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(item => {
        return this.columns.some(column => {
          const value = item[column.key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(term);
        });
      });
    }
    
    // Apply sorting
    if (this.sortColumn) {
      result.sort((a, b) => {
        const valueA = a[this.sortColumn];
        const valueB = b[this.sortColumn];
        
        if (valueA === valueB) return 0;
        
        const comparison = valueA < valueB ? -1 : 1;
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    // Calculate total pages
    this.totalPages = Math.ceil(result.length / this.pageSize);
    
    // Apply pagination
    if (this.showPagination) {
      const startIndex = (this.currentPage - 1) * this.pageSize;
      result = result.slice(startIndex, startIndex + this.pageSize);
    }
    
    this.filteredData = result;
  }
  
  resetFilters(): void {
    this.searchTerm = '';
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.currentPage = 1;
    this.applyFilter();
  }
  
  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.applyFilter();
  }
  
  handleAction(action: string, item: any): void {
    this.actionClick.emit({ action, item });
  }
  
  updateStatus(item: any, key: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;
    
    // Update the item
    item[key] = newStatus;
    
    // Emit the event
    this.statusChange.emit({ id: item.id, status: newStatus });
  }
  
  exportData(format: string): void {
    this.export.emit(format);
  }
  
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    
    this.currentPage = page;
    this.applyFilter();
  }
  
  getBadgeClass(value: string): string {
    if (!value) return 'default';
    
    const lowerValue = value.toLowerCase();
    
    if (['active', 'delivered', 'completed', 'success'].includes(lowerValue)) {
      return 'success';
    } else if (['pending', 'processing', 'warning'].includes(lowerValue)) {
      return 'warning';
    } else if (['cancelled', 'failed', 'error', 'suspended'].includes(lowerValue)) {
      return 'danger';
    } else if (['shipped', 'info'].includes(lowerValue)) {
      return 'info';
    }
    
    return 'default';
  }
}