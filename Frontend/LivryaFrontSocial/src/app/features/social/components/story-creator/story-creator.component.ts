import { Component, inject, signal, output, ElementRef, computed, viewChild } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { SelectButton } from 'primeng/selectbutton';
import { Message } from 'primeng/message';
import { InputText } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { StoryService, CreateStoryDto, StoryType, Story } from '../../../../core';

@Component({
  selector: 'app-story-creator',
  standalone: true,
  imports: [
    FormsModule,
    Dialog,
    Button,
    Textarea,
    SelectButton,
    Message,
    InputText,
    ProgressBarModule,
    TranslocoModule
],
  templateUrl: './story-creator.component.html',
  styleUrl: './story-creator.component.css',
})
export class StoryCreatorComponent {
  private readonly storyService = inject(StoryService);
  private readonly translocoService = inject(TranslocoService);

  readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  // State
  visible = false;
  selectedType: StoryType = 'TEXT';
  content = '';
  imageUrl = '';
  imagePreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  uploadProgress = signal(0);
  creating = signal(false);
  error = signal<string | null>(null);

  // Events
  created = output<Story>();

  storyTypes = computed(() => [
    { label: this.translocoService.translate('social.stories.types.text'), value: 'TEXT' as StoryType },
    { label: this.translocoService.translate('social.stories.types.quote'), value: 'QUOTE' as StoryType },
    { label: this.translocoService.translate('social.stories.types.image'), value: 'IMAGE' as StoryType },
  ]);

  open(): void {
    this.visible = true;
    this.reset();
  }

  onClose(): void {
    if (!this.creating()) {
      this.visible = false;
      this.reset();
    }
  }

  isValid(): boolean {
    if (this.creating()) return false;

    switch (this.selectedType) {
      case 'TEXT':
      case 'QUOTE':
        return this.content.trim().length > 0;
      case 'IMAGE':
        return this.imageUrl.trim().length > 0 || this.selectedFile() !== null;
      default:
        return false;
    }
  }

  /**
   * Trigger file input click
   */
  triggerFileInput(): void {
    this.fileInput()?.nativeElement?.click();
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.error.set(this.translocoService.translate('social.stories.errors.invalidImage'));
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.error.set(this.translocoService.translate('social.stories.errors.imageTooLarge'));
      return;
    }

    this.selectedFile.set(file);
    this.error.set(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove selected image
   */
  removeImage(): void {
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.imageUrl = '';
    const fileInput = this.fileInput();
    if (fileInput?.nativeElement) {
      fileInput.nativeElement.value = '';
    }
  }

  createStory(): void {
    if (!this.isValid()) return;

    this.creating.set(true);
    this.error.set(null);

    // If we have a file, upload it first (using base64 for now)
    const file = this.selectedFile();
    if (this.selectedType === 'IMAGE' && file) {
      this.uploadProgress.set(20);
      // Convert to base64 for now (ideally would use a proper upload endpoint)
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadProgress.set(60);
        const base64 = e.target?.result as string;
        this.submitStory(base64);
      };
      reader.onerror = () => {
        this.creating.set(false);
        this.uploadProgress.set(0);
        this.error.set(this.translocoService.translate('social.stories.errors.processError'));
      };
      reader.readAsDataURL(file);
    } else {
      this.submitStory(this.imageUrl.trim() || undefined);
    }
  }

  private submitStory(mediaUrl?: string): void {
    this.uploadProgress.set(80);

    const dto: CreateStoryDto = {
      type: this.selectedType,
      content: this.content.trim() || undefined,
      mediaUrl: this.selectedType === 'IMAGE' ? mediaUrl : undefined,
    };

    this.storyService.createStory(dto).subscribe({
      next: (story) => {
        this.uploadProgress.set(100);
        this.creating.set(false);
        this.created.emit(story);
        this.visible = false;
        this.reset();
      },
      error: (err) => {
        this.creating.set(false);
        this.uploadProgress.set(0);
        this.error.set(err.error?.error || this.translocoService.translate('social.stories.errors.createError'));
        console.error('[StoryCreator] Error:', err);
      },
    });
  }

  private reset(): void {
    this.selectedType = 'TEXT';
    this.content = '';
    this.imageUrl = '';
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.uploadProgress.set(0);
    this.error.set(null);
    const fileInput = this.fileInput();
    if (fileInput?.nativeElement) {
      fileInput.nativeElement.value = '';
    }
  }
}
