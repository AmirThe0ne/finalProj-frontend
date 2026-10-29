
import { Routes } from '@angular/router';
import { Cart } from './components/cart/cart';
import { Auth } from './components/auth/auth';
import { Orders } from './components/orders/orders';
import { AdminOrders } from './components/admin-orders/admin-orders';
import { ProductList } from './components/product-list/product-list';
import { Addresses } from './components/addresses/addresses';
import { adminGuard, authGuard } from './auth.guards';
import { AdminProducts } from './components/admin-products/admin-products';
import { AdminCategories } from './components/admin-categories/admin-categories';
import { AdminUsers } from './components/admin-users/admin-users';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { Testimonials } from './components/testimonials/testimonials';
import { AdminTestimonials } from './components/admin-testimonials/admin-testimonials';
import { Faq } from './components/faq/faq';
import { AdminFaq } from './components/admin-faq/admin-faq';
import { About } from './components/about/about';
import { Contact } from './components/contact/contact';
import { Policies } from './components/policies/policies';

export const routes: Routes = [
  { path: 'products', component: ProductList },
  { path: 'cart', component: Cart },
  { path: 'login', component: Auth, data: { mode: 'login' } },
  { path: 'register', component: Auth, data: { mode: 'register' } },
  { path: 'orders', component: Orders, canActivate: [authGuard] },
  { path: 'addresses', component: Addresses, canActivate: [authGuard] },
  { path: 'testimonials', component: Testimonials },
  { path: 'faq', component: Faq },
  { path: 'about', component: About },
  { path: 'contact', component: Contact },
  { path: 'policies', component: Policies },
  { path: 'admin', canActivate: [adminGuard], children: [
    { path: '', component: AdminDashboard, pathMatch: 'full' },
    { path: 'orders', component: AdminOrders },
    { path: 'users', component: AdminUsers },
    { path: 'products', component: AdminProducts },
    { path: 'categories', component: AdminCategories },
    { path: 'testimonials', component: AdminTestimonials },
    { path: 'faq', component: AdminFaq }
  ] },
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: '**', redirectTo: 'products' }
];
