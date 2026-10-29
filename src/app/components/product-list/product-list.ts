
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product, ProductService } from '../../services/product.service';
import { ProductCard } from '../product-card/product-card';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductCard, FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit {
  private readonly productService = inject(ProductService);
  readonly products = signal<Product[]>([]);
  readonly errorMessage = signal('');
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('');
  readonly categories = computed(() => [...new Set(
    this.products().map(product => product.category).filter(Boolean)
  )]);
  readonly filteredProducts = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    return this.products().filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search);
      const matchesCategory = !this.selectedCategory() || product.category === this.selectedCategory();
      return matchesSearch && matchesCategory;
    });
  });

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: data => this.products.set([...data]),
      error: error => {
        console.error('Failed to load products:', error);
        this.errorMessage.set('Could not load products.');
      }
    });
  }
}
