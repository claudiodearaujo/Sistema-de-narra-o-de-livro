import { Component, input } from '@angular/core';


@Component({
    selector: 'app-audio-player',
    standalone: true,
    imports: [],
    templateUrl: './audio-player.component.html',
    styleUrl: './audio-player.component.css'
})
export class AudioPlayerComponent {
    readonly audioUrl = input<string | null>();
}
