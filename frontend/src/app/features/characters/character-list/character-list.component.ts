import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CharacterService } from '../../../core/services/character.service';
import { Character } from '../../../core/models/character.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { CharacterFormComponent } from '../character-form/character-form.component';
import { VoicePreviewComponent } from '../voice-preview/voice-preview.component';

@Component({
    selector: 'app-character-list',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        CardModule,
        ConfirmDialogModule,
        ToastModule,
        VoicePreviewComponent
    ],
    providers: [DialogService, MessageService, ConfirmationService],
    templateUrl: './character-list.component.html',
    styleUrl: './character-list.component.css'
})
export class CharacterListComponent implements OnInit {
    bookId: string = '';
    characters: Character[] = [];
    ref: DynamicDialogRef<CharacterFormComponent> | undefined | null;

    constructor(
        private route: ActivatedRoute,
        private characterService: CharacterService,
        private dialogService: DialogService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.bookId = this.route.snapshot.paramMap.get('id') || '';
        if (this.bookId) {
            this.loadCharacters();
        }
    }

    loadCharacters() {
        this.characterService.getByBookId(this.bookId).subscribe({
            next: (data) => {
                this.characters = data;
            },
            error: (error) => {
                console.error('Error loading characters:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar personagens.' });
            }
        });
    }

    openNew() {
        this.ref = this.dialogService.open(CharacterFormComponent, {
            header: 'Novo Personagem',
            width: '50%',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: true,
            data: { bookId: this.bookId }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((character: Character) => {
                if (character) {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Personagem criado' });
                    this.loadCharacters();
                }
            });
        }
    }

    editCharacter(character: Character) {
        this.ref = this.dialogService.open(CharacterFormComponent, {
            header: 'Editar Personagem',
            width: '50%',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: true,
            data: { bookId: this.bookId, character: character }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((updatedCharacter: Character) => {
                if (updatedCharacter) {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Personagem atualizado' });
                    this.loadCharacters();
                }
            });
        }
    }

    deleteCharacter(character: Character) {
        this.confirmationService.confirm({
            message: `Tem certeza que deseja excluir ${character.name}?`,
            header: 'Confirmar Exclusão',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim',
            rejectLabel: 'Não',
            accept: () => {
                this.characterService.delete(character.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Personagem excluído' });
                        this.loadCharacters();
                    },
                    error: (error) => {
                        console.error('Error deleting character:', error);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir personagem.' });
                    }
                });
            }
        });
    }
}
