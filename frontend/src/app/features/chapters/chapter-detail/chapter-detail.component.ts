import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ChapterService } from '../../../services/chapter.service';
import { Chapter, ChapterStatus } from '../../../models/chapter.model';
import { SpeechListComponent } from '../../speeches/speech-list/speech-list.component';
import { NarrationControlComponent } from '../narration-control/narration-control.component';
import { AudioPlayerComponent } from '../audio-player/audio-player.component';
import { ExportOptionsComponent } from '../export-options/export-options.component';

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
        ExportOptionsComponent
    ],
    providers: [MessageService],
    templateUrl: './chapter-detail.component.html',
    styleUrls: ['./chapter-detail.component.css']
})
export class ChapterDetailComponent implements OnInit {
    chapter?: Chapter;
    loading = false;
    chapterId?: string;

    constructor(
        private chapterService: ChapterService,
        private route: ActivatedRoute,
        private router: Router,
        private messageService: MessageService
    ) { }

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
                    summary: 'Erro',
                    detail: 'Falha ao carregar capítulo'
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
                return 'Concluído';
            case ChapterStatus.IN_PROGRESS:
                return 'Em Progresso';
            case ChapterStatus.DRAFT:
                return 'Rascunho';
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


}
