import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import {
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  encapsulation: ViewEncapsulation.None

})
export class ChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea' = 'line';
  @Input() data: any[] = [];
  @Input() xKey = '';
  @Input() yKey = '';
  @Input() labelKey = '';
  @Input() valueKey = '';
  @Input() colorScheme: string[] = [
    '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
  ];
  @Input() showLegend = true;
  @Input() options: any = {};
  constructor(private translate: TranslateService){
    this.translate.setDefaultLang('en');
      this.translate.use('en');
  }
  chartInstance: Chart | null = null;
  
  ngAfterViewInit(): void {
    this.createChart();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['type'] || changes['options']) && this.chartCanvas) {
      this.createChart();
    }
  }
  
  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
  
  private createChart(): void {
    if (!this.chartCanvas || !this.data || this.data.length === 0) return;
    
    // Destroy previous chart if it exists
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Prepare chart data based on chart type
    let chartData;
    
    if (this.type === 'pie' || this.type === 'doughnut' || this.type === 'polarArea') {
      chartData = {
        labels: this.data.map(item => item[this.labelKey || this.xKey]),
        datasets: [{
          data: this.data.map(item => item[this.valueKey || this.yKey]),
          backgroundColor: this.colorScheme.slice(0, this.data.length),
          borderWidth: 1
        }]
      };
    } else {
      chartData = {
        labels: this.data.map(item => item[this.xKey]),
        datasets: [{
          label: this.labelKey ? this.data[0][this.labelKey] : 'Data',
          data: this.data.map(item => item[this.yKey]),
          backgroundColor: this.type === 'line' ? this.colorScheme[0] : this.colorScheme,
          borderColor: this.colorScheme[0],
          borderWidth: 2,
          tension: 0.4,
          fill: this.type === 'line' ? 'origin' : undefined
        }]
      };
    }
    
    // Default options based on chart type
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: this.showLegend && (this.type === 'pie' || this.type === 'doughnut' || this.type === 'polarArea'),
          position: 'top',
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#64748b'
          }
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: this.type !== 'pie' && this.type !== 'doughnut' && this.type !== 'polarArea' ? {
        x: {
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#e2e8f0',
            drawBorder: false
          },
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#64748b'
          }
        },
        y: {
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#e2e8f0',
            drawBorder: false
          },
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#64748b'
          },
          beginAtZero: true
        }
      } : undefined
    };
    
    // Merge default options with user options
    const chartOptions = { ...defaultOptions, ...this.options };
    
    // Create chart
    this.chartInstance = new Chart(ctx, {
      type: this.type,
      data: chartData,
      options: chartOptions
    });
  }
}