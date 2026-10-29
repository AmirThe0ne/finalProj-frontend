import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { API_URL } from '../../environments';

interface Category { _id: string; name: string; slug: string; }
interface Subcategory { _id: string; name: string; slug: string; category: string | Category; }
interface MessageResponse { message?: string; }

@Component({ selector: 'app-admin-categories', standalone: true, imports: [FormsModule], templateUrl: './admin-categories.html' })
export class AdminCategories implements OnInit {
  private readonly http = inject(HttpClient);
  readonly categories = signal<Category[]>([]);
  readonly subcategories = signal<Subcategory[]>([]);
  readonly message = signal('');
  readonly categoryEditingId = signal(''); readonly categoryName = signal(''); readonly categorySlug = signal('');
  readonly subcategoryEditingId = signal(''); readonly subcategoryName = signal(''); readonly subcategorySlug = signal(''); readonly parentCategoryId = signal('');

  ngOnInit(): void { this.load(); }
  load(): void {
    this.http.get<Category[]>(`${API_URL}/api/categories`).subscribe({ next: items => this.categories.set(items), error: (error: HttpErrorResponse) => this.setError(error) });
    this.http.get<Subcategory[]>(`${API_URL}/api/subcategories`).subscribe({ next: items => this.subcategories.set(items), error: (error: HttpErrorResponse) => this.setError(error) });
  }

  editCategory(item: Category): void { this.categoryEditingId.set(item._id); this.categoryName.set(item.name); this.categorySlug.set(item.slug); }
  resetCategory(): void { this.categoryEditingId.set(''); this.categoryName.set(''); this.categorySlug.set(''); }
  saveCategory(): void {
    const body = { name: this.categoryName().trim(), slug: this.categorySlug().trim() };
    const request = this.categoryEditingId()
      ? this.http.put<MessageResponse>(`${API_URL}/api/categories/${this.categoryEditingId()}`, body)
      : this.http.post<MessageResponse>(`${API_URL}/api/categories`, body);
    request.subscribe({ next: () => { this.message.set('Category saved.'); this.resetCategory(); this.load(); }, error: (error: HttpErrorResponse) => this.setError(error) });
  }
  deleteCategory(item: Category): void {
    if (!confirm(`Delete category ${item.name}?`)) return;
    this.http.delete<MessageResponse>(`${API_URL}/api/categories/${item._id}`).subscribe({ next: () => { this.message.set('Category deleted.'); this.load(); }, error: (error: HttpErrorResponse) => this.setError(error) });
  }

  editSubcategory(item: Subcategory): void {
    this.subcategoryEditingId.set(item._id); this.subcategoryName.set(item.name); this.subcategorySlug.set(item.slug);
    this.parentCategoryId.set(typeof item.category === 'string' ? item.category : item.category._id);
  }
  resetSubcategory(): void { this.subcategoryEditingId.set(''); this.subcategoryName.set(''); this.subcategorySlug.set(''); this.parentCategoryId.set(''); }
  saveSubcategory(): void {
    const body = { name: this.subcategoryName().trim(), slug: this.subcategorySlug().trim(), category: this.parentCategoryId() };
    const request = this.subcategoryEditingId()
      ? this.http.put<MessageResponse>(`${API_URL}/api/subcategories/${this.subcategoryEditingId()}`, body)
      : this.http.post<MessageResponse>(`${API_URL}/api/subcategories`, body);
    request.subscribe({ next: () => { this.message.set('Subcategory saved.'); this.resetSubcategory(); this.load(); }, error: (error: HttpErrorResponse) => this.setError(error) });
  }
  deleteSubcategory(item: Subcategory): void {
    if (!confirm(`Delete subcategory ${item.name}?`)) return;
    this.http.delete<MessageResponse>(`${API_URL}/api/subcategories/${item._id}`).subscribe({ next: () => { this.message.set('Subcategory deleted.'); this.load(); }, error: (error: HttpErrorResponse) => this.setError(error) });
  }

  categoryNameFor(item: Subcategory): string {
    return typeof item.category === 'string' ? this.categories().find(category => category._id === item.category)?.name || 'Unknown' : item.category.name;
  }
  private setError(error: HttpErrorResponse): void {
    const body = error.error as MessageResponse | null;
    this.message.set(body?.message || `Request failed (${error.status}).`);
  }
}
