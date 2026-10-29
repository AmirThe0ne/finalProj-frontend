
import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { Product } from './product.service';

export interface CartItem {
  product: Product;
  quantity: number;
  originalPrice: number;
  isPriceChanged: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly guestStorageKey = 'clothing-store-cart:guest';
  private readonly auth = inject(AuthService);
  private activeStorageKey = '';
  private cartItems: CartItem[] = this.loadCart();
  private readonly _items = signal<CartItem[]>(this.cartItems);
  readonly items = this._items.asReadonly();

  private ensureCurrentCart(): void {
    const key = this.storageKey;
    if (this.activeStorageKey !== key) {
      this.activeStorageKey = key;
      this.cartItems = this.loadCartFrom(key);
      this._items.set(this.cartItems);
    }
  }

  private get storageKey(): string {
    const user = this.auth.user();
    return user ? `clothing-store-cart:user:${user.id}` : this.guestStorageKey;
  }

  private loadCart(): CartItem[] {
    try {
      const saved = localStorage.getItem(this.storageKey);

      if (!saved) return [];

      const parsed: unknown = JSON.parse(saved);

      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(
          (item): item is {
            product: Product;
            quantity: number;
            originalPrice?: number;
            isPriceChanged?: boolean;
          } =>
            typeof item === 'object' &&
            item !== null &&
            'product' in item &&
            'quantity' in item
        )
        .map(item => ({
          product: item.product,
          quantity: item.quantity,
          originalPrice:
            typeof item.originalPrice === 'number'
              ? item.originalPrice
              : item.product.price,
          isPriceChanged: item.isPriceChanged ?? false
        }));
    } catch {
      return [];
    }
  }

  private save(): void {
    this.activeStorageKey = this.storageKey;
    localStorage.setItem(this.storageKey, JSON.stringify(this.cartItems));
    this._items.set(this.cartItems.map(item => ({ ...item, product: { ...item.product } })));
  }

  mergeGuestCart(userId: string): void {
    const guestItems = this.loadCartFrom(this.guestStorageKey);
    const currentKey = `clothing-store-cart:user:${userId}`;
    const userItems = this.loadCartFrom(currentKey);

    for (const guestItem of guestItems) {
      if (!guestItem.product._id || guestItem.product.stock <= 0) continue;

      const normalizedGuestItem: CartItem = {
        product: { ...guestItem.product },
        quantity: Math.max(1, Math.min(guestItem.quantity, guestItem.product.stock)),
        originalPrice: guestItem.product.price,
        isPriceChanged: false
      };
      const existing = userItems.find(item => item.product._id === normalizedGuestItem.product._id);
      if (existing && existing.product.stock > 0) {
        existing.quantity = Math.min(
          existing.quantity + normalizedGuestItem.quantity,
          existing.product.stock
        );
        existing.originalPrice = existing.product.price;
        existing.isPriceChanged = false;
      } else {
        userItems.push(normalizedGuestItem);
      }
    }

    localStorage.setItem(currentKey, JSON.stringify(userItems));
    localStorage.removeItem(this.guestStorageKey);
    this.activeStorageKey = currentKey;
    this.cartItems = userItems;
    this._items.set(userItems.map(item => ({ ...item, product: { ...item.product } })));
  }

  private loadCartFrom(key: string): CartItem[] {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is CartItem =>
        typeof item === 'object' && item !== null && 'product' in item && 'quantity' in item
      );
    } catch {
      return [];
    }
  }

  getItems(): CartItem[] {
    this.ensureCurrentCart();
    return this.cartItems.map(item => ({
      ...item,
      product: { ...item.product }
    }));
  }

  getCount(): number {
    this.ensureCurrentCart();
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotal(): number {
    this.ensureCurrentCart();
    return this.cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }

  add(product: Product): void {
    this.ensureCurrentCart();
    if (!product._id || product.stock <= 0) return;

    const existing = this.cartItems.find(
      item => item.product._id === product._id
    );

    if (existing) {
      if (existing.quantity < product.stock) {
        existing.quantity++;
      }

      existing.product = { ...product };
      existing.isPriceChanged =
        existing.originalPrice !== product.price;
    } else {
      this.cartItems.push({
        product: { ...product },
        quantity: 1,
        originalPrice: product.price,
        isPriceChanged: false
      });
    }

    this.save();
  }

  updateProductPrices(products: Product[]): void {
    for (const item of this.cartItems) {
      const currentProduct = products.find(
        product => product._id === item.product._id
      );

      if (!currentProduct) continue;

      item.product = { ...currentProduct };
      item.isPriceChanged =
        item.originalPrice !== currentProduct.price;
    }

    this.save();
  }

  acceptNewPrice(productId: string): void {
    const item = this.cartItems.find(
      current => current.product._id === productId
    );

    if (!item) return;

    item.originalPrice = item.product.price;
    item.isPriceChanged = false;
    this.save();
  }

  remove(productId: string): void {
    this.cartItems = this.cartItems.filter(
      item => item.product._id !== productId
    );

    this.save();
  }

  changeQuantity(productId: string, quantity: number): void {
    const item = this.cartItems.find(
      current => current.product._id === productId
    );

    if (!item) return;

    if (quantity <= 0) {
      this.remove(productId);
      return;
    }

    item.quantity = Math.min(quantity, item.product.stock);
    this.save();
  }

  clear(): void {
    this.cartItems = [];
    this.save();
  }
}
