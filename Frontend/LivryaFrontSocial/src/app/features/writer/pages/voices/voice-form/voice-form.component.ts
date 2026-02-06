import { Component, OnInit, inject } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Message } from 'primeng/message';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CustomVoiceService } from 'src/app/core';

@Component({
    selector: 'app-voice-form',
    standalone: true,
    imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    Select,
    TextareaModule,
    Message,
    TranslocoModule
],
    templateUrl: './voice-form.component.html',
    styleUrl: './voice-form.component.css'
})
export class VoiceFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private customVoiceService = inject(CustomVoiceService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    private translocoService = inject(TranslocoService);

    voiceForm!: FormGroup;
    loading = false;
    errorMessage = '';
    isEditMode = false;
    voiceId: string | null = null;

    get genderOptions() {
        return [
            { label: this.translocoService.translate('voiceForm.gender.male'), value: 'MALE' },
            { label: this.translocoService.translate('voiceForm.gender.female'), value: 'FEMALE' },
            { label: this.translocoService.translate('voiceForm.gender.neutral'), value: 'NEUTRAL' }
        ];
    }

    get languageOptions() {
        return [
            { label: this.translocoService.translate('voiceForm.language.ptBR'), value: 'pt-BR' },
            { label: this.translocoService.translate('voiceForm.language.enUS'), value: 'en-US' },
            { label: this.translocoService.translate('voiceForm.language.esES'), value: 'es-ES' },
            { label: this.translocoService.translate('voiceForm.language.frFR'), value: 'fr-FR' },
            { label: this.translocoService.translate('voiceForm.language.deDE'), value: 'de-DE' },
            { label: this.translocoService.translate('voiceForm.language.itIT'), value: 'it-IT' }
        ];
    }

    ngOnInit() {
        this.voiceForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            gender: ['', Validators.required],
            languageCode: ['pt-BR', Validators.required],
            voiceId: ['', [Validators.required, Validators.minLength(2)]],
            description: ['']
        });

        // Verificar se é modo de edição
        this.voiceId = this.route.snapshot.paramMap.get('id');
        if (this.voiceId) {
            this.isEditMode = true;
            this.loadVoice(this.voiceId);
        }
    }

    loadVoice(id: string) {
        this.loading = true;
        this.customVoiceService.getById(id).subscribe({
            next: (voice: any) => {
                this.voiceForm.patchValue({
                    name: voice.name,
                    gender: voice.gender,
                    languageCode: voice.languageCode,
                    voiceId: voice.voiceId,
                    description: voice.description
                });
                this.loading = false;
            },
            error: (error: any) => {
                this.loading = false;
                this.errorMessage = this.translocoService.translate('voiceForm.errors.loadVoice');
                console.error('Error loading voice:', error);
            }
        });
    }

    onSubmit() {
        if (this.voiceForm.invalid) {
            this.voiceForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        const operation = this.isEditMode && this.voiceId
            ? this.customVoiceService.update(this.voiceId, this.voiceForm.value)
            : this.customVoiceService.create(this.voiceForm.value);

        operation.subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/voices']);
            },
            error: (error: any) => {
                this.loading = false;
                const errorKey = this.isEditMode ? 'voiceForm.errors.updateVoice' : 'voiceForm.errors.createVoice';
                this.errorMessage = error.error?.error || this.translocoService.translate(errorKey);
            }
        });
    }

    onCancel() {
        this.router.navigate(['/voices']);
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.voiceForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    getFieldError(fieldName: string): string {
        const field = this.voiceForm.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return this.translocoService.translate('validation.required');
            if (field.errors['minlength']) return this.translocoService.translate('validation.minLength', { count: field.errors['minlength'].requiredLength });
        }
        return '';
    }
}
