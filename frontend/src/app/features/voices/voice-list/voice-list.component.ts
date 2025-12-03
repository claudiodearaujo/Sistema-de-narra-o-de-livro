import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { VoiceService } from '../../../core/services/voice.service';
import { Voice } from '../../../core/models/voice.model';

@Component({
    selector: 'app-voice-list',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TableModule, TagModule],
    templateUrl: './voice-list.component.html',
    styleUrl: './voice-list.component.css'
})
export class VoiceListComponent implements OnInit {
    voices: Voice[] = [];
    loading = false;

    constructor(private voiceService: VoiceService) { }

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
