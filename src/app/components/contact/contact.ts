import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({ selector: 'app-contact', standalone: true, imports: [FormsModule], templateUrl: './contact.html' })
export class Contact {
  readonly name = signal(''); readonly email = signal(''); readonly message = signal(''); readonly sent = signal(false);
  submit(): void { this.sent.set(true); this.name.set(''); this.email.set(''); this.message.set(''); }
}
