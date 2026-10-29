import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../environments';

interface Address {
  _id: string;
  title: string;
  address: string;
  mobile: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './addresses.html'
})
export class Addresses implements OnInit {
  private readonly http = inject(HttpClient);
  readonly addresses = signal<Address[]>([]);
  readonly message = signal('');
  readonly title = signal('');
  readonly address = signal('');
  readonly mobile = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.http.get<Address[]>(`${API_URL}/api/addresses`).subscribe({
      next: addresses => this.addresses.set(addresses),
      error: () => this.message.set('Could not load addresses.')
    });
  }

  add(): void {
    if (!this.title().trim() || !this.address().trim() || !this.mobile().trim()) return;
    this.http.post<Address>(`${API_URL}/api/addresses`, {
      title: this.title().trim(), address: this.address().trim(), mobile: this.mobile().trim()
    }).subscribe({
      next: () => {
        this.title.set('');
        this.address.set('');
        this.mobile.set('');
        this.load();
      },
      error: () => this.message.set('Could not add address.')
    });
  }

  remove(id: string): void {
    this.http.delete<{ message?: string }>(`${API_URL}/api/addresses/${id}`).subscribe({
      next: () => this.load(),
      error: () => this.message.set('Could not delete address.')
    });
  }

  setDefault(id: string): void {
    this.http.patch<Address>(`${API_URL}/api/addresses/${id}/default`, {}).subscribe({
      next: () => this.load(),
      error: () => this.message.set('Could not set default address.')
    });
  }
}
