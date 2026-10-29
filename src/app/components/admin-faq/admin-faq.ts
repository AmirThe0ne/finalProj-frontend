import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../environments';
interface FaqItem { _id: string; question: string; answer: string; order: number; }
@Component({ selector: 'app-admin-faq', standalone: true, imports: [FormsModule], templateUrl: './admin-faq.html' })
export class AdminFaq implements OnInit {
  private readonly http = inject(HttpClient);
  readonly faqs = signal<FaqItem[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly question = signal(''); readonly answer = signal(''); readonly order = signal(0);
  ngOnInit(): void { this.load(); }

  load(): void {
    this.http.get<FaqItem[]>(`${API_URL}/api/faqs`).subscribe({ next: items => this.faqs.set(items) });
  }

  save(): void {
    const body = { question: this.question(), answer: this.answer(), order: this.order() };
    const request = this.editingId()
      ? this.http.put<FaqItem>(`${API_URL}/api/faqs/${this.editingId()}`, body)
      : this.http.post<FaqItem>(`${API_URL}/api/faqs`, body);
    request.subscribe({ next: () => { this.reset(); this.load(); } });
  }
  edit(faq: FaqItem): void { this.editingId.set(faq._id); this.question.set(faq.question); this.answer.set(faq.answer); this.order.set(faq.order ?? 0); }
  remove(faq: FaqItem): void { if (confirm('Delete this FAQ?')) this.http.delete(`${API_URL}/api/faqs/${faq._id}`).subscribe({ next: () => this.load() }); }
  reset(): void { this.editingId.set(null); this.question.set(''); this.answer.set(''); this.order.set(0); }
}
