import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-export-options',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
        <div class="export-options p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm mt-4">
            <h3 class="text-lg font-semibold mb-3 text-[var(--color-metal)] dark:text-gray-200">Processamento de Áudio</h3>
            
            <div class="flex flex-col gap-3">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Gera o arquivo final unindo todas as falas, normalizando o volume e exportando para MP3.
                </p>
                
                <div class="flex gap-2">
                    <p-button 
                        label="Processar Áudio Final" 
                        icon="pi pi-cog" 
                        (onClick)="processAudio()" 
                        [loading]="processing"
                        [disabled]="processing || !canProcess"
                        severity="help">
                    </p-button>
                    
                    <p-button 
                        *ngIf="processing"
                        label="Ver Status" 
                        icon="pi pi-refresh" 
                        (onClick)="checkStatus()" 
                        [outlined]="true"
                        severity="secondary">
                    </p-button>
                </div>

                <div *ngIf="status" class="text-sm mt-2">
                    Status: <span class="font-semibold">{{ status }}</span>
                </div>
            </div>
        </div>
    `
})
export class ExportOptionsComponent {
    @Input() chapterId: string = '';
    @Input() canProcess: boolean = false;
    @Output() onProcessComplete = new EventEmitter<string>();

    processing = false;
    status = '';
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient, private messageService: MessageService) { }

    processAudio() {
        this.processing = true;
        this.status = 'Iniciando...';

        this.http.post(`${this.apiUrl}/chapters/${this.chapterId}/audio/process`, {}).subscribe({
            next: (res: any) => {
                this.messageService.add({ severity: 'info', summary: 'Processamento Iniciado', detail: 'O áudio está sendo gerado em segundo plano.' });
                this.pollStatus();
            },
            error: (err) => {
                this.processing = false;
                this.status = 'Erro ao iniciar';
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.error || 'Falha ao iniciar processamento.' });
            }
        });
    }

    checkStatus() {
        this.http.get(`${this.apiUrl}/chapters/${this.chapterId}/audio/status`).subscribe({
            next: (res: any) => {
                this.status = res.status;
                if (res.status === 'completed') {
                    this.processing = false;
                    // Assuming result contains the URL or we fetch chapter again
                    this.onProcessComplete.emit(res.result);
                    this.messageService.add({ severity: 'success', summary: 'Concluído', detail: 'Áudio final gerado com sucesso!' });
                } else if (res.status === 'failed') {
                    this.processing = false;
                    this.messageService.add({ severity: 'error', summary: 'Falha', detail: res.failedReason || 'Erro no processamento.' });
                }
            },
            error: (err) => console.error(err)
        });
    }

    pollStatus() {
        const interval = setInterval(() => {
            if (!this.processing) {
                clearInterval(interval);
                return;
            }
            this.checkStatus();
        }, 3000);
    }
}
