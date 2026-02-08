import { Component, OnInit, inject, computed } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { VoicePreviewComponent } from '../voice-preview/voice-preview.component';
import { MessageService } from 'primeng/api';
import { TabsModule } from 'primeng/tabs';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { Book, Character, CharacterService, Voice, VoiceService } from 'src/app/core';
import { BookService } from 'src/app/core/services/book.service';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

@Component({
    selector: 'app-character-form',
    standalone: true,
    imports: [
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    VoicePreviewComponent,
    TabsModule,
    ProgressBarModule,
    InputNumberModule,
    TooltipModule
],
    providers: [MessageService],
    templateUrl: './character-form.component.html',
    styleUrl: './character-form.component.css'
})
export class CharacterFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    ref = inject(DynamicDialogRef);
    config = inject(DynamicDialogConfig);
    private characterService = inject(CharacterService);
    private voiceService = inject(VoiceService);
    private bookService = inject(BookService);
    private messageService = inject(MessageService);
    private analytics = inject(AnalyticsService);

    private readonly translocoService = inject(TranslocoService);

    form: FormGroup;
    voices: Voice[] = [];
    books: Book[] = [];
    bookId: string = '';
    isEditMode = false;
    characterId: string = '';
    loading = false;
    completionPercentage = 0;

    // Opções para selects - computed signals para tradução dinâmica
    genderOptions = computed(() => [
        { label: this.translocoService.translate('characters.options.gender.male'), value: 'Masculino' },
        { label: this.translocoService.translate('characters.options.gender.female'), value: 'Feminino' },
        { label: this.translocoService.translate('characters.options.gender.other'), value: 'Outro' }
    ]);

    bodyTypeOptions = computed(() => [
        { label: this.translocoService.translate('characters.options.bodyType.slim'), value: 'Magra' },
        { label: this.translocoService.translate('characters.options.bodyType.athletic'), value: 'Atlética' },
        { label: this.translocoService.translate('characters.options.bodyType.average'), value: 'Média' },
        { label: this.translocoService.translate('characters.options.bodyType.robust'), value: 'Robusta' },
        { label: this.translocoService.translate('characters.options.bodyType.muscular'), value: 'Musculosa' }
    ]);

    postureOptions = computed(() => [
        { label: this.translocoService.translate('characters.options.posture.upright'), value: 'Erguida, elegante' },
        { label: this.translocoService.translate('characters.options.posture.relaxed'), value: 'Relaxada' },
        { label: this.translocoService.translate('characters.options.posture.curved'), value: 'Curvada' },
        { label: this.translocoService.translate('characters.options.posture.rigid'), value: 'Rígida' }
    ]);

    faceShapeOptions = computed(() => [
        { label: this.translocoService.translate('characters.options.faceShape.oval'), value: 'Oval' },
        { label: this.translocoService.translate('characters.options.faceShape.round'), value: 'Redondo' },
        { label: this.translocoService.translate('characters.options.faceShape.square'), value: 'Quadrado' },
        { label: this.translocoService.translate('characters.options.faceShape.rectangular'), value: 'Retangular' },
        { label: this.translocoService.translate('characters.options.faceShape.heart'), value: 'Coração' },
        { label: this.translocoService.translate('characters.options.faceShape.diamond'), value: 'Diamante' }
    ]);

    eyeColorOptions = computed(() => [
        { label: this.translocoService.translate('characters.options.eyeColor.brown'), value: 'Castanho' },
        { label: this.translocoService.translate('characters.options.eyeColor.green'), value: 'Verde' },
        { label: this.translocoService.translate('characters.options.eyeColor.blue'), value: 'Azul' },
        { label: this.translocoService.translate('characters.options.eyeColor.hazel'), value: 'Mel' },
        { label: this.translocoService.translate('characters.options.eyeColor.gray'), value: 'Cinza' },
        { label: this.translocoService.translate('characters.options.eyeColor.black'), value: 'Preto' }
    ]);

    eyeShapeOptions = computed(() => [
        { label: this.translocoService.translate('characters.options.eyeShape.almond'), value: 'Amendoado' },
        { label: this.translocoService.translate('characters.options.eyeShape.round'), value: 'Redondo' },
        { label: this.translocoService.translate('characters.options.eyeShape.downturned'), value: 'Caído' },
        { label: this.translocoService.translate('characters.options.eyeShape.upturned'), value: 'Rasgado' },
        { label: this.translocoService.translate('characters.options.eyeShape.prominent'), value: 'Saltado' }
    ]);

    hairColorOptions = computed(() => [
        { label: this.translocoService.translate('characters.options.hairColor.black'), value: 'Preto' },
        { label: this.translocoService.translate('characters.options.hairColor.darkBrown'), value: 'Castanho Escuro' },
        { label: this.translocoService.translate('characters.options.hairColor.lightBrown'), value: 'Castanho Claro' },
        { label: this.translocoService.translate('characters.options.hairColor.blonde'), value: 'Loiro' },
        { label: this.translocoService.translate('characters.options.hairColor.red'), value: 'Ruivo' },
        { label: this.translocoService.translate('characters.options.hairColor.gray'), value: 'Grisalho' },
        { label: this.translocoService.translate('characters.options.hairColor.white'), value: 'Branco' }
    ]);

    hairTextureOptions = computed(() => [
        { label: this.translocoService.translate('characters.options.hairTexture.straight'), value: 'Liso' },
        { label: this.translocoService.translate('characters.options.hairTexture.wavy'), value: 'Ondulado' },
        { label: this.translocoService.translate('characters.options.hairTexture.curly'), value: 'Cacheado' },
        { label: this.translocoService.translate('characters.options.hairTexture.coily'), value: 'Crespo' }
    ]);

    hairLengthOptions = computed(() => [
        { label: this.translocoService.translate('characters.options.hairLength.bald'), value: 'Careca' },
        { label: this.translocoService.translate('characters.options.hairLength.veryShort'), value: 'Muito Curto' },
        { label: this.translocoService.translate('characters.options.hairLength.short'), value: 'Curto' },
        { label: this.translocoService.translate('characters.options.hairLength.medium'), value: 'Médio' },
        { label: this.translocoService.translate('characters.options.hairLength.long'), value: 'Longo' },
        { label: this.translocoService.translate('characters.options.hairLength.veryLong'), value: 'Muito Longo' }
    ]);

    clothingStyleOptions = computed(() => [
        { label: this.translocoService.translate('characters.options.clothingStyle.casual'), value: 'Casual' },
        { label: this.translocoService.translate('characters.options.clothingStyle.formal'), value: 'Formal' },
        { label: this.translocoService.translate('characters.options.clothingStyle.sporty'), value: 'Esportivo' },
        { label: this.translocoService.translate('characters.options.clothingStyle.elegant'), value: 'Elegante' },
        { label: this.translocoService.translate('characters.options.clothingStyle.boho'), value: 'Boho' },
        { label: this.translocoService.translate('characters.options.clothingStyle.streetwear'), value: 'Streetwear' },
        { label: this.translocoService.translate('characters.options.clothingStyle.classic'), value: 'Clássico' }
    ]);

    constructor() {
        this.form = this.fb.group({
            // Campos básicos obrigatórios
            name: ['', [Validators.required, Validators.minLength(2)]],
            bookId: ['', Validators.required],
            voiceId: ['', Validators.required],
            voiceDescription: [''],

            // Identidade
            identity: this.fb.group({
                gender: [''],
                age: [null],
                nationality: [''],
                occupation: [''],
                birthDate: [''],
                birthPlace: [''],
                personality: [''],
                background: ['']
            }),

            // Físico
            physique: this.fb.group({
                height: [''],
                weight: [''],
                bodyType: [''],
                waist: [''],
                posture: [''],
                skinTone: [''],
                skinTexture: [''],
                scars: [''],
                tattoos: [''],
                birthmarks: ['']
            }),

            // Rosto
            face: this.fb.group({
                faceShape: [''],
                forehead: [''],
                cheekbones: [''],
                chin: [''],
                jaw: [''],
                nose: [''],
                lips: [''],
                expression: [''],
                beard: [''],
                mustache: [''],
                wrinkles: [''],
                dimples: [''],
                freckles: ['']
            }),

            // Olhos
            eyes: this.fb.group({
                eyeSize: [''],
                eyeShape: [''],
                eyeColor: [''],
                eyeSpacing: [''],
                eyelashes: [''],
                eyebrowShape: [''],
                eyebrowColor: [''],
                eyebrowThickness: [''],
                glasses: [''],
                makeup: ['']
            }),

            // Cabelo
            hair: this.fb.group({
                haircut: [''],
                hairLength: [''],
                hairColor: [''],
                hairTexture: [''],
                hairVolume: [''],
                hairStyle: [''],
                hairPart: [''],
                hairShine: [''],
                dyedColor: [''],
                highlights: ['']
            }),

            // Vestuário
            wardrobe: this.fb.group({
                clothingStyle: [''],
                topwear: [''],
                topwearColor: [''],
                topwearBrand: [''],
                bottomwear: [''],
                bottomwearColor: [''],
                bottomwearBrand: [''],
                dress: [''],
                dressColor: [''],
                dressBrand: [''],
                footwear: [''],
                footwearColor: [''],
                footwearBrand: [''],
                heelHeight: [''],
                earrings: [''],
                necklace: [''],
                rings: [''],
                bracelets: [''],
                watch: [''],
                bag: [''],
                hat: [''],
                scarf: [''],
                nails: [''],
                perfume: ['']
            })
        });

        // Calcular percentual quando o form mudar
        this.form.valueChanges.subscribe(() => {
            this.calculateCompletionPercentage();
        });
    }

    ngOnInit(): void {
        this.bookId = this.config.data?.bookId;
        const character = this.config.data?.character as Character;

        this.loadVoices();
        this.loadBooks();

        if (character) {
            this.isEditMode = true;
            this.characterId = character.id;
            this.patchCharacterForm(character);
        } else if (this.bookId) {
            this.form.patchValue({ bookId: this.bookId });
        }
    }

    patchCharacterForm(character: Character) {
        this.form.patchValue({
            name: character.name,
            bookId: character.bookId,
            voiceId: character.voiceId,
            voiceDescription: character.voiceDescription
        });

        if (character.identity) {
            this.form.get('identity')?.patchValue(character.identity);
        }
        if (character.physique) {
            this.form.get('physique')?.patchValue(character.physique);
        }
        if (character.face) {
            this.form.get('face')?.patchValue(character.face);
        }
        if (character.eyes) {
            this.form.get('eyes')?.patchValue(character.eyes);
        }
        if (character.hair) {
            this.form.get('hair')?.patchValue(character.hair);
        }
        if (character.wardrobe) {
            this.form.get('wardrobe')?.patchValue(character.wardrobe);
        }

        this.completionPercentage = character.completionPercentage || 0;
    }

    calculateCompletionPercentage() {
        const fieldCounts = {
            identity: 8,
            physique: 10,
            face: 13,
            eyes: 10,
            hair: 10,
            wardrobe: 24
        };

        let filledCount = 0;
        const totalFields = Object.values(fieldCounts).reduce((a, b) => a + b, 0);

        ['identity', 'physique', 'face', 'eyes', 'hair', 'wardrobe'].forEach(section => {
            const group = this.form.get(section) as FormGroup;
            if (group) {
                Object.keys(group.controls).forEach(key => {
                    const value = group.get(key)?.value;
                    if (value !== null && value !== undefined && value !== '') {
                        filledCount++;
                    }
                });
            }
        });

        this.completionPercentage = Math.round((filledCount / totalFields) * 100);
    }

    getProgressBarColor(): string {
        if (this.completionPercentage < 30) return 'bg-red-500';
        if (this.completionPercentage < 70) return 'bg-yellow-500';
        return 'bg-green-500';
    }

    isBasicFieldsValid(): boolean {
        const nameValid = this.form.get('name')?.valid || false;
        const bookIdValid = this.form.get('bookId')?.valid || false;
        const voiceIdValid = this.form.get('voiceId')?.valid || false;
        return nameValid && bookIdValid && voiceIdValid;
    }

    loadVoices() {
        this.voiceService.listVoices().subscribe({
            next: (data) => {
                this.voices = data;
            },
            error: (error) => {
                console.error('Error loading voices:', error);
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('voices.loadError') });
            }
        });
    }

    loadBooks() {
        this.bookService.getAll(1, 1000).subscribe({
            next: (response) => {
                this.books = response.data;
            },
            error: (error) => {
                console.error('Error loading books:', error);
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('books.loadError') });
            }
        });
    }

    prepareFormData() {
        const formValue = this.form.value;

        // Remover campos vazios dos grupos aninhados
        const cleanGroup = (group: any) => {
            if (!group) return undefined;
            const cleaned: any = {};
            let hasValue = false;
            Object.keys(group).forEach(key => {
                if (group[key] !== null && group[key] !== undefined && group[key] !== '') {
                    cleaned[key] = group[key];
                    hasValue = true;
                }
            });
            return hasValue ? cleaned : undefined;
        };

        return {
            name: formValue.name,
            bookId: formValue.bookId,
            voiceId: formValue.voiceId,
            voiceDescription: formValue.voiceDescription,
            identity: cleanGroup(formValue.identity),
            physique: cleanGroup(formValue.physique),
            face: cleanGroup(formValue.face),
            eyes: cleanGroup(formValue.eyes),
            hair: cleanGroup(formValue.hair),
            wardrobe: cleanGroup(formValue.wardrobe)
        };
    }

    save() {
        if (!this.isBasicFieldsValid()) {
            // Marcar apenas os campos obrigatórios como touched para mostrar erros
            this.form.get('name')?.markAsTouched();
            this.form.get('bookId')?.markAsTouched();
            this.form.get('voiceId')?.markAsTouched();
            return;
        }

        this.loading = true;
        const formData = this.prepareFormData();

        if (this.isEditMode) {
            this.characterService.update(this.characterId, formData).subscribe({
                next: (updatedCharacter) => {
                    this.loading = false;
                    this.analytics.trackEvent('edit_character', {
                        book_id: formData.bookId,
                        character_id: this.characterId,
                        character_name: formData.name,
                        content_type: 'character'
                    });
                    this.ref.close(updatedCharacter);
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Error updating character:', error);
                    this.analytics.trackError('character_edit_error', error.message || 'Failed to update character', 'character-form');
                    this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('characters.updateError') });
                }
            });
        } else {
            const selectedBookId = formData.bookId || this.bookId;
            this.characterService.create(selectedBookId, formData).subscribe({
                next: (newCharacter) => {
                    this.loading = false;
                    this.analytics.trackCharacterCreate(selectedBookId, newCharacter.id, newCharacter.name);
                    this.ref.close(newCharacter);
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Error creating character:', error);
                    this.analytics.trackError('character_create_error', error.message || 'Failed to create character', 'character-form');
                    this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: this.translocoService.translate('characters.createError') });
                }
            });
        }
    }

    cancel() {
        this.ref.close();
    }
}
