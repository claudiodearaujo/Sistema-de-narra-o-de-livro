import { Component, OnInit, ElementRef, inject, viewChild } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LanguageSelectorComponent } from '../../../shared/language-selector/language-selector.component';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    MessageModule,
    CardModule,
    ToastModule,
    TranslocoModule,
    LanguageSelectorComponent
],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private analytics = inject(AnalyticsService);
  private messageService = inject(MessageService);

  readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');
  readonly passwordInput = viewChild<ElementRef<HTMLInputElement>>('passwordInput');
  loginForm: FormGroup;
  errorMessage: string | null = null;
  returnUrl: string = '/social/feed';
  translocoLoaded = false;

  private translocoService = inject(TranslocoService);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/social/feed';
  }

  ngOnInit(): void {
    // Check if user already has a valid session
    if (this.authService.isSessionValid()) {
      console.log('[LoginComponent] Valid session found, redirecting to feed');
      const targetUrl = this.returnUrl && this.returnUrl !== '/' ? this.returnUrl : '/social/feed';
      this.router.navigateByUrl(targetUrl);
      return;
    }

    // If session is invalid or expired, tokens will be cleared by login method
    console.log('[LoginComponent] No valid session, showing login form');

    this.checkForAutofill();

    // Aguardar carregamento do transloco com debug detalhado
    const lang = this.translocoService.getActiveLang();
    console.log('[LoginComponent] Starting to load lang:', lang);

    this.translocoService.load(lang).subscribe({
      next: (translations) => {
        console.log('[LoginComponent] Translations loaded:', translations);
        console.log('[LoginComponent] Keys in translation:', Object.keys(translations || {}).slice(0, 10));

        // Dar um pequeno delay para garantir que o transloco processe
        setTimeout(() => {
          this.translocoLoaded = true;
          console.log('[LoginComponent] Transloco loaded:', this.translocoService.getActiveLang());
          console.log('[LoginComponent] Available languages:', this.translocoService.getAvailableLangs());
          console.log('[LoginComponent] Translation test:', this.translocoService.translate('auth.login.title'));
          console.log('[LoginComponent] Direct access test:', (translations as any)?.['auth']?.['login']?.['title']);
        }, 100);
      },
      error: (err) => {
        console.error('[LoginComponent] Failed to load translations:', err);
        // Fallback: mostrar formulário mesmo sem traduções
        this.translocoLoaded = true;
      }
    });
  }



  /**
   * Check if fields were autofilled and sync with form
   */
  private checkForAutofill(): void {
    const emailEl = document.querySelector<HTMLInputElement>('input[formcontrolname="email"]');
    const passwordEl = document.querySelector<HTMLInputElement>('input[type="password"]');

    if (emailEl && emailEl.value && this.loginForm.get('email')?.value !== emailEl.value) {
      this.loginForm.patchValue({ email: emailEl.value }, { emitEvent: true });
    }

    if (passwordEl && passwordEl.value && this.loginForm.get('password')?.value !== passwordEl.value) {
      this.loginForm.patchValue({ password: passwordEl.value }, { emitEvent: true });
    }
  }

  /**
   * Handle input event to sync autofilled values
   */
  onInputChange(field: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value !== this.loginForm.get(field)?.value) {
      this.loginForm.patchValue({ [field]: input.value });
    }
  }

  get isLoading() {
    return this.authService.isLoading();
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(event?: Event): void {
    // Prevent default form submission to avoid page refresh
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Check for autofilled values before validation
    this.checkForAutofill();

    // Small delay to ensure autofill values are synced
    setTimeout(() => {
      this.processLogin();
    }, 50);
  }

  private processLogin(): void {
    // Re-check autofill one more time
    this.checkForAutofill();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      // Show specific validation errors via toast
      const errors = this.getValidationErrors();
      this.messageService.add({
        severity: 'warn',
        summary: this.translocoService.translate('auth.login.invalidFields'),
        detail: errors.join('. '),
        life: 5000
      });
      return;
    }

    this.errorMessage = null;
    console.log('[LoginComponent] Submitting login...');

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        // Track successful login
        this.analytics.trackLogin('email');

        // Track successful login
        this.analytics.trackLogin('email');

        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('auth.login.success'),
          detail: this.translocoService.translate('auth.login.welcomeBack'),
          life: 2000
        });

        // Force navigation after authentication
        const targetUrl = this.returnUrl && this.returnUrl !== '/' ? this.returnUrl : '/social/feed';
        console.log('[LoginComponent] Navigating to target:', targetUrl);
        
        this.router.navigateByUrl(targetUrl).then(
          (success) => {
            if (success) {
               console.log('[LoginComponent] Navigation success');
            } else {
               console.warn('[LoginComponent] Navigation returned false, forcing /social');
               this.router.navigate(['/social']);
            }
          },
          (error) => console.error('[LoginComponent] Navigation error:', error)
        );

      },
      error: (error) => {
        console.error('[LoginComponent] Login error:', error);
        this.analytics.trackError('login_error', error.message || 'Login failed', 'login');
        this.errorMessage = error.message;
      }
    });
  }

  /**
   * Get validation error messages for the form
   */
  private getValidationErrors(): string[] {
    const errors: string[] = [];

    const emailControl = this.loginForm.get('email');
    const passwordControl = this.loginForm.get('password');

    if (emailControl?.errors) {
      if (emailControl.errors['required']) {
        errors.push(this.translocoService.translate('validation.required', { field: this.translocoService.translate('auth.login.email') }));
      } else if (emailControl.errors['email']) {
        errors.push(this.translocoService.translate('validation.email'));
      }
    }

    if (passwordControl?.errors) {
      if (passwordControl.errors['required']) {
        errors.push(this.translocoService.translate('validation.requiredFeminine', { field: this.translocoService.translate('auth.login.password') }));
      } else if (passwordControl.errors['minlength']) {
        errors.push(this.translocoService.translate('validation.minLength', { field: this.translocoService.translate('auth.login.password'), min: 6 }));
      }
    }

    return errors.length > 0 ? errors : [this.translocoService.translate('validation.fillAllFields')];
  }
}
