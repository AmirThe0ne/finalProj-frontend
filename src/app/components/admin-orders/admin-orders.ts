
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { API_URL } from '../../environments';
import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

interface OrderItem {
  product?: string | { _id?: string; title?: string };
  titleSnapshot?: string;
  quantity: number;
  price: number;
}

interface OrderUser {
  _id?: string;
  name?: string;
  email?: string;
}

interface Order {
  _id: string;
  user?: OrderUser | string;
  items: OrderItem[];
  addressSnapshot: string;
  mobileSnapshot: string;
  totalPrice: number;
  status: OrderStatus;
  createdAt?: string;
}

type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'received'
  | 'cancelled by admin'
  | 'cancelled by client'
  | 'rejected'
  | 'refunded';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css'
})
export class AdminOrders implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_URL}/api/orders`;

  readonly statuses: OrderStatus[] = [
    'pending',
    'preparing',
    'shipped',
    'delivered',
    'received',
    'cancelled by admin',
    'cancelled by client',
    'rejected',
    'refunded'
  ];

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly updatingOrderId = signal('');

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.http.get<Order[]>(`${this.apiUrl}/admin/all`).subscribe({
      next: (orders: Order[]) => {
        this.orders.set(orders);
        this.loading.set(false);
        
      },
      error: (error: unknown) => {
        this.loading.set(false);

        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            this.errorMessage.set('Your session is invalid or expired. Please login again.');
          } else if (error.status === 403) {
            this.errorMessage.set('Access denied. An admin account is required.');
          } else {
            this.errorMessage.set('Could not load orders. Check that the backend is running.');
          }
        } else {
          this.errorMessage.set('An unexpected error occurred while loading orders.');
        }

        console.error('Load orders failed:', error);
        
      }
    });
  }

  updateStatus(order: Order, event: Event): void {
    const select = event.target;

    if (!(select instanceof HTMLSelectElement)) return;

    const newStatus = select.value as OrderStatus;

    if (newStatus === order.status) return;

    this.updatingOrderId.set(order._id);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.http.patch<{ message?: string; order?: Order }>(
      `${this.apiUrl}/admin/${order._id}/status`,
      { status: newStatus }
    ).subscribe({
      next: (response) => {
        if (response.order) {
          this.orders.set(this.orders().map(current =>
            current._id === order._id ? response.order! : current
          ));
        } else {
          order.status = newStatus;
        }

        this.successMessage.set(response.message || 'Order status updated successfully.');
        this.updatingOrderId.set('');
        
      },
      error: (error: unknown) => {
        this.updatingOrderId.set('');

        if (error instanceof HttpErrorResponse && error.status === 403) {
          this.errorMessage.set('Access denied. An admin account is required.');
        } else if (error instanceof HttpErrorResponse && error.status === 401) {
          this.errorMessage.set('Your session has expired. Please login again.');
        } else if (error instanceof HttpErrorResponse) {
          this.errorMessage.set(error.error?.message || 'Could not update the order status.');
        } else {
          this.errorMessage.set('An unexpected error occurred.');
        }

        console.error('Update order status failed:', error);
        this.loadOrders();
        
      }
    });
  }

  getCustomerName(order: Order): string {
    if (typeof order.user === 'object' && order.user !== null) {
      return order.user.name || order.user.email || 'Customer';
    }

    return 'Customer';
  }

  getCustomerEmail(order: Order): string {
    if (typeof order.user === 'object' && order.user !== null) {
      return order.user.email || 'Not available';
    }

    return 'Not available';
  }

  getItemTitle(item: OrderItem): string {
    if (item.titleSnapshot) return item.titleSnapshot;

    if (typeof item.product === 'object' && item.product !== null) {
      return item.product.title || 'Product';
    }

    return 'Product';
  }
}
