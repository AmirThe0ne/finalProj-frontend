import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly _user = signal<AuthUser | null>(this.loadUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setSession(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    void this.router.navigate(['/login']);
  }

  private loadUser(): AuthUser | null {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;

    try {
      const user = JSON.parse(stored) as Partial<AuthUser>;
      if (
        typeof user.id === 'string' &&
        typeof user.name === 'string' &&
        typeof user.email === 'string' &&
        (user.role === 'customer' || user.role === 'admin')
      ) {
        return user as AuthUser;
      }
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
    return null;
  }
}
