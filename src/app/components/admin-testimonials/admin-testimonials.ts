import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../environments';
interface Testimonial { _id: string; name: string; text: string; rating: number; status: 'pending' | 'approved' | 'rejected'; }
@Component({ selector: 'app-admin-testimonials', standalone: true, templateUrl: './admin-testimonials.html' })
export class AdminTestimonials implements OnInit {
  private readonly http = inject(HttpClient);
  readonly testimonials = signal<Testimonial[]>([]);
  readonly message = signal('');
  ngOnInit(): void { this.load(); }
  load(): void { this.http.get<Testimonial[]>(`${API_URL}/api/testimonials/admin`).subscribe({ next: items => this.testimonials.set(items) }); }
  update(id: string, status: 'approved' | 'rejected'): void {
    this.http.patch<Testimonial>(`${API_URL}/api/testimonials/admin/${id}`, { status }).subscribe({ next: () => { this.message.set(`Testimonial ${status}.`); this.load(); } });
  }
}
