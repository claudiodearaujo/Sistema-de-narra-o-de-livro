import { Component, OnInit, OnDestroy, inject, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { NarrationService, Speech, WebSocketService } from 'src/app/core';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

@Component({
    selector: 'app-narration-control',
    standalone: true,
    imports: [ButtonModule, ProgressBarModule, ToastModule, TranslocoModule],
    providers: [MessageService],
    templateUrl: './narration-control.component.html',
    styleUrl: './narration-control.component.css'
})
export class NarrationControlComponent implements OnInit, OnDestroy {
    private narrationService = inject(NarrationService);
    private webSocketService = inject(WebSocketService);
    private messageService = inject(MessageService);
    private analytics = inject(AnalyticsService);

    private readonly translocoService = inject(TranslocoService);
    readonly chapterId = input<string>('');
    readonly hasSpeeches = input<boolean>(false);
    readonly selectedSpeech = input<Speech | null>(null);
    readonly narrationComplete = output<void>();

    status: 'idle' | 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'prioritized' | 'paused' | 'repeat' = 'idle';
    progress: number = 0;
    currentSpeechIndex: number = 0;
    totalSpeeches: number = 0;
    isProcessing: boolean = false;

    get selectedSpeechHasAudio(): boolean {
        return !!(this.selectedSpeech()?.audioUrl);
    }

    getAudioUrl(audioUrl: string | undefined): string {
        if (!audioUrl) return '';
        // If it's already a full URL, return as is
        if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
            return audioUrl;
        }
        // Otherwise, prepend backend URL
        return `http://localhost:3000${audioUrl}`;
    }

    private subscriptions: Subscription[] = [];

    ngOnInit(): void {
        if (this.chapterId()) {
            this.checkStatus();
            this.setupWebSocket();
        }
    }

    ngOnDestroy(): void {
        this.webSocketService.leaveChapter(this.chapterId());
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    setupWebSocket() {
        this.webSocketService.joinChapter(this.chapterId());

        this.subscriptions.push(
            this.webSocketService.onEvent('narration:started').subscribe((data: any) => {
                if (data.chapterId === this.chapterId()) {
                    this.status = 'active';
                    this.isProcessing = true;
                    this.totalSpeeches = data.totalSpeeches;
                    this.progress = 0;
                }
            }),
            this.webSocketService.onEvent('narration:progress').subscribe((data: any) => {
                if (data.chapterId === this.chapterId()) {
                    this.currentSpeechIndex = data.current;
                    this.totalSpeeches = data.total;
                    this.progress = Math.round((this.currentSpeechIndex / this.totalSpeeches) * 100);
                }
            }),
            this.webSocketService.onEvent('narration:completed').subscribe((data: any) => {
                if (data.chapterId === this.chapterId()) {
                    this.status = 'completed';
                    this.isProcessing = false;
                    this.progress = 100;
                    this.messageService.add({ severity: 'success', summary: this.translocoService.translate('narration.success'), detail: this.translocoService.translate('narration.audioGeneratedSuccess') });
                    // TODO: The 'emit' function requires a mandatory void argument
                    this.narrationComplete.emit();
                }
            }),
            this.webSocketService.onEvent('narration:failed').subscribe((data: any) => {
                if (data.chapterId === this.chapterId()) {
                    this.status = 'failed';
                    this.isProcessing = false;
                    this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: data.error || this.translocoService.translate('narration.narrationFailed') });
                }
            })
        );
    }

    checkStatus() {
        this.narrationService.getNarrationStatus(this.chapterId()).subscribe({
            next: (data: any) => {
                this.status = data.status || 'idle';
                if (this.status === 'active' || this.status === 'waiting') {
                    this.isProcessing = true;
                    this.progress = data.progress || 0;
                }
            },
            error: (err) => console.error('Error checking status:', err)
        });
    }

    startNarration() {
        if (!this.hasSpeeches()) {
            this.messageService.add({ severity: 'warn', summary: this.translocoService.translate('narration.warning'), detail: this.translocoService.translate('narration.addSpeechesFirst') });
            return;
        }

        const selectedSpeech = this.selectedSpeech();
        if (!selectedSpeech) {
            this.messageService.add({ severity: 'warn', summary: this.translocoService.translate('narration.selectSpeech'), detail: this.translocoService.translate('narration.chooseSpeechForAudio') });
            return;
        }

        if (this.selectedSpeechHasAudio) {
            this.messageService.add({ severity: 'info', summary: this.translocoService.translate('narration.audioExists'), detail: this.translocoService.translate('narration.speechHasAudio') });
            return;
        }

        this.isProcessing = true;
        this.progress = 0;
        const speechId = selectedSpeech.id;
        const voiceId = selectedSpeech.character?.voiceId || '';
        this.narrationService.startNarration(this.chapterId(), speechId).subscribe({
            next: () => {
                this.analytics.trackTTSGenerate(speechId, voiceId);
                this.messageService.add({ severity: 'info', summary: this.translocoService.translate('narration.started'), detail: this.translocoService.translate('narration.audioGenerationStarted') });
            },
            error: (err) => {
                this.isProcessing = false;
                this.analytics.trackError('tts_generation_error', err.error?.error || 'Failed to start TTS generation', 'narration-control');
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: err.error?.error || this.translocoService.translate('narration.startError') });
            }
        });
    }

    cancelNarration() {
        this.narrationService.cancelNarration(this.chapterId()).subscribe({
            next: () => {
                this.isProcessing = false;
                this.status = 'idle';
                this.progress = 0;
                this.messageService.add({ severity: 'info', summary: this.translocoService.translate('narration.cancelled'), detail: this.translocoService.translate('narration.narrationCancelled') });
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('narration.cancelError') });
            }
        });
    }

    get isGenerateDisabled(): boolean {
        return this.isProcessing || !this.hasSpeeches() || !this.selectedSpeech() || this.selectedSpeechHasAudio;
    }
}
