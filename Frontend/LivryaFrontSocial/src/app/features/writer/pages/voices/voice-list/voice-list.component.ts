import { Component, OnInit, inject } from '@angular/core';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { GEMINI_VOICES, Voice, VoiceService } from 'src/app/core';

@Component({
    selector: 'app-voice-list',
    standalone: true,
    imports: [CardModule, ButtonModule, TableModule, TagModule, TooltipModule, Toast, TranslocoModule],
    providers: [MessageService],
    templateUrl: './voice-list.component.html',
    styleUrl: './voice-list.component.css'
})
export class VoiceListComponent implements OnInit {
    voices: Voice[] = [];
    loading = false;
    previewingVoice: string | null = null;
    previewAudio: HTMLAudioElement | null = null;

    private voiceService = inject(VoiceService);
    private messageService = inject(MessageService);
    private translocoService = inject(TranslocoService);

    ngOnInit() {
        this.loadVoices();
    }

    loadVoices() {
        // Usa as vozes fixas do Gemini
        this.voices = GEMINI_VOICES;
    }

    previewVoice(voice: Voice) {
        if (this.previewingVoice === voice.id) {
            this.stopPreview();
            return;
        }

        this.previewingVoice = voice.id;
        const sampleText = this.translocoService.translate('voiceList.sampleText', { name: voice.name });

        this.voiceService.previewVoice(voice.id, sampleText).subscribe({
            next: (response) => {
                this.stopPreview();
                const audioData = `data:audio/wav;base64,${response.audioBase64}`;
                this.previewAudio = new Audio(audioData);
                this.previewAudio.onended = () => {
                    this.previewingVoice = null;
                };
                this.previewAudio.play();
            },
            error: (error) => {
                this.previewingVoice = null;
                this.messageService.add({
                    severity: 'error',
                    summary: this.translocoService.translate('errors.unexpected'),
                    detail: this.translocoService.translate('voiceList.previewError')
                });
            }
        });
    }

    stopPreview() {
        if (this.previewAudio) {
            this.previewAudio.pause();
            this.previewAudio = null;
        }
        this.previewingVoice = null;
    }

    getGenderSeverity(gender: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        switch (gender?.toUpperCase()) {
            case 'MALE':
                return 'info';
            case 'FEMALE':
                return 'success';
            default:
                return 'warn';
        }
    }

    getGenderLabel(gender: string): string {
        switch (gender?.toUpperCase()) {
            case 'MALE':
                return this.translocoService.translate('voiceList.gender.male');
            case 'FEMALE':
                return this.translocoService.translate('voiceList.gender.female');
            default:
                return this.translocoService.translate('voiceList.gender.neutral');
        }
    }
}
