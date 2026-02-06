import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Layout for authentication pages (login, signup, forgot-password).
 * Minimal layout without navigation menu.
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css'
})
export class AuthLayoutComponent {}
