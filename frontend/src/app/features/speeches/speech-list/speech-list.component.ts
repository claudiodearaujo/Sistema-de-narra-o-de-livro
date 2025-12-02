import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpeechService } from '../../../core/services/speech.service';
import { Speech } from '../../../core/models/speech.model';
import { ButtonModule } from 'primeng/button';
import { OrderListModule } from 'primeng/orderlist';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { SpeechFormComponent } from '../speech-form/speech-form.component';
import { BulkImportComponent } from '../bulk-import/bulk-import.component';

@Component({
    selector: 'app-speech-list',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        OrderListModule,
        ConfirmDialogModule,
        ToastModule,
        TooltipModule
    ],
    providers: [DialogService, MessageService, ConfirmationService],
    templateUrl: './speech-list.component.html',
    styleUrl: './speech-list.component.css'
})
export class SpeechListComponent implements OnInit {
    @Input() bookId: string = '';
    @Input() chapterId: string = '';
    speeches: Speech[] = [];
    ref: DynamicDialogRef<any> | undefined | null;

    constructor(
        private speechService: SpeechService,
        private dialogService: DialogService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit(): void {
        if (this.chapterId) {
            this.loadSpeeches();
        }
    }

    loadSpeeches() {
        this.speechService.getByChapterId(this.chapterId).subscribe({
            next: (data) => {
                this.speeches = data;
            },
            error: (error) => {
                console.error('Error loading speeches:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar falas.' });
            }
        });
    }

    openNew() {
        this.ref = this.dialogService.open(SpeechFormComponent, {
            header: 'Nova Fala',
            width: '60%',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: true,
            data: { bookId: this.bookId, chapterId: this.chapterId }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((speech: Speech) => {
                if (speech) {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Fala criada' });
                    this.loadSpeeches();
                }
            });
        }
    }

    openBulkImport() {
        this.ref = this.dialogService.open(BulkImportComponent, {
            header: 'Importar em Massa',
            width: '60%',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: true,
            data: { bookId: this.bookId, chapterId: this.chapterId }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((result: any) => {
                if (result) {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: result.message });
                    this.loadSpeeches();
                }
            });
        }
    }

    editSpeech(speech: Speech) {
        this.ref = this.dialogService.open(SpeechFormComponent, {
            header: 'Editar Fala',
            width: '60%',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: true,
            data: { bookId: this.bookId, chapterId: this.chapterId, speech: speech }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((updatedSpeech: Speech) => {
                if (updatedSpeech) {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Fala atualizada' });
                    this.loadSpeeches();
                }
            });
        }
    }

    deleteSpeech(speech: Speech) {
        this.confirmationService.confirm({
            message: `Tem certeza que deseja excluir esta fala?`,
            header: 'Confirmar Exclusão',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim',
            rejectLabel: 'Não',
            accept: () => {
                this.speechService.delete(speech.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Fala excluída' });
                        this.loadSpeeches();
                    },
                    error: (error) => {
                        console.error('Error deleting speech:', error);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir fala.' });
                    }
                });
            }
        });
    }

    onReorder() {
        const orderedIds = this.speeches.map(s => s.id);
        this.speechService.reorder(this.chapterId, orderedIds).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ordem atualizada' });
            },
            error: (error) => {
                console.error('Error reordering speeches:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao reordenar falas.' });
                this.loadSpeeches(); // Revert
            }
        });
    }
}
