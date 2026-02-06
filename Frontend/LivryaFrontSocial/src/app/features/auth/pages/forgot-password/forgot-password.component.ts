import { Component, signal, inject } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LanguageSelectorComponent } from '../../../shared/language-selector/language-selector.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    MessageModule,
    TranslocoModule,
    LanguageSelectorComponent
],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  forgotForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isSubmitting = signal(false);
  emailSent = signal(false);

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() {
    return this.forgotForm.controls;
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage = null;

    this.authService.requestPasswordReset(this.forgotForm.value).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.emailSent.set(true);
        this.successMessage = response.message || 'E-mail de recuperação enviado com sucesso!';
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage = error.message;
      }
    });
  }

  resendEmail(): void {
    this.emailSent.set(false);
    this.successMessage = null;
  }
}
