
import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { API_URL } from '../../environments';

interface OrderItem {
  product?: string | { title?: string };
  titleSnapshot?: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalPrice: number;
  status: string;
  addressSnapshot?: string;
  mobileSnapshot?: string;
  createdAt?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

interface OrdersErrorResponse {
  message?: string;
}

interface UpdateOrderResponse {
  message?: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './orders.html'
})
export class Orders implements OnInit {
  private readonly http = inject(HttpClient);

  private readonly auth = inject(AuthService);
  private readonly apiUrl = `${API_URL}/api/orders`;

  readonly orders = signal<Order[]>([]);
  readonly message = signal('');
  readonly loading = signal(false);
  readonly isAdmin = signal(this.auth.isAdmin());

  readonly statuses = [
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

  ngOnInit(): void {
    this.isAdmin.set(this.auth.isAdmin());
    this.loadOrders();
  }

  loadOrders(): void {
    if (!this.auth.isLoggedIn()) {
      this.message.set('Please login first.');
      this.orders.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.message.set('');

    const endpoint = this.isAdmin()
      ? `${this.apiUrl}/admin/all`
      : `${this.apiUrl}/my-orders`;

    this.http.get<Order[]>(endpoint).pipe(
      timeout(15000),
      finalize(() => {
        this.loading.set(false);
      })
    ).subscribe({
      next: (response: Order[]) => {
        this.orders.set(response);

        this.message.set(response.length === 0
          ? 'No orders found.'
          : '');
      },

      error: (error: unknown) => {
        this.orders.set([]);

        if (
          error instanceof Error &&
          error.name === 'TimeoutError'
        ) {
          this.message.set(
            'The request timed out. Check that the backend and database are running.');
          return;
        }

        if (error instanceof HttpErrorResponse) {
          const body =
            error.error as OrdersErrorResponse | null;

          this.message.set(body?.message
            || `Could not load orders. Error ${error.status}.`);
          return;
        }

        this.message.set(
          'An unexpected error occurred while loading orders.');
      }
    });
  }

  cancelOrder(orderId: string): void {
    if (!confirm('Cancel this order?')) return;

    this.http.patch<UpdateOrderResponse>(
      `${this.apiUrl}/${orderId}/cancel`,
      {}
    ).subscribe({
      next: (response: UpdateOrderResponse) => {
        this.message.set(response.message || 'Order cancelled successfully.');
        this.loadOrders();
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error as OrdersErrorResponse | null;
        this.message.set(body?.message || `Could not cancel order. Error ${error.status}.`);
      }
    });
  }

  updateStatus(orderId: string, status: string): void {
    if (!this.auth.isLoggedIn() || !this.isAdmin()) {
      this.message.set('Admin access is required.');
      return;
    }

    this.http.patch<UpdateOrderResponse>(
      `${this.apiUrl}/admin/${orderId}/status`,
      { status }
    ).subscribe({
      next: (response: UpdateOrderResponse) => {
        this.message.set(
          response.message || 'Order status updated.');

        this.loadOrders();
      },

      error: (error: HttpErrorResponse) => {
        const body =
          error.error as OrdersErrorResponse | null;

        this.message.set(body?.message
          || `Could not update order. Error ${error.status}.`);
      }
    });
  }

  itemName(item: OrderItem): string {
    if (item.titleSnapshot) {
      return item.titleSnapshot;
    }

    if (
      typeof item.product === 'object' &&
      item.product !== null
    ) {
      return item.product.title || 'Product';
    }

    return 'Product';
  }
}
