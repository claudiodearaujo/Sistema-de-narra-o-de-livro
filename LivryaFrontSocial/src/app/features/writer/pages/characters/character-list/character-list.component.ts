import { Component, OnInit, inject, input, signal } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { CharacterFormComponent } from '../character-form/character-form.component';
import { VoicePreviewComponent } from '../voice-preview/voice-preview.component';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Book, Character, CharacterService } from 'src/app/core';
import { BookService } from 'src/app/core/services/book.service';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

@Component({
    selector: 'app-character-list',
    standalone: true,
    imports: [
        ButtonModule,
        CardModule,
        TagModule,
        ConfirmDialogModule,
        ToastModule,
        VoicePreviewComponent,
        SelectModule,
        FormsModule,
        TranslocoModule
    ],
    providers: [DialogService, MessageService, ConfirmationService],
    templateUrl: './character-list.component.html',
    styleUrl: './character-list.component.css'
})
export class CharacterListComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private characterService = inject(CharacterService);
    private bookService = inject(BookService);
    private dialogService = inject(DialogService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private analytics = inject(AnalyticsService);

    private readonly translocoService = inject(TranslocoService);

    readonly initialBookId = input<string>('', { alias: 'bookId' });
    bookId = signal<string>('');
    selectedBookId: string | null = null;
    characters: Character[] = [];
    books: Book[] = [];
    ref: DynamicDialogRef<CharacterFormComponent> | undefined | null;

    ngOnInit(): void {
        // Se bookId não vier via @Input, tentar pegar da rota atual ou pai
        const bookId = this.initialBookId();
        if (bookId) {
             this.bookId.set(bookId);
        } else {
             this.bookId.set(this.route.snapshot.paramMap.get('id') || '');
        }
        
        // Re-read value after setting
        const currentBookId = this.bookId();

        if (!currentBookId && this.route.parent) {
            this.bookId.set(this.route.parent.snapshot.paramMap.get('id') || '');
        }

        console.log('Final resolved bookId:', bookId);

        if (bookId) {
            this.selectedBookId = bookId;
            this.loadCharacters();
        } else {
            // Se não tem bookId na rota, carrega a lista de livros para o filtro
            // O próprio loadBooks se encarregará de selecionar o primeiro e carregar os personagens
            this.loadBooks();
        }
    }

    loadBooks() {
        this.bookService.getAll(1, 1000).subscribe({
            next: (response) => {
                this.books = response.data;
                // Se temos livros e nenhum livro foi pré-selecionado (via rota), seleciona o primeiro
                if (this.books.length > 0 && !this.bookId()) {
                    this.selectedBookId = this.books[0].id;
                    this.bookId.set(this.selectedBookId);
                    this.loadCharacters();
                }
            },
            error: (error) => {
                console.error('Error loading books:', error);
            }
        });
    }

    onBookChange() {
        this.bookId.set(this.selectedBookId || '');
        this.loadCharacters();
    }

    loadCharacters() {
        const bookId = this.bookId();
        if (bookId) {
            this.analytics.trackCharactersView(bookId);
            this.characterService.getByBookId(bookId).subscribe({
                next: (data) => {
                    this.characters = data;
                },
                error: (error) => {
                    console.error('Error loading characters:', error);
                    this.analytics.trackError('characters_load_error', error.message || 'Failed to load characters', 'character-list');
                    this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('characters.loadError') });
                }
            });
        } else {
            this.characterService.getAll().subscribe({
                next: (data) => {
                    this.characters = data;
                },
                error: (error) => {
                    console.error('Error loading all characters:', error);
                    this.analytics.trackError('characters_load_error', error.message || 'Failed to load all characters', 'character-list');
                    this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('characters.loadError') });
                }
            });
        }
    }

    getPercentageSeverity(percentage: number | undefined): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
        if (percentage === undefined) return 'secondary';
        if (percentage < 30) return 'danger';
        if (percentage < 70) return 'warn';
        return 'success';
    }

    openNew() {
        this.ref = this.dialogService.open(CharacterFormComponent, {
            header: this.translocoService.translate('characters.newCharacter'),
            width: '90%',
            style: { 'max-width': '1200px' },
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: true,
            data: { bookId: this.bookId() }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((character: Character) => {
                if (character) {
                    this.messageService.add({ severity: 'success', summary: this.translocoService.translate('common.actions.save'), detail: this.translocoService.translate('characters.characterCreated') });
                    this.loadCharacters();
                }
            });
        }
    }

    editCharacter(character: Character) {
        this.ref = this.dialogService.open(CharacterFormComponent, {
            header: this.translocoService.translate('characters.editCharacter'),
            width: '90%',
            style: { 'max-width': '1200px' },
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: true,
            data: { bookId: this.bookId(), character: character }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((updatedCharacter: Character) => {
                if (updatedCharacter) {
                    this.messageService.add({ severity: 'success', summary: this.translocoService.translate('common.actions.save'), detail: this.translocoService.translate('characters.characterUpdated') });
                    this.loadCharacters();
                }
            });
        }
    }

    deleteCharacter(character: Character) {
        this.confirmationService.confirm({
            message: this.translocoService.translate('characters.confirmDelete', { name: character.name }),
            header: this.translocoService.translate('characters.confirmDeleteTitle'),
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: this.translocoService.translate('primeng.accept'),
            rejectLabel: this.translocoService.translate('primeng.reject'),
            accept: () => {
                this.characterService.delete(character.id).subscribe({
                    next: () => {
                        this.analytics.trackEvent('delete_character', {
                            book_id: this.bookId(),
                            character_id: character.id,
                            character_name: character.name,
                            content_type: 'character'
                        });
                        this.messageService.add({ severity: 'success', summary: this.translocoService.translate('common.actions.delete'), detail: this.translocoService.translate('characters.characterDeleted') });
                        this.loadCharacters();
                    },
                    error: (error) => {
                        console.error('Error deleting character:', error);
                        this.analytics.trackError('character_delete_error', error.message || 'Failed to delete character', 'character-list');
                        this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('characters.deleteError') });
                    }
                });
            }
        });
    }
}
