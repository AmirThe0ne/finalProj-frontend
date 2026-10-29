import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { API_URL } from '../../environments';

interface AdminUser { _id: string; name: string; email: string; role: 'customer' | 'admin'; isBlocked?: boolean; }
interface MessageResponse { message?: string; }

@Component({ selector: 'app-admin-users', standalone: true, imports: [FormsModule], templateUrl: './admin-users.html' })
export class AdminUsers implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  readonly users = signal<AdminUser[]>([]);
  readonly message = signal('');
  readonly name = signal(''); readonly email = signal(''); readonly password = signal('');

  ngOnInit(): void { this.load(); }
  load(): void {
    this.http.get<AdminUser[]>(`${API_URL}/api/auth/admin/users`).subscribe({
      next: users => this.users.set(users), error: (error: HttpErrorResponse) => this.setError(error)
    });
  }
  isCurrentUser(user: AdminUser): boolean { return user._id === this.auth.user()?.id; }
  toggleBlocked(user: AdminUser): void {
    if (this.isCurrentUser(user)) { this.message.set('You cannot block yourself.'); return; }
    this.http.patch<MessageResponse>(`${API_URL}/api/auth/admin/users/${user._id}/block`, {}).subscribe({
      next: response => { this.message.set(response.message || 'User updated.'); this.load(); }, error: (error: HttpErrorResponse) => this.setError(error)
    });
  }
  createAdmin(): void {
    if (this.password().length < 6) { this.message.set('Password must be at least 6 characters.'); return; }
    const body = { name: this.name().trim(), email: this.email().trim(), password: this.password() };
    this.http.post<MessageResponse>(`${API_URL}/api/auth/admin/create-admin`, body).subscribe({
      next: response => { this.message.set(response.message || 'Admin created.'); this.name.set(''); this.email.set(''); this.password.set(''); this.load(); }, error: (error: HttpErrorResponse) => this.setError(error)
    });
  }
  private setError(error: HttpErrorResponse): void {
    const body = error.error as MessageResponse | null;
    this.message.set(body?.message || `Request failed (${error.status}).`);
  }
}
