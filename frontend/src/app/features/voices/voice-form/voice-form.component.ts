import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Message } from 'primeng/message';
import { CustomVoiceService } from '../../../core/services/custom-voice.service';

@Component({
    selector: 'app-voice-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        Select,
        TextareaModule,
        Message
    ],
    templateUrl: './voice-form.component.html',
    styleUrl: './voice-form.component.css'
})
export class VoiceFormComponent implements OnInit {
    voiceForm!: FormGroup;
    loading = false;
    errorMessage = '';
    isEditMode = false;
    voiceId: string | null = null;

    genderOptions = [
        { label: 'Masculino', value: 'MALE' },
        { label: 'Feminino', value: 'FEMALE' },
        { label: 'Neutro', value: 'NEUTRAL' }
    ];

    languageOptions = [
        { label: 'Português (Brasil)', value: 'pt-BR' },
        { label: 'Inglês (EUA)', value: 'en-US' },
        { label: 'Espanhol', value: 'es-ES' },
        { label: 'Francês', value: 'fr-FR' },
        { label: 'Alemão', value: 'de-DE' },
        { label: 'Italiano', value: 'it-IT' }
    ];

    constructor(
        private fb: FormBuilder,
        private customVoiceService: CustomVoiceService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

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
                this.errorMessage = 'Erro ao carregar voz';
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
                this.errorMessage = error.error?.error || `Erro ao ${this.isEditMode ? 'atualizar' : 'cadastrar'} voz`;
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
            if (field.errors['required']) return 'Campo obrigatório';
            if (field.errors['minlength']) return `Mínimo de ${field.errors['minlength'].requiredLength} caracteres`;
        }
        return '';
    }
}
