import { Component, OnInit, inject, input, output } from '@angular/core';

import { OrderListModule } from 'primeng/orderlist';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ChapterFormComponent } from '../chapter-form/chapter-form.component';
import { Router } from '@angular/router';
import { Chapter, ChapterStatus } from 'src/app/core';
import { ChapterService } from 'src/app/core/services/chapter.service';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

@Component({
    selector: 'app-chapter-list',
    standalone: true,
    imports: [
    OrderListModule,
    TableModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    TranslocoModule
],
    providers: [DialogService, ConfirmationService, MessageService],
    templateUrl: './chapter-list.component.html',
    styleUrls: ['./chapter-list.component.css']
})
export class ChapterListComponent implements OnInit {
    private chapterService = inject(ChapterService);
    private dialogService = inject(DialogService);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);
    private router = inject(Router);
    private analytics = inject(AnalyticsService);

    private translocoService = inject(TranslocoService);
    readonly bookId = input.required<string>();
    readonly chapterChanged = output<void>();
    chapters: Chapter[] = [];
    ref: DynamicDialogRef<ChapterFormComponent> | null | undefined;

    ngOnInit() {
        if (this.bookId()) {
            this.loadChapters();
        }
    }

    loadChapters() {
        this.chapterService.getByBookId(this.bookId()).subscribe({
            next: (chapters) => {
                this.chapters = chapters;
            },
            error: (error) => {
                console.error('Error loading chapters:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: this.translocoService.translate('errors.unexpected'),
                    detail: this.translocoService.translate('chapters.messages.loadError')
                });
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
                return this.translocoService.translate('chapters.status.completed');
            case ChapterStatus.IN_PROGRESS:
                return this.translocoService.translate('chapters.status.inProgress');
            case ChapterStatus.DRAFT:
                return this.translocoService.translate('chapters.status.draft');
            default:
                return status;
        }
    }

    onReorder() {
        const orderedIds = this.chapters.map(c => c.id);
        this.chapterService.reorder(this.bookId(), orderedIds).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: this.translocoService.translate('common.actions.confirm'),
                    detail: this.translocoService.translate('chapters.messages.reorderSuccess')
                });
            },
            error: (error) => {
                console.error('Error reordering chapters:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: this.translocoService.translate('errors.unexpected'),
                    detail: this.translocoService.translate('chapters.messages.reorderError')
                });
                this.loadChapters(); // Revert on error
            }
        });
    }

    editChapter(chapter: Chapter) {
        this.ref = this.dialogService.open(ChapterFormComponent, {
            header: this.translocoService.translate('chapters.editChapter'),
            width: '50%',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            data: { bookId: this.bookId(), chapterId: chapter.id }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((result) => {
                if (result) {
                    this.loadChapters();
                    // TODO: The 'emit' function requires a mandatory void argument
                    this.chapterChanged.emit();
                    this.messageService.add({
                        severity: 'success',
                        summary: this.translocoService.translate('common.actions.confirm'),
                        detail: this.translocoService.translate('chapters.messages.updateSuccess')
                    });
                }
            });
        }
    }

    deleteChapter(chapter: Chapter) {
        this.confirmationService.confirm({
            message: this.translocoService.translate('chapters.messages.confirmDelete', { title: chapter.title }),
            header: this.translocoService.translate('chapters.messages.confirmation'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.chapterService.delete(chapter.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: this.translocoService.translate('common.actions.confirm'),
                            detail: this.translocoService.translate('chapters.messages.deleteSuccess')
                        });
                        this.loadChapters();
                        // TODO: The 'emit' function requires a mandatory void argument
                        this.chapterChanged.emit();
                    },
                    error: (error) => {
                        console.error('Error deleting chapter:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: this.translocoService.translate('errors.unexpected'),
                            detail: this.translocoService.translate('chapters.messages.deleteError')
                        });
                    }
                });
            }
        });
    }

    viewChapter(chapter: Chapter) {
        this.analytics.trackChapterView(this.bookId(), chapter.id, chapter.title);
        this.router.navigate(['/writer/chapters', chapter.id]);
    }
}
