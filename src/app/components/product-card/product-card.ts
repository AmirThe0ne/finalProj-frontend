
import { Component, Input, inject } from '@angular/core';
import { Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {
  @Input({ required: true }) product!: Product;

  private readonly cartService = inject(CartService);

  addToCart(): void {
    if (!this.product || this.product.stock <= 0) {
      alert('This product is out of stock.');
      return;
    }

    this.cartService.add(this.product);
    alert('Product added to cart!');
  }
}
