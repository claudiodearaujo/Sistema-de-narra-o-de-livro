import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { VoiceService } from '../../../core/services/voice.service';
import { CustomVoiceService } from '../../../core/services/custom-voice.service';
import { Voice } from '../../../core/models/voice.model';

@Component({
    selector: 'app-voice-list',
    standalone: true,
    imports: [CommonModule, RouterLink, CardModule, ButtonModule, TableModule, TagModule, TooltipModule, ConfirmDialog, Toast],
    providers: [ConfirmationService, MessageService],
    templateUrl: './voice-list.component.html',
    styleUrl: './voice-list.component.css'
})
export class VoiceListComponent implements OnInit {
    voices: Voice[] = [];
    loading = false;

    constructor(
        private voiceService: VoiceService,
        private customVoiceService: CustomVoiceService,
        private router: Router,
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.loadVoices();
    }

    loadVoices() {
        this.loading = true;
        this.voiceService.listVoices().subscribe({
            next: (data: Voice[]) => {
                this.voices = data;
                this.loading = false;
            },
            error: (error: any) => {
                console.error('Error loading voices:', error);
                this.loading = false;
            }
        });
    }

    editVoice(voice: Voice) {
        // Navegar para a página de edição (vamos criar em seguida)
        this.router.navigate(['/voices/edit', voice.id]);
    }

    confirmDelete(voice: Voice) {
        this.confirmationService.confirm({
            message: `Tem certeza que deseja excluir a voz "${voice.name}"?`,
            header: 'Confirmar Exclusão',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, excluir',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteVoice(voice);
            }
        });
    }

    deleteVoice(voice: Voice) {
        if (!voice.id) return;

        this.customVoiceService.delete(voice.id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: `Voz "${voice.name}" excluída com sucesso`
                });
                this.loadVoices();
            },
            error: (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: error.error?.error || 'Erro ao excluir voz'
                });
            }
        });
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
                return 'Masculino';
            case 'FEMALE':
                return 'Feminino';
            default:
                return 'Neutro';
        }
    }
}
