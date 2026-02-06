import { Component, signal, ElementRef, input, viewChild } from '@angular/core';

import { RouterLink } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SliderModule } from 'primeng/slider';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule } from '@angular/forms';

// Core
import { PostBook, PostChapter } from '../../../core/models/post.model';

/**
 * Audio Preview Player Component - Sprint 7
 * 
 * Displays an audio preview with waveform-style player.
 */
@Component({
  selector: 'app-audio-preview-player',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    TagModule,
    SliderModule,
    ProgressBarModule,
    FormsModule
],
  templateUrl: './audio-preview-player.component.html',
  styleUrl: './audio-preview-player.component.css'
})
export class AudioPreviewPlayerComponent {
  readonly book = input<PostBook>();
  readonly chapter = input<PostChapter>();
  readonly audioUrl = input<string>('');
  
  readonly audioPlayer = viewChild.required<ElementRef<HTMLAudioElement>>('audioPlayer');

  isPlaying = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  progress = 0;
  currentBarIndex = signal(0);

  // Generate random waveform bars for visual effect
  waveformBars = Array.from({ length: 40 }, () => Math.floor(Math.random() * 60) + 20);

  togglePlay(): void {
    const audio = this.audioPlayer()?.nativeElement;
    if (!audio) return;

    if (this.isPlaying()) {
      audio.pause();
      this.isPlaying.set(false);
    } else {
      audio.play();
      this.isPlaying.set(true);
    }
  }

  onTimeUpdate(): void {
    const audio = this.audioPlayer()?.nativeElement;
    if (!audio) return;

    this.currentTime.set(audio.currentTime);
    this.progress = (audio.currentTime / audio.duration) * 100;
    this.currentBarIndex.set(Math.floor((audio.currentTime / audio.duration) * this.waveformBars.length));
  }

  onMetadataLoaded(): void {
    const audio = this.audioPlayer()?.nativeElement;
    if (!audio) return;
    this.duration.set(audio.duration);
  }

  onEnded(): void {
    this.isPlaying.set(false);
    this.progress = 0;
    this.currentBarIndex.set(0);
  }

  onSeek(event: any): void {
    const audio = this.audioPlayer()?.nativeElement;
    if (!audio || !audio.duration) return;

    const seekTime = (event.value / 100) * audio.duration;
    audio.currentTime = seekTime;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
