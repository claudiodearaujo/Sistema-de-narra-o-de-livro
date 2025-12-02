import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { NarrationService } from '../../../core/services/narration.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-narration-control',
    standalone: true,
    imports: [CommonModule, ButtonModule, ProgressBarModule, ToastModule],
    providers: [MessageService],
    templateUrl: './narration-control.component.html',
    styleUrl: './narration-control.component.css'
})
export class NarrationControlComponent implements OnInit, OnDestroy {
    @Input() chapterId: string = '';
    @Input() hasSpeeches: boolean = false;

    status: 'idle' | 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'prioritized' | 'paused' | 'repeat' = 'idle';
    progress: number = 0;
    currentSpeechIndex: number = 0;
    totalSpeeches: number = 0;
    isProcessing: boolean = false;

    private subscriptions: Subscription[] = [];

    constructor(
        private narrationService: NarrationService,
        private webSocketService: WebSocketService,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        if (this.chapterId) {
            this.checkStatus();
            this.setupWebSocket();
        }
    }

    ngOnDestroy(): void {
        this.webSocketService.leaveChapter(this.chapterId);
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    setupWebSocket() {
        this.webSocketService.joinChapter(this.chapterId);

        this.subscriptions.push(
            this.webSocketService.onEvent('narration:started').subscribe((data: any) => {
                if (data.chapterId === this.chapterId) {
                    this.status = 'active';
                    this.isProcessing = true;
                    this.totalSpeeches = data.totalSpeeches;
                    this.progress = 0;
                }
            }),
            this.webSocketService.onEvent('narration:progress').subscribe((data: any) => {
                if (data.chapterId === this.chapterId) {
                    this.currentSpeechIndex = data.current;
                    this.totalSpeeches = data.total;
                    this.progress = Math.round((this.currentSpeechIndex / this.totalSpeeches) * 100);
                }
            }),
            this.webSocketService.onEvent('narration:completed').subscribe((data: any) => {
                if (data.chapterId === this.chapterId) {
                    this.status = 'completed';
                    this.isProcessing = false;
                    this.progress = 100;
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Narração concluída!' });
                }
            }),
            this.webSocketService.onEvent('narration:failed').subscribe((data: any) => {
                if (data.chapterId === this.chapterId) {
                    this.status = 'failed';
                    this.isProcessing = false;
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: data.error || 'Falha na narração.' });
                }
            })
        );
    }

    checkStatus() {
        this.narrationService.getNarrationStatus(this.chapterId).subscribe({
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
        if (!this.hasSpeeches) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Adicione falas antes de gerar a narração.' });
            return;
        }

        this.isProcessing = true;
        this.narrationService.startNarration(this.chapterId).subscribe({
            next: () => {
                this.messageService.add({ severity: 'info', summary: 'Iniciado', detail: 'Geração de narração iniciada.' });
            },
            error: (err) => {
                this.isProcessing = false;
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.error || 'Erro ao iniciar narração.' });
            }
        });
    }

    cancelNarration() {
        this.narrationService.cancelNarration(this.chapterId).subscribe({
            next: () => {
                this.isProcessing = false;
                this.status = 'idle';
                this.progress = 0;
                this.messageService.add({ severity: 'info', summary: 'Cancelado', detail: 'Narração cancelada.' });
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao cancelar narração.' });
            }
        });
    }
}
