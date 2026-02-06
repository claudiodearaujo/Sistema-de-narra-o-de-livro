import { Component, OnInit, inject } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TranslocoModule } from '@jsverse/transloco';
import { ChapterService } from 'src/app/core/services/chapter.service';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

@Component({
    selector: 'app-chapter-form',
    standalone: true,
    imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    TranslocoModule
],
    templateUrl: './chapter-form.component.html',
    styleUrls: ['./chapter-form.component.css']
})
export class ChapterFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private chapterService = inject(ChapterService);
    private analytics = inject(AnalyticsService);
    ref = inject(DynamicDialogRef);
    config = inject(DynamicDialogConfig);

    chapterForm: FormGroup;
    bookId?: string;
    chapterId?: string;
    isEditMode = false;
    submitting = false;

    constructor() {
        this.chapterForm = this.fb.group({
            title: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        this.bookId = this.config.data?.bookId;
        this.chapterId = this.config.data?.chapterId;

        if (this.chapterId) {
            this.isEditMode = true;
            this.loadChapter();
        }
    }

    loadChapter() {
        if (!this.chapterId) return;

        this.chapterService.getById(this.chapterId).subscribe({
            next: (chapter) => {
                this.chapterForm.patchValue({
                    title: chapter.title
                });
            },
            error: (error) => {
                console.error('Error loading chapter:', error);
            }
        });
    }

    onSubmit() {
        if (this.chapterForm.invalid) {
            this.markFormGroupTouched(this.chapterForm);
            return;
        }

        this.submitting = true;
        const formValue = this.chapterForm.value;

        if (this.isEditMode && this.chapterId) {
            this.chapterService.update(this.chapterId, formValue).subscribe({
                next: (chapter) => {
                    this.analytics.trackChapterEdit(this.bookId || '', chapter.id, chapter.title);
                    this.ref.close(chapter);
                },
                error: (error) => {
                    console.error('Error updating chapter:', error);
                    this.analytics.trackError('chapter_edit_error', error.message || 'Failed to update chapter', 'chapter-form');
                    this.submitting = false;
                }
            });
        } else if (this.bookId) {
            this.chapterService.create(this.bookId, formValue).subscribe({
                next: (chapter) => {
                    this.analytics.trackChapterCreate(this.bookId!, chapter.id, chapter.title);
                    this.ref.close(chapter);
                },
                error: (error) => {
                    console.error('Error creating chapter:', error);
                    this.analytics.trackError('chapter_create_error', error.message || 'Failed to create chapter', 'chapter-form');
                    this.submitting = false;
                }
            });
        }
    }

    cancel() {
        this.ref.close();
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    get title() { return this.chapterForm.get('title'); }
}
