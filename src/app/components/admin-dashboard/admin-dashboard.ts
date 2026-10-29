import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../environments';

interface LowStockProduct { _id: string; title: string; stock: number; }
interface Summary {
  pendingOrders: number;
  newOrdersLast24h: number;
  lowStockProducts: LowStockProduct[];
  outOfStockCount: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.html'
})
export class AdminDashboard implements OnInit {
  private readonly http = inject(HttpClient);
  readonly summary = signal<Summary | null>(null);
  readonly message = signal('');

  ngOnInit(): void {
    this.http.get<Summary>(`${API_URL}/api/admin/summary`).subscribe({
      next: value => this.summary.set(value),
      error: () => this.message.set('Could not load dashboard summary.')
    });
  }
}
