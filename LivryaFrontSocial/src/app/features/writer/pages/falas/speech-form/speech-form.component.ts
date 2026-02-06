import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { SsmEditorComponent } from '../ssml-editor/ssml-editor.component';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Character, CharacterEnrichmentResponse, CharacterService, EmotionImageResponse, Speech, SpeechService, SpellCheckResponse, SsmlService, SuggestionResponse } from 'src/app/core';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

@Component({
    selector: 'app-speech-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        SelectModule,
        ToggleSwitchModule,
        SsmEditorComponent,
        TranslocoModule
    ],
    providers: [MessageService],
    templateUrl: './speech-form.component.html',
    styleUrl: './speech-form.component.css'
})
export class SpeechFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    ref = inject(DynamicDialogRef);
    config = inject(DynamicDialogConfig);
    private speechService = inject(SpeechService);
    private characterService = inject(CharacterService);
    private ssmlService = inject(SsmlService);
    private messageService = inject(MessageService);
    private analytics = inject(AnalyticsService);

    private readonly translocoService = inject(TranslocoService);
    form: FormGroup;
    characters: Character[] = [];
    chapterId: string = '';
    isEditMode = false;
    speechId: string = '';
    loading = false;
    validating = false;
    includeContext = true;
    ssmlGuideVisible = false;

    spellCheckLoading = false;
    suggestionLoading = false;
    characterEnrichmentLoading = false;
    emotionImageLoading = false;

    spellCheckResult?: SpellCheckResponse;
    suggestionResult?: SuggestionResponse;
    characterEnrichmentResult?: CharacterEnrichmentResponse;
    emotionImageResult?: EmotionImageResponse;

    constructor() {
        this.form = this.fb.group({
            characterId: ['', Validators.required],
            text: ['', Validators.required],
            ssmlText: ['']
        });
    }

    ngOnInit(): void {
        this.chapterId = this.config.data?.chapterId;
        const bookId = this.config.data?.bookId;
        const speech = this.config.data?.speech as Speech;

        if (bookId) {
            this.loadCharacters(bookId);
        }

        if (speech) {
            this.isEditMode = true;
            this.speechId = speech.id;
            this.form.patchValue({
                characterId: speech.characterId,
                text: speech.text,
                ssmlText: speech.ssmlText || speech.text // Default to text if no SSML
            });
        }
    }

    loadCharacters(bookId: string) {
        this.characterService.getByBookId(bookId).subscribe({
            next: (data) => {
                this.characters = data;
            },
            error: (error) => {
                console.error('Error loading characters:', error);
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('characters.loadError') });
            }
        });
    }

    get emotionImageDataUrl(): string | null {
        if (!this.emotionImageResult) {
            return null;
        }
        return `data:${this.emotionImageResult.mimeType};base64,${this.emotionImageResult.imageBase64}`;
    }

    toggleSsmlGuide() {
        this.ssmlGuideVisible = !this.ssmlGuideVisible;
    }

    private applyTextToForm(newText: string) {
        this.form.patchValue({ text: newText });
        this.form.markAsDirty();
        this.form.get('text')?.markAsDirty();
        const ssmlControl = this.form.get('ssmlText');
        const currentSsml = (ssmlControl?.value || '').toString().trim();
        const strippedSsml = currentSsml.replace(/<[^>]*>/g, '').trim();
        const plainCurrent = strippedSsml || currentSsml;
        if (!plainCurrent || plainCurrent === this.form.get('text')?.value) {
            ssmlControl?.setValue(newText);
            ssmlControl?.markAsDirty();
        }
    }

    runSpellCheck() {
        const text = this.form.get('text')?.value;
        if (!text || !text.trim()) {
            this.messageService.add({ severity: 'warn', summary: this.translocoService.translate('speeches.form.warning'), detail: this.translocoService.translate('speeches.form.writeTextFirst') });
            return;
        }

        this.spellCheckResult = undefined;
        this.spellCheckLoading = true;
        this.speechService.spellCheck({ text }).subscribe({
            next: (result) => {
                this.spellCheckResult = result;
                this.spellCheckLoading = false;
                this.messageService.add({ severity: 'success', summary: this.translocoService.translate('speeches.form.correctionReady'), detail: this.translocoService.translate('speeches.form.reviewAndApply') });
            },
            error: (error) => {
                this.spellCheckLoading = false;
                console.error('Spell check error', error);
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: error.error?.error || this.translocoService.translate('speeches.form.spellCheckError') });
            }
        });
    }

    applySpellCheck() {
        if (!this.spellCheckResult) {
            return;
        }
        this.applyTextToForm(this.spellCheckResult.correctedText);
        this.spellCheckResult = undefined;
        this.messageService.add({ severity: 'success', summary: this.translocoService.translate('speeches.form.textUpdated'), detail: this.translocoService.translate('speeches.form.correctionsApplied') });
    }

    runSuggestions() {
        const text = this.form.get('text')?.value;
        if (!text || !text.trim()) {
            this.messageService.add({ severity: 'warn', summary: this.translocoService.translate('speeches.form.warning'), detail: this.translocoService.translate('speeches.form.writeForSuggestions') });
            return;
        }

        this.suggestionResult = undefined;
        this.suggestionLoading = true;
        this.speechService.suggestImprovements({
            text,
            characterId: this.form.get('characterId')?.value,
            chapterId: this.chapterId,
            includeContext: this.includeContext
        }).subscribe({
            next: (result) => {
                this.suggestionResult = result;
                this.suggestionLoading = false;
            },
            error: (error) => {
                this.suggestionLoading = false;
                console.error('Suggestion error', error);
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: error.error?.error || this.translocoService.translate('speeches.form.suggestionsError') });
            }
        });
    }

    applySuggestion() {
        if (!this.suggestionResult) {
            return;
        }
        this.applyTextToForm(this.suggestionResult.improvedText);
        this.suggestionResult = undefined;
        this.messageService.add({ severity: 'success', summary: this.translocoService.translate('speeches.form.textUpdated'), detail: this.translocoService.translate('speeches.form.suggestionApplied') });
    }

    runCharacterEnrichment() {
        const characterId = this.form.get('characterId')?.value;
        if (!characterId) {
            this.messageService.add({ severity: 'warn', summary: this.translocoService.translate('speeches.form.selectCharacter'), detail: this.translocoService.translate('speeches.form.chooseCharacterForDetails') });
            return;
        }

        this.characterEnrichmentResult = undefined;
        this.characterEnrichmentLoading = true;
        this.speechService.enrichWithCharacter({
            characterId,
            text: this.form.get('text')?.value
        }).subscribe({
            next: (result) => {
                this.characterEnrichmentResult = result;
                this.characterEnrichmentLoading = false;
            },
            error: (error) => {
                this.characterEnrichmentLoading = false;
                console.error('Character enrichment error', error);
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: error.error?.error || this.translocoService.translate('speeches.form.enrichmentError') });
            }
        });
    }

    applyCharacterEnrichment() {
        if (!this.characterEnrichmentResult) {
            return;
        }
        this.applyTextToForm(this.characterEnrichmentResult.enrichedText);
        this.characterEnrichmentResult = undefined;
        this.messageService.add({ severity: 'success', summary: this.translocoService.translate('speeches.form.textUpdated'), detail: this.translocoService.translate('speeches.form.characterDetailsIncluded') });
    }

    generateEmotionImage() {
        const text = this.form.get('text')?.value;
        if (!text || !text.trim()) {
            this.messageService.add({ severity: 'warn', summary: this.translocoService.translate('speeches.form.textRequired'), detail: this.translocoService.translate('speeches.form.writeSpeechForImage') });
            return;
        }

        this.emotionImageResult = undefined;
        this.emotionImageLoading = true;
        this.speechService.generateEmotionImage({
            text,
            characterId: this.form.get('characterId')?.value
        }).subscribe({
            next: (result) => {
                this.emotionImageResult = result;
                this.emotionImageLoading = false;
            },
            error: (error) => {
                this.emotionImageLoading = false;
                console.error('Emotion image error', error);
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: error.error?.error || this.translocoService.translate('speeches.form.imageGenerationError') });
            }
        });
    }

    onSsmlChange(newSsml: string) {
        this.form.patchValue({ ssmlText: newSsml });
        // Auto-update plain text from SSML (stripping tags) - simplified
        const plainText = newSsml.replace(/<[^>]*>/g, '');
        this.form.patchValue({ text: plainText }, { emitEvent: false });
    }

    async save() {
        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        const formValue = this.form.value;

        // Wrap SSML content with <speak> tag if not already present
        if (formValue.ssmlText) {
            const trimmedSsml = formValue.ssmlText.trim();
            if (!trimmedSsml.startsWith('<speak>')) {
                formValue.ssmlText = `<speak>${trimmedSsml}</speak>`;
            }
        }

        // Validate SSML before saving
        if (formValue.ssmlText) {
            this.validating = true;
            try {
                const validation = await this.ssmlService.validate(formValue.ssmlText).toPromise();
                this.validating = false;
                if (validation && !validation.valid) {
                    this.messageService.add({ severity: 'error', summary: this.translocoService.translate('speeches.form.ssmlError'), detail: validation.errors.join(', ') });
                    this.loading = false;
                    return;
                }
            } catch (error) {
                this.validating = false;
                console.error('Error validating SSML:', error);
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('speeches.form.ssmlValidationError') });
                this.loading = false;
                return;
            }
        }

        if (this.isEditMode) {
            this.speechService.update(this.speechId, formValue).subscribe({
                next: (updatedSpeech) => {
                    this.loading = false;
                    this.analytics.trackEvent('edit_speech', {
                        speech_id: this.speechId,
                        chapter_id: this.chapterId,
                        character_id: formValue.characterId,
                        content_type: 'speech'
                    });
                    this.ref.close(updatedSpeech);
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Error updating speech:', error);
                    this.analytics.trackError('speech_edit_error', error.message || 'Failed to update speech', 'speech-form');
                    this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('speeches.form.updateError') });
                }
            });
        } else {
            this.speechService.create(this.chapterId, formValue).subscribe({
                next: (newSpeech) => {
                    this.loading = false;
                    const bookId = this.config.data?.bookId || '';
                    this.analytics.trackSpeechCreate(bookId, this.chapterId, formValue.characterId);
                    this.ref.close(newSpeech);
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Error creating speech:', error);
                    this.analytics.trackError('speech_create_error', error.message || 'Failed to create speech', 'speech-form');
                    this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('speeches.form.createError') });
                }
            });
        }
    }

    cancel() {
        this.ref.close();
    }
}
