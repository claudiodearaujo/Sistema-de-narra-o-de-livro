import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { CharacterService } from '../../../core/services/character.service';
import { VoiceService } from '../../../core/services/voice.service';
import { Voice } from '../../../core/models/voice.model';
import { Character } from '../../../core/models/character.model';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { VoicePreviewComponent } from '../voice-preview/voice-preview.component';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-character-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        VoicePreviewComponent
    ],
    providers: [MessageService],
    templateUrl: './character-form.component.html',
    styleUrl: './character-form.component.css'
})
export class CharacterFormComponent implements OnInit {
    form: FormGroup;
    voices: Voice[] = [];
    bookId: string = '';
    isEditMode = false;
    characterId: string = '';
    loading = false;

    constructor(
        private fb: FormBuilder,
        public ref: DynamicDialogRef,
        public config: DynamicDialogConfig,
        private characterService: CharacterService,
        private voiceService: VoiceService,
        private messageService: MessageService
    ) {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            voiceId: ['', Validators.required],
            voiceDescription: ['']
        });
    }

    ngOnInit(): void {
        this.bookId = this.config.data?.bookId;
        const character = this.config.data?.character as Character;

        this.loadVoices();

        if (character) {
            this.isEditMode = true;
            this.characterId = character.id;
            this.form.patchValue({
                name: character.name,
                voiceId: character.voiceId,
                voiceDescription: character.voiceDescription
            });
        }
    }

    loadVoices() {
        this.voiceService.listVoices().subscribe({
            next: (data) => {
                this.voices = data;
            },
            error: (error) => {
                console.error('Error loading voices:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar vozes.' });
            }
        });
    }

    save() {
        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        const formValue = this.form.value;

        if (this.isEditMode) {
            this.characterService.update(this.characterId, formValue).subscribe({
                next: (updatedCharacter) => {
                    this.loading = false;
                    this.ref.close(updatedCharacter);
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Error updating character:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar personagem.' });
                }
            });
        } else {
            this.characterService.create(this.bookId, formValue).subscribe({
                next: (newCharacter) => {
                    this.loading = false;
                    this.ref.close(newCharacter);
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Error creating character:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao criar personagem.' });
                }
            });
        }
    }

    cancel() {
        this.ref.close();
    }
}
