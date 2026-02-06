import { Component, OnInit, signal, inject } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageModule } from 'primeng/message';
import { TabsModule } from 'primeng/tabs';
import { PasswordModule } from 'primeng/password';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    AvatarModule,
    FileUploadModule,
    MessageModule,
    TabsModule,
    PasswordModule,
    TranslocoModule
],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  profileForm: FormGroup;
  passwordForm: FormGroup;

  user = signal<User | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  isChangingPassword = signal(false);

  successMessage: string | null = null;
  errorMessage: string | null = null;
  passwordSuccess: string | null = null;
  passwordError: string | null = null;

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      bio: ['', [Validators.maxLength(500)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  get pf() {
    return this.profileForm.controls;
  }

  get pwf() {
    return this.passwordForm.controls;
  }

  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  loadProfile(): void {
    this.isLoading.set(true);

    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user.set(user);
        this.profileForm.patchValue({
          name: user.name,
          username: user.username || '',
          bio: user.bio || ''
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage = 'Erro ao carregar perfil';
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.successMessage = null;
    this.errorMessage = null;

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: (user) => {
        this.user.set(user);
        this.isSaving.set(false);
        this.successMessage = 'Perfil atualizado com sucesso!';
      },
      error: (error) => {
        this.isSaving.set(false);
        this.errorMessage = error.message;
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordSuccess = null;
    this.passwordError = null;

    this.authService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.passwordSuccess = 'Senha alterada com sucesso!';
        this.passwordForm.reset();
      },
      error: (error) => {
        this.isChangingPassword.set(false);
        this.passwordError = error.message;
      }
    });
  }

  onAvatarUpload(event: any): void {
    const file = event.files[0];
    if (file) {
      this.authService.uploadAvatar(file).subscribe({
        next: (response) => {
          const currentUser = this.user();
          if (currentUser) {
            this.user.set({ ...currentUser, avatar: response.avatarUrl });
          }
        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      });
    }
  }

  getInitials(): string {
    const user = this.user();
    if (!user?.name) return '?';

    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }
}
