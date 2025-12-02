import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-audio-player',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="audio-player p-4 border rounded-lg bg-gray-50 dark:bg-gray-800" *ngIf="audioUrl">
            <div class="flex flex-col gap-2">
                <h4 class="font-semibold text-sm text-gray-600 dark:text-gray-300">Áudio Final</h4>
                <audio controls class="w-full" [src]="audioUrl"></audio>
                <div class="flex justify-end mt-2">
                    <a [href]="audioUrl" target="_blank" class="text-sm text-blue-600 hover:underline">Download / Abrir</a>
                </div>
            </div>
        </div>
    `,
    styles: [`
        audio {
            height: 40px;
        }
    `]
})
export class AudioPlayerComponent {
    @Input() audioUrl?: string | null;
}
