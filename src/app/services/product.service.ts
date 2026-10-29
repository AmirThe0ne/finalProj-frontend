
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../environments';

export interface Product {
  _id?: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
private readonly apiUrl = `${API_URL}/api/products`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }
}
