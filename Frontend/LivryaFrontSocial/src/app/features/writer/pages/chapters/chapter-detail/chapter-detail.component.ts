import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { NarrationControlComponent } from '../narration-control/narration-control.component';
import { AudioPlayerComponent } from '../audio-player/audio-player.component';
import { ExportOptionsComponent } from '../export-options/export-options.component';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ChapterService } from 'src/app/core/services/chapter.service';
import { Chapter, ChapterStatus, Speech } from 'src/app/core';
import { SpeechListComponent } from '../../falas/speech-list/speech-list.component';

@Component({
    selector: 'app-chapter-detail',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        TagModule,
        ToastModule,
        SpeechListComponent,
        NarrationControlComponent,
        AudioPlayerComponent,
        ExportOptionsComponent,
        TranslocoModule
    ],
    providers: [MessageService],
    templateUrl: './chapter-detail.component.html',
    styleUrls: ['./chapter-detail.component.css']
})
export class ChapterDetailComponent implements OnInit {
    private chapterService = inject(ChapterService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private messageService = inject(MessageService);

    private readonly translocoService = inject(TranslocoService);
    chapter?: Chapter;
    loading = false;
    chapterId?: string;
    selectedSpeech: Speech | null = null;

    ngOnInit() {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.chapterId = params['id'];
                this.loadChapter();
            }
        });
    }

    loadChapter() {
        if (!this.chapterId) return;

        this.loading = true;
        this.chapterService.getById(this.chapterId).subscribe({
            next: (chapter) => {
                this.chapter = chapter;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading chapter:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: this.translocoService.translate('errors.unexpected'),
                    detail: this.translocoService.translate('chapters.messages.loadError')
                });
                this.loading = false;
                // Navigate back if not found? Or just show error
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

    backToBook() {
        if (this.chapter) {
            this.router.navigate(['/books', this.chapter.bookId]);
        } else {
            this.router.navigate(['/books']);
        }
    }

    onSpeechSelectionChange(speech: Speech | null) {
        this.selectedSpeech = speech;
    }

    onNarrationComplete() {
        // Reload chapter to get updated audioUrl for speeches
        this.loadChapter();
    }
}
