import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { API_URL } from '../../environments';

interface Testimonial { _id: string; name: string; text: string; rating: number; }

@Component({ selector: 'app-testimonials', standalone: true, imports: [FormsModule, RouterLink], templateUrl: './testimonials.html' })
export class Testimonials implements OnInit {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);
  readonly testimonials = signal<Testimonial[]>([]);
  readonly rating = signal(5);
  readonly text = signal('');
  readonly message = signal('');

  ngOnInit(): void {
    this.http.get<Testimonial[]>(`${API_URL}/api/testimonials`).subscribe({
      next: items => this.testimonials.set(items)
    });
  }

  submit(): void {
    this.http.post<{ message?: string }>(`${API_URL}/api/testimonials`, { rating: this.rating(), text: this.text() }).subscribe({
      next: response => { this.message.set(response.message || 'Thanks, your review is awaiting approval'); this.text.set(''); },
      error: () => this.message.set('Could not submit your review.')
    });
  }
}
