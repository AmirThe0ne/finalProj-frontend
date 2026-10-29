
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';
import { finalize, timeout } from 'rxjs';
import { CartItem, CartService } from '../../services/cart.service';
import { Product, ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { API_URL } from '../../environments';

interface OrderResponse {
  message?: string;
  order?: {
    _id?: string;
  };
}

interface ApiError {
  message?: string;
  currentPrice?: number;
  productId?: string;
}

interface SavedAddress {
  _id: string;
  title: string;
  address: string;
  mobile: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly items = signal<CartItem[]>([]);
  readonly total = signal(0);
  readonly address = signal('');
  readonly mobile = signal('');
  readonly message = signal('');
  readonly submitting = signal(false);
  readonly checkingProducts = signal(false);
  readonly savedAddresses = signal<SavedAddress[]>([]);
  readonly selectedAddressId = signal('');

  constructor() {
    effect(() => {
      this.cartService.items();
      this.refreshCart();
    });
  }

  ngOnInit(): void {
    this.refreshCurrentProducts();
    this.loadSavedAddresses();
  }

  loadSavedAddresses(): void {
    if (!this.auth.isLoggedIn()) return;
    this.http.get<SavedAddress[]>(`${API_URL}/api/addresses`).subscribe({
      next: addresses => {
        this.savedAddresses.set(addresses);
        const defaultAddress = addresses.find(address => address.isDefault) || addresses[0];
        if (defaultAddress) this.selectSavedAddress(defaultAddress._id);
      }
    });
  }

  selectSavedAddress(addressId: string): void {
    this.selectedAddressId.set(addressId);
    const address = this.savedAddresses().find(item => item._id === addressId);
    if (!address) return;
    this.address.set(address.address);
    this.mobile.set(address.mobile);
  }

  refreshCart(): void {
    this.items.set(this.cartService.getItems());
    this.total.set(this.cartService.getTotal());
  }

  refreshCurrentProducts(): void {
    if (this.checkingProducts() || this.submitting()) return;
    this.checkingProducts.set(true);
    this.message.set('');

    this.productService.getProducts().pipe(
      timeout(10000),
      finalize(() => this.checkingProducts.set(false))
    ).subscribe({
      next: products => {
        this.cartService.updateProductPrices(products);
        this.refreshCart();
      },
      error: error => {
        console.error('Could not refresh products:', error);
        this.refreshCart();
        this.message.set('Could not verify current prices and stock. Please try again.');
      }
    });
  }

  acceptNewPrice(productId: string | undefined): void {
    if (!productId || this.submitting()) return;
    this.cartService.acceptNewPrice(productId);
    this.refreshCart();
    this.message.set('New price accepted.');
  }

  changeQuantity(productId: string | undefined, quantity: number): void {
    if (!productId || this.submitting()) return;
    if (!Number.isInteger(quantity) || quantity < 1) {
      this.message.set('Please enter a valid quantity.');
      this.refreshCart();
      return;
    }
    this.cartService.changeQuantity(productId, quantity);
    this.refreshCart();
    this.message.set('');
  }

  removeItem(productId: string | undefined): void {
    if (!productId || this.submitting()) return;
    this.cartService.remove(productId);
    this.refreshCart();
    this.message.set('');
  }

  clearCart(): void {
    if (this.submitting()) return;
    this.cartService.clear();
    this.refreshCart();
    this.message.set('');
  }

  disabledReason(): string {
    if (this.submitting()) return 'Placing your order...';
    if (this.checkingProducts()) return 'Checking current prices and stock...';
    if (!this.auth.isLoggedIn()) return 'Please login before placing an order.';
    if (this.items().length === 0) return 'Your cart is empty.';
    if (!this.address().trim()) return 'Enter a delivery address.';
    if (!this.mobile().trim()) return 'Enter a mobile number.';
    if (this.items().some(item => item.isPriceChanged)) return 'Accept every changed product price.';
    if (this.items().some(item => !item.product._id)) return 'Remove the item with an invalid product ID.';
    if (this.items().some(item => item.product.stock <= 0)) return 'Remove the out-of-stock product.';
    if (this.items().some(item => item.quantity > item.product.stock)) return 'Reduce quantities to the available stock.';
    return '';
  }

  checkout(): void {
    if (this.submitting() || this.checkingProducts()) return;
    this.message.set('');
    this.refreshCart();

    if (!this.address().trim() || !this.mobile().trim()) {
      this.message.set('Please enter your address and mobile number.'); return;
    }
    if (this.items().length === 0) { this.message.set('Your cart is empty.'); return; }
    if (this.items().some(item => item.isPriceChanged)) {
      this.message.set('Please accept every changed price before placing your order.'); return;
    }
    if (this.items().some(item => !item.product._id)) {
      this.message.set('A product has an invalid ID. Remove it and add it again.'); return;
    }
    if (this.items().some(item => item.product.stock <= 0)) {
      this.message.set('A product is out of stock. Remove it to continue.'); return;
    }
    if (this.items().some(item => item.quantity > item.product.stock)) {
      this.message.set('A product has insufficient stock. Update its quantity before checkout.'); return;
    }
    if (!this.auth.isLoggedIn()) { this.message.set('Please login first.'); return; }

    const body = {
      items: this.items().map(item => ({ product: item.product._id, quantity: item.quantity, expectedPrice: item.product.price })),
      address: this.address().trim(), mobile: this.mobile().trim()
    };

    this.submitting.set(true);
    this.message.set('Placing order...');
    this.http.post<OrderResponse>(`${API_URL}/api/orders`, body).pipe(
      timeout(15000),
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: response => {
        this.cartService.clear();
        this.refreshCart();
        this.message.set(response.message || 'Order placed successfully! Payment: Cash on Delivery.');
        this.submitting.set(false);
      },
      error: error => {
        console.error('Checkout failed:', error);
        if (error instanceof HttpErrorResponse) {
          const apiError = error.error as ApiError | null;
          if (error.status === 409) {
            this.message.set(apiError?.message || 'The price changed. Refresh your cart and review the new price.');
            this.submitting.set(false);
            this.refreshCurrentProducts();
            return;
          }
          this.message.set(apiError?.message || `Order failed. HTTP status: ${error.status}.`);
        } else {
          this.message.set('Request timed out. Check your orders before trying again.');
        }
        this.submitting.set(false);
      }
    });
  }
}
