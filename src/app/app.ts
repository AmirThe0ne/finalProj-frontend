
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { API_URL } from './environments';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  readonly auth = inject(AuthService);
  readonly pendingOrders = signal(0);
  showHome = () => this.router.url === '/';

  ngOnInit(): void {
    if (this.auth.isAdmin()) this.loadPendingOrders();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.auth.isAdmin()) this.loadPendingOrders();
      });
  }

  private loadPendingOrders(): void {
    this.http.get<{ pendingOrders: number }>(`${API_URL}/api/admin/summary`).subscribe({
      next: summary => this.pendingOrders.set(summary.pendingOrders),
      error: () => this.pendingOrders.set(0)
    });
  }
}
