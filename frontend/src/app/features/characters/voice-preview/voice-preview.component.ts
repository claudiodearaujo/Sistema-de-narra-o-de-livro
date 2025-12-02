import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { VoiceService } from '../../../core/services/voice.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-voice-preview',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ProgressSpinnerModule],
    templateUrl: './voice-preview.component.html',
    styleUrl: './voice-preview.component.css'
})
export class VoicePreviewComponent implements OnDestroy {
    @Input() voiceId: string = '';
    @Input() text: string = '';

    isLoading = false;
    isPlaying = false;
    audio: HTMLAudioElement | null = null;

    constructor(
        private voiceService: VoiceService,
        private messageService: MessageService
    ) { }

    async play() {
        if (!this.voiceId) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione uma voz para testar.' });
            return;
        }
        if (!this.text) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Digite um texto para testar.' });
            return;
        }

        if (this.isPlaying && this.audio) {
            this.stop();
            return;
        }

        this.isLoading = true;
        try {
            this.voiceService.previewVoice(this.voiceId, this.text).subscribe({
                next: (response) => {
                    this.playAudio(response.audioBase64);
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error generating preview:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao gerar preview da voz.' });
                    this.isLoading = false;
                }
            });
        } catch (error) {
            this.isLoading = false;
        }
    }

    playAudio(base64: string) {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }

        this.audio = new Audio(`data:audio/mp3;base64,${base64}`);
        this.audio.onended = () => {
            this.isPlaying = false;
        };
        this.audio.play();
        this.isPlaying = true;
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.isPlaying = false;
        }
    }

    ngOnDestroy() {
        this.stop();
    }
}
