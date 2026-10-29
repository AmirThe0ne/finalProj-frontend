import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { API_URL } from '../../environments';

interface Product {
  _id: string; title: string; description: string; price: number; stock: number;
  category: string; categoryId?: string; subcategoryId?: string; imageUrl?: string; isActive: boolean;
}
interface Category { _id: string; name: string; slug: string; }
interface Subcategory { _id: string; name: string; category: string | Category; }
interface MessageResponse { message?: string; }

@Component({ selector: 'app-admin-products', standalone: true, imports: [FormsModule], templateUrl: './admin-products.html' })
export class AdminProducts implements OnInit {
  private readonly http = inject(HttpClient);
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly subcategories = signal<Subcategory[]>([]);
  readonly message = signal('');
  readonly editingId = signal('');
  readonly title = signal(''); readonly description = signal(''); readonly price = signal(0); readonly stock = signal(0);
  readonly categoryId = signal(''); readonly subcategoryId = signal(''); readonly imageUrl = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.http.get<Product[]>(`${API_URL}/api/products/admin/all`).subscribe({ next: products => this.products.set(products), error: (error: HttpErrorResponse) => this.setError(error) });
    this.http.get<Category[]>(`${API_URL}/api/categories`).subscribe({ next: categories => this.categories.set(categories) });
    this.http.get<Subcategory[]>(`${API_URL}/api/subcategories`).subscribe({ next: subcategories => this.subcategories.set(subcategories) });
  }

  categoryChanged(id: string): void { this.categoryId.set(id); this.subcategoryId.set(''); }
  selectedSubcategories(): Subcategory[] {
    return this.subcategories().filter(item => (typeof item.category === 'string' ? item.category : item.category._id) === this.categoryId());
  }

  edit(product: Product): void {
    this.editingId.set(product._id); this.title.set(product.title); this.description.set(product.description);
    this.price.set(product.price); this.stock.set(product.stock);
    this.categoryId.set(typeof product.categoryId === 'string' ? product.categoryId : '');
    this.subcategoryId.set(typeof product.subcategoryId === 'string' ? product.subcategoryId : '');
    this.imageUrl.set(product.imageUrl || '');
  }

  reset(): void {
    this.editingId.set(''); this.title.set(''); this.description.set(''); this.price.set(0); this.stock.set(0);
    this.categoryId.set(''); this.subcategoryId.set(''); this.imageUrl.set('');
  }

  save(): void {
    const category = this.categories().find(item => item._id === this.categoryId());
    if (!category) { this.message.set('Select a category.'); return; }
    const body = {
      title: this.title().trim(), description: this.description().trim(), price: this.price(), stock: this.stock(),
      category: category.name, categoryId: category._id, subcategoryId: this.subcategoryId() || undefined, imageUrl: this.imageUrl().trim()
    };
    const request = this.editingId()
      ? this.http.put<MessageResponse>(`${API_URL}/api/products/${this.editingId()}`, body)
      : this.http.post<MessageResponse>(`${API_URL}/api/products`, body);
    request.subscribe({ next: () => { this.message.set(this.editingId() ? 'Product updated.' : 'Product created.'); this.reset(); this.load(); }, error: (error: HttpErrorResponse) => this.setError(error) });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Delete ${product.title}?`)) return;
    this.http.delete<MessageResponse>(`${API_URL}/api/products/${product._id}`).subscribe({ next: () => { this.message.set('Product deleted.'); this.load(); }, error: (error: HttpErrorResponse) => this.setError(error) });
  }

  toggleActive(product: Product): void {
    this.http.patch<MessageResponse>(`${API_URL}/api/products/${product._id}/active`, { isActive: !product.isActive }).subscribe({ next: () => { this.message.set('Product status updated.'); this.load(); }, error: (error: HttpErrorResponse) => this.setError(error) });
  }

  private setError(error: HttpErrorResponse): void {
    const body = error.error as MessageResponse | null;
    this.message.set(body?.message || `Request failed (${error.status}).`);
  }
}
