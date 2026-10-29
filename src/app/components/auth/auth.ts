
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthService, AuthUser } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { API_URL } from '../../environments';

interface AuthResponse {
  message: string;
  token?: string;
  user?: AuthUser;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class Auth implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);

  readonly isRegister = signal(false);
  readonly message = signal('');
  readonly loading = signal(false);
  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.isRegister.set(data['mode'] === 'register');
      this.message.set('');
    });
  }

  toggleMode(): void {
    void this.router.navigate([this.isRegister() ? '/login' : '/register']);
  }

  submit(): void {
    this.message.set('');
    const cleanEmail = this.email().trim();

    if (!cleanEmail || !this.password()) {
      this.message.set('Enter your email and password.');
      return;
    }

    if (this.isRegister() && !this.name().trim()) {
      this.message.set('Enter your name.');
      return;
    }

    this.loading.set(true);
    const endpoint = this.isRegister() ? 'register' : 'login';
    const body = this.isRegister()
      ? { name: this.name().trim(), email: cleanEmail, password: this.password() }
      : { email: cleanEmail, password: this.password() };

    this.http.post<AuthResponse>(`${API_URL}/api/auth/${endpoint}`, body).pipe(
      timeout(10000),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: response => {
        if (response.token && response.user) {
          this.authService.setSession(response.token, response.user);
          this.cartService.mergeGuestCart(response.user.id);
          void this.router.navigate([response.user.role === 'admin' ? '/admin' : '/products']);
          return;
        }

        this.message.set(response.message || 'Account created, please login.');
        void this.router.navigate(['/login']);
        this.password.set('');
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          const body = error.error as { message?: string } | null;
          this.message.set(body?.message || 'Something went wrong. Please try again.');
        } else {
          this.message.set('The login request timed out.');
        }
      }
    });
  }
}
