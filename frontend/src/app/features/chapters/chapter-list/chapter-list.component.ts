import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderListModule } from 'primeng/orderlist';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { Chapter, ChapterStatus } from '../../../models/chapter.model';
import { ChapterService } from '../../../services/chapter.service';
import { ChapterFormComponent } from '../chapter-form/chapter-form.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-chapter-list',
    standalone: true,
    imports: [
        CommonModule,
        OrderListModule,
        ButtonModule,
        TagModule,
        ConfirmDialogModule,
        ToastModule
    ],
    providers: [DialogService, ConfirmationService],
    templateUrl: './chapter-list.component.html',
    styleUrls: ['./chapter-list.component.css']
})
export class ChapterListComponent implements OnInit {
    @Input() bookId!: string;
    chapters: Chapter[] = [];
    ref: DynamicDialogRef<ChapterFormComponent> | null | undefined;

    constructor(
        private chapterService: ChapterService,
        private dialogService: DialogService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private router: Router
    ) { }

    ngOnInit() {
        if (this.bookId) {
            this.loadChapters();
        }
    }

    loadChapters() {
        this.chapterService.getByBookId(this.bookId).subscribe({
            next: (chapters) => {
                this.chapters = chapters;
            },
            error: (error) => {
                console.error('Error loading chapters:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar capítulos' });
            }
        });
    }

    getStatusSeverity(status: ChapterStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (status) {
            case ChapterStatus.COMPLETED:
                return 'success';
            case ChapterStatus.IN_PROGRESS:
                return 'warn';
            case ChapterStatus.DRAFT:
                return 'secondary';
            default:
                return 'info';
        }
    }

    getStatusLabel(status: ChapterStatus): string {
        switch (status) {
            case ChapterStatus.COMPLETED:
                return 'Concluído';
            case ChapterStatus.IN_PROGRESS:
                return 'Em Progresso';
            case ChapterStatus.DRAFT:
                return 'Rascunho';
            default:
                return status;
        }
    }

    onReorder() {
        const orderedIds = this.chapters.map(c => c.id);
        this.chapterService.reorder(this.bookId, orderedIds).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ordem atualizada' });
            },
            error: (error) => {
                console.error('Error reordering chapters:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao reordenar capítulos' });
                this.loadChapters(); // Revert on error
            }
        });
    }

    createChapter() {
        this.ref = this.dialogService.open(ChapterFormComponent, {
            header: 'Novo Capítulo',
            width: '50%',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            data: { bookId: this.bookId }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((result) => {
                if (result) {
                    this.loadChapters();
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Capítulo criado' });
                }
            });
        }
    }

    editChapter(chapter: Chapter) {
        this.ref = this.dialogService.open(ChapterFormComponent, {
            header: 'Editar Capítulo',
            width: '50%',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            data: { bookId: this.bookId, chapterId: chapter.id }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((result) => {
                if (result) {
                    this.loadChapters();
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Capítulo atualizado' });
                }
            });
        }
    }

    deleteChapter(chapter: Chapter) {
        this.confirmationService.confirm({
            message: `Tem certeza que deseja excluir o capítulo "${chapter.title}"?`,
            header: 'Confirmação',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.chapterService.delete(chapter.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Capítulo excluído' });
                        this.loadChapters();
                    },
                    error: (error) => {
                        console.error('Error deleting chapter:', error);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao excluir capítulo' });
                    }
                });
            }
        });
    }

    viewChapter(chapter: Chapter) {
        this.router.navigate(['/chapters', chapter.id]);
    }
}
