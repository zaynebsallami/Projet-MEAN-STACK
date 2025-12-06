import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface Notification {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  time?: Date;
  read?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  success(arg0: string) {
    throw new Error('Method not implemented.');
  }
  info(arg0: string) {
    throw new Error('Method not implemented.');
  }
  error(arg0: string) {
    throw new Error('Method not implemented.');
  }
  private notifications = new BehaviorSubject<Notification[]>([]);
  
  constructor() {
    const adminData = JSON.parse(localStorage.getItem('admin_data') || '{}');
const adminEmail = adminData?.email || 'unknown';
    // Initialize with some sample notifications
   this.notifications.next([
  {
    id: '1',
    type: 'success',
    message: 'Order #12345 has been successfully processed',
    time: new Date(),
    read: false
  },
  {
    id: '2',
    type: 'warning',
    message: 'Inventory low for product "Smartphone X"',
    time: new Date(Date.now() - 3600000),
    read: false
  },
  {
    id: '3',
    type: 'info',
    message: `Admin connected: ${adminEmail}`,
    time: new Date(Date.now() - 7200000),
    read: true
  }
]);
  }
  
  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }
  
  showNotification(notification: Notification): void {
    const newNotification = {
      ...notification,
      id: this.generateId(),
      time: new Date(),
      read: false
    };
    
    const currentNotifications = this.notifications.getValue();
    this.notifications.next([newNotification, ...currentNotifications]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(newNotification.id!);
    }, 5000);
  }
  
  markAsRead(id: string): void {
    const currentNotifications = this.notifications.getValue();
    const updatedNotifications = currentNotifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    
    this.notifications.next(updatedNotifications);
  }
  
  markAllAsRead(): void {
    const currentNotifications = this.notifications.getValue();
    const updatedNotifications = currentNotifications.map(notification => 
      ({ ...notification, read: true })
    );
    
    this.notifications.next(updatedNotifications);
  }
  
  removeNotification(id: string): void {
    const currentNotifications = this.notifications.getValue();
    const updatedNotifications = currentNotifications.filter(notification => 
      notification.id !== id
    );
    
    this.notifications.next(updatedNotifications);
  }
  
  clearAll(): void {
    this.notifications.next([]);
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
}