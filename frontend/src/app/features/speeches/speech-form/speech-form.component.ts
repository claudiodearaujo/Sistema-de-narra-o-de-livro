import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SpeechService } from '../../../core/services/speech.service';
import { CharacterService } from '../../../core/services/character.service';
import { SsmlService } from '../../../core/services/ssml.service';
import { Character } from '../../../core/models/character.model';
import { Speech } from '../../../core/models/speech.model';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { SsmEditorComponent } from '../ssml-editor/ssml-editor.component';

@Component({
    selector: 'app-speech-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        SelectModule,
        SsmEditorComponent
    ],
    providers: [MessageService],
    templateUrl: './speech-form.component.html',
    styleUrl: './speech-form.component.css'
})
export class SpeechFormComponent implements OnInit {
    form: FormGroup;
    characters: Character[] = [];
    chapterId: string = '';
    isEditMode = false;
    speechId: string = '';
    loading = false;
    validating = false;

    constructor(
        private fb: FormBuilder,
        public ref: DynamicDialogRef,
        public config: DynamicDialogConfig,
        private speechService: SpeechService,
        private characterService: CharacterService,
        private ssmlService: SsmlService,
        private messageService: MessageService
    ) {
        this.form = this.fb.group({
            characterId: ['', Validators.required],
            text: ['', Validators.required],
            ssmlText: ['']
        });
    }

    ngOnInit(): void {
        this.chapterId = this.config.data?.chapterId;
        const bookId = this.config.data?.bookId;
        const speech = this.config.data?.speech as Speech;

        if (bookId) {
            this.loadCharacters(bookId);
        }

        if (speech) {
            this.isEditMode = true;
            this.speechId = speech.id;
            this.form.patchValue({
                characterId: speech.characterId,
                text: speech.text,
                ssmlText: speech.ssmlText || speech.text // Default to text if no SSML
            });
        }
    }

    loadCharacters(bookId: string) {
        this.characterService.getByBookId(bookId).subscribe({
            next: (data) => {
                this.characters = data;
            },
            error: (error) => {
                console.error('Error loading characters:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar personagens.' });
            }
        });
    }

    onSsmlChange(newSsml: string) {
        this.form.patchValue({ ssmlText: newSsml });
        // Auto-update plain text from SSML (stripping tags) - simplified
        const plainText = newSsml.replace(/<[^>]*>/g, '');
        this.form.patchValue({ text: plainText }, { emitEvent: false });
    }

    async save() {
        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        const formValue = this.form.value;

        // Validate SSML before saving
        if (formValue.ssmlText) {
            this.validating = true;
            try {
                const validation = await this.ssmlService.validate(formValue.ssmlText).toPromise();
                this.validating = false;
                if (validation && !validation.valid) {
                    this.messageService.add({ severity: 'error', summary: 'Erro SSML', detail: validation.errors.join(', ') });
                    this.loading = false;
                    return;
                }
            } catch (error) {
                this.validating = false;
                console.error('Error validating SSML:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao validar SSML.' });
                this.loading = false;
                return;
            }
        }

        if (this.isEditMode) {
            this.speechService.update(this.speechId, formValue).subscribe({
                next: (updatedSpeech) => {
                    this.loading = false;
                    this.ref.close(updatedSpeech);
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Error updating speech:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar fala.' });
                }
            });
        } else {
            this.speechService.create(this.chapterId, formValue).subscribe({
                next: (newSpeech) => {
                    this.loading = false;
                    this.ref.close(newSpeech);
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Error creating speech:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao criar fala.' });
                }
            });
        }
    }

    cancel() {
        this.ref.close();
    }
}
