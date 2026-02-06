import { Component, OnInit, inject, input, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule, Table } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { SpeechFormComponent } from '../speech-form/speech-form.component';
import { BulkImportComponent } from '../bulk-import/bulk-import.component';
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { Speech, SpeechService } from 'src/app/core';

@Component({
    selector: 'app-speech-list',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TableModule,
        InputTextModule,
        ConfirmDialogModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [DialogService, MessageService, ConfirmationService],
    templateUrl: './speech-list.component.html',
    styleUrl: './speech-list.component.css'
})
export class SpeechListComponent implements OnInit {
    private speechService = inject(SpeechService);
    private dialogService = inject(DialogService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private analytics = inject(AnalyticsService);

    private readonly translocoService = inject(TranslocoService);
    readonly bookId = input<string>('');
    readonly chapterId = input<string>('');
    readonly selectionChange = output<Speech | null>();
    readonly table = viewChild.required<Table>('dt');
    speeches: Speech[] = [];
    ref: DynamicDialogRef<any> | undefined | null;
    selectedSpeechId: string | null = null;

    ngOnInit(): void {
        if (this.chapterId()) {
            this.loadSpeeches();
        }
    }

    loadSpeeches() {
        this.speechService.getByChapterId(this.chapterId()).subscribe({
            next: (data) => {
                this.speeches = data;
                if (this.selectedSpeechId !== null) {
                    const selected = this.speeches.find(s => s.id === this.selectedSpeechId) || null;
                    if (!selected) {
                        this.clearSelection();
                    } else {
                        this.selectionChange.emit(selected);
                    }
                }
            },
            error: (error) => {
                console.error('Error loading speeches:', error);
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('speeches.list.loadError') });
            }
        });
    }

    selectSpeech(speech: Speech) {
        const isSameSpeech = this.selectedSpeechId === speech.id;
        this.selectedSpeechId = isSameSpeech ? null : speech.id;
        this.selectionChange.emit(isSameSpeech ? null : speech);
    }

    clearSelection() {
        if (this.selectedSpeechId !== null) {
            this.selectedSpeechId = null;
            this.selectionChange.emit(null);
        }
    }

    openNew() {
        this.ref = this.dialogService.open(SpeechFormComponent, {
            header: this.translocoService.translate('speeches.newSpeech'),
            width: '60%',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: true,
            data: { bookId: this.bookId(), chapterId: this.chapterId() }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((speech: Speech) => {
                if (speech) {
                    this.messageService.add({ severity: 'success', summary: this.translocoService.translate('speeches.list.success'), detail: this.translocoService.translate('speeches.list.speechCreated') });
                    this.loadSpeeches();
                }
            });
        }
    }

    openBulkImport() {
        this.ref = this.dialogService.open(BulkImportComponent, {
            header: this.translocoService.translate('speeches.bulkImport'),
            width: '60%',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: true,
            data: { bookId: this.bookId(), chapterId: this.chapterId() }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((result: any) => {
                if (result) {
                    this.messageService.add({ severity: 'success', summary: this.translocoService.translate('speeches.list.success'), detail: result.message });
                    this.loadSpeeches();
                }
            });
        }
    }

    editSpeech(speech: Speech) {
        this.ref = this.dialogService.open(SpeechFormComponent, {
            header: this.translocoService.translate('speeches.list.editSpeech'),
            width: '60%',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: true,
            data: { bookId: this.bookId(), chapterId: this.chapterId(), speech: speech }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((updatedSpeech: Speech) => {
                if (updatedSpeech) {
                    this.messageService.add({ severity: 'success', summary: this.translocoService.translate('speeches.list.success'), detail: this.translocoService.translate('speeches.list.speechUpdated') });
                    this.loadSpeeches();
                }
            });
        }
    }

    deleteSpeech(speech: Speech) {
        this.confirmationService.confirm({
            message: this.translocoService.translate('speeches.list.confirmDelete'),
            header: this.translocoService.translate('speeches.list.confirmDeleteTitle'),
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: this.translocoService.translate('primeng.accept'),
            rejectLabel: this.translocoService.translate('primeng.reject'),
            accept: () => {
                this.speechService.delete(speech.id).subscribe({
                    next: () => {
                        this.analytics.trackEvent('delete_speech', {
                            speech_id: speech.id,
                            chapter_id: this.chapterId(),
                            character_id: speech.characterId,
                            content_type: 'speech'
                        });
                        this.messageService.add({ severity: 'success', summary: this.translocoService.translate('speeches.list.success'), detail: this.translocoService.translate('speeches.list.speechDeleted') });
                        this.loadSpeeches();
                    },
                    error: (error) => {
                        console.error('Error deleting speech:', error);
                        this.analytics.trackError('speech_delete_error', error.message || 'Failed to delete speech', 'speech-list');
                        this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('speeches.list.deleteError') });
                    }
                });
            }
        });
    }

    onGlobalFilter(event: Event) {
        const input = event.target as HTMLInputElement;
        const table = this.table();
        if (table) {
            table.filterGlobal(input.value, 'contains');
        }
    }
}
