import { Component, inject, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

@Component({
    selector: 'app-export-options',
    standalone: true,
    imports: [ButtonModule, TranslocoModule],
    templateUrl: './export-options.component.html'
})
export class ExportOptionsComponent {
    private http = inject(HttpClient);
    private messageService = inject(MessageService);

    private readonly translocoService = inject(TranslocoService);
    readonly chapterId = input<string>('');
    readonly canProcess = input<boolean>(false);
    readonly onProcessComplete = output<string>();

    processing = false;
    status = '';
    private apiUrl = 'http://localhost:3000/api';

    processAudio() {
        this.processing = true;
        this.status = this.translocoService.translate('export.status.starting');

        this.http.post(`${this.apiUrl}/chapters/${this.chapterId()}/audio/process`, {}).subscribe({
            next: (res: any) => {
                this.messageService.add({ severity: 'info', summary: this.translocoService.translate('export.processingStarted'), detail: this.translocoService.translate('export.audioGeneratingBackground') });
                this.pollStatus();
            },
            error: (err) => {
                this.processing = false;
                this.status = this.translocoService.translate('export.status.errorStarting');
                this.messageService.add({ severity: 'error', summary: this.translocoService.translate('errors.unexpected'), detail: err.error?.error || this.translocoService.translate('export.startError') });
            }
        });
    }

    checkStatus() {
        this.http.get(`${this.apiUrl}/chapters/${this.chapterId()}/audio/status`).subscribe({
            next: (res: any) => {
                this.status = this.getStatusTranslation(res.status);
                if (res.status === 'completed') {
                    this.processing = false;
                    // Assuming result contains the URL or we fetch chapter again
                    this.onProcessComplete.emit(res.result);
                    this.messageService.add({ severity: 'success', summary: this.translocoService.translate('export.status.completed'), detail: this.translocoService.translate('export.audioGeneratedSuccess') });
                } else if (res.status === 'failed') {
                    this.processing = false;
                    this.messageService.add({ severity: 'error', summary: this.translocoService.translate('export.status.failed'), detail: res.failedReason || this.translocoService.translate('export.processingError') });
                }
            },
            error: (err) => console.error(err)
        });
    }

    getStatusTranslation(status: string): string {
        const statusMap: { [key: string]: string } = {
            'idle': this.translocoService.translate('export.status.idle'),
            'processing': this.translocoService.translate('export.status.processing'),
            'completed': this.translocoService.translate('export.status.completed'),
            'failed': this.translocoService.translate('export.status.failed')
        };
        return statusMap[status] || status;
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
