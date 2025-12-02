import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SpeechService } from '../../../core/services/speech.service';
import { CharacterService } from '../../../core/services/character.service';
import { Character } from '../../../core/models/character.model';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-bulk-import',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        SelectModule,
        TextareaModule,
        RadioButtonModule
    ],
    providers: [MessageService],
    templateUrl: './bulk-import.component.html',
    styleUrl: './bulk-import.component.css'
})
export class BulkImportComponent implements OnInit {
    form: FormGroup;
    characters: Character[] = [];
    chapterId: string = '';
    loading = false;

    constructor(
        private fb: FormBuilder,
        public ref: DynamicDialogRef,
        public config: DynamicDialogConfig,
        private speechService: SpeechService,
        private characterService: CharacterService,
        private messageService: MessageService
    ) {
        this.form = this.fb.group({
            text: ['', Validators.required],
            strategy: ['paragraph', Validators.required],
            defaultCharacterId: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.chapterId = this.config.data?.chapterId;
        const bookId = this.config.data?.bookId;

        if (bookId) {
            this.loadCharacters(bookId);
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

    import() {
        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        const { text, strategy, defaultCharacterId } = this.form.value;

        this.speechService.bulkCreate(this.chapterId, text, strategy, defaultCharacterId).subscribe({
            next: (result) => {
                this.loading = false;
                this.ref.close(result);
            },
            error: (error) => {
                this.loading = false;
                console.error('Error importing speeches:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao importar falas.' });
            }
        });
    }

    cancel() {
        this.ref.close();
    }
}
