import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../environments';
interface FaqItem { _id: string; question: string; answer: string; }
@Component({ selector: 'app-faq', standalone: true, templateUrl: './faq.html' })
export class Faq implements OnInit {
  private readonly http = inject(HttpClient);
  readonly faqs = signal<FaqItem[]>([]);
  ngOnInit(): void {
    this.http.get<FaqItem[]>(`${API_URL}/api/faqs`).subscribe({
      next: items => this.faqs.set(items)
    });
  }
}
