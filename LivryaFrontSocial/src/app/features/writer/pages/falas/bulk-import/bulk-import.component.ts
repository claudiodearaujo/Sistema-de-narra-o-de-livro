import { Component, OnInit, inject } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Character, CharacterService, SpeechService } from 'src/app/core';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

@Component({
    selector: 'app-bulk-import',
    standalone: true,
    imports: [
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    TextareaModule,
    RadioButtonModule,
    TranslocoModule
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

    private fb = inject(FormBuilder);
    public ref = inject(DynamicDialogRef);
    public config = inject(DynamicDialogConfig);
    private speechService = inject(SpeechService);
    private characterService = inject(CharacterService);
    private messageService = inject(MessageService);
    private analytics = inject(AnalyticsService);
    private translocoService = inject(TranslocoService);

    constructor() {
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
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('bulkImport.loadCharactersError') });
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
                const bookId = this.config.data?.bookId || '';
                this.analytics.trackEvent('bulk_import_speeches', {
                    book_id: bookId,
                    chapter_id: this.chapterId,
                    strategy: strategy,
                    speeches_count: result.count || 0,
                    content_type: 'speech'
                });
                this.ref.close(result);
            },
            error: (error) => {
                this.loading = false;
                console.error('Error importing speeches:', error);
                this.analytics.trackError('bulk_import_error', error.message || 'Failed to bulk import speeches', 'bulk-import');
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('bulkImport.importError') });
            }
        });
    }

    cancel() {
        this.ref.close();
    }
}
