import { Component, OnDestroy, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CharacterService, VoiceService } from 'src/app/core';

@Component({
    selector: 'app-voice-preview',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ProgressSpinnerModule, TranslocoModule],
    templateUrl: './voice-preview.component.html',
    styleUrl: './voice-preview.component.css'
})
export class VoicePreviewComponent implements OnDestroy {
    private voiceService = inject(VoiceService);
    private characterService = inject(CharacterService);
    private messageService = inject(MessageService);

    private readonly translocoService = inject(TranslocoService);

    readonly voiceId = input<string>('');
    readonly text = input<string>('');
    readonly characterId = input<string>(''); // ID do personagem para persistir o áudio

    isLoading = false;
    isPlaying = false;
    hasCachedAudio = false;
    audio: HTMLAudioElement | null = null;

    async play() {
        const voiceId = this.voiceId();
        if (!voiceId) {
            this.messageService.add({ severity: 'warn', summary: this.translocoService.translate('voices.preview.warning'), detail: this.translocoService.translate('voices.preview.selectVoice') });
            return;
        }

        if (this.isPlaying && this.audio) {
            this.stop();
            return;
        }

        this.isLoading = true;

        // Se tem characterId, usar o endpoint de personagem (com cache)
        const characterId = this.characterId();
        if (characterId) {
            console.log('🎵 Requesting preview for character:', characterId, 'voice:', voiceId);
            this.characterService.generatePreviewAudio(characterId).subscribe({
                next: (response) => {
                    console.log('✅ Character preview response:', {
                        audioSize: response.audioBase64?.length || 0,
                        format: response.format,
                        cached: response.cached,
                        audioUrl: response.audioUrl
                    });

                    if (!response.audioBase64) {
                        throw new Error('Audio base64 está vazio');
                    }

                    this.hasCachedAudio = response.cached || false;
                    if (response.cached) {
                        this.messageService.add({
                            severity: 'info',
                            summary: this.translocoService.translate('voices.preview.cache'),
                            detail: this.translocoService.translate('voices.preview.usingCachedAudio')
                        });
                    }

                    this.playAudio(response.audioBase64, response.format || 'wav');
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('❌ Error generating character preview:', error);
                    this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('voices.preview.generateError') });
                    this.isLoading = false;
                }
            });
        } else {
            // Sem characterId, usar o endpoint de voz direto (sem persistir)
            const previewText = this.translocoService.translate('voices.preview.defaultText', { name: this.text() || voiceId });
            console.log('🎵 Requesting preview for voice:', voiceId, 'with text:', previewText);

            this.voiceService.previewVoice(voiceId, previewText).subscribe({
                next: (response) => {
                    console.log('✅ Voice preview response:', {
                        audioSize: response.audioBase64?.length || 0,
                        format: response.format,
                        voiceId: response.voiceId
                    });

                    if (!response.audioBase64) {
                        throw new Error('Audio base64 está vazio');
                    }

                    this.playAudio(response.audioBase64, response.format || 'wav');
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('❌ Error generating preview:', error);
                    this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('voices.preview.generateError') });
                    this.isLoading = false;
                }
            });
        }
    }

    playAudio(base64: string, format: string = 'wav') {
        try {
            if (this.audio) {
                this.audio.pause();
                this.audio = null;
            }

            // Mapear formato para MIME type correto
            const mimeTypes: { [key: string]: string } = {
                'wav': 'audio/wav',
                'mp3': 'audio/mpeg',
                'ogg': 'audio/ogg',
                'webm': 'audio/webm'
            };
            const mimeType = mimeTypes[format.toLowerCase()] || 'audio/wav';

            console.log('🔊 Creating audio element with format:', format, 'mimeType:', mimeType);
            this.audio = new Audio(`data:${mimeType};base64,${base64}`);

            this.audio.onended = () => {
                console.log('🎵 Audio playback ended');
                this.isPlaying = false;
            };

            this.audio.onerror = (error) => {
                console.error('❌ Audio playback error:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: this.translocoService.translate('errors.unexpected'),
                    detail: this.translocoService.translate('voices.preview.playbackError')
                });
                this.isPlaying = false;
            };

            this.audio.onloadeddata = () => {
                console.log('✅ Audio data loaded successfully');
            };

            console.log('▶️ Starting audio playback...');
            this.audio.play()
                .then(() => {
                    console.log('✅ Audio playing successfully');
                    this.isPlaying = true;
                })
                .catch((error) => {
                    console.error('❌ Error playing audio:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: this.translocoService.translate('errors.unexpected'),
                        detail: this.translocoService.translate('voices.preview.startPlaybackError')
                    });
                    this.isPlaying = false;
                });
        } catch (error) {
            console.error('❌ Exception in playAudio:', error);
            this.messageService.add({
                severity: 'error',
                summary: this.translocoService.translate('errors.unexpected'),
                detail: this.translocoService.translate('voices.preview.createAudioError')
            });
            this.isPlaying = false;
        }
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
