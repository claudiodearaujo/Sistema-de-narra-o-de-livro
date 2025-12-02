import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ChapterService } from '../../../services/chapter.service';

@Component({
    selector: 'app-chapter-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputTextModule,
        ButtonModule
    ],
    templateUrl: './chapter-form.component.html',
    styleUrls: ['./chapter-form.component.css']
})
export class ChapterFormComponent implements OnInit {
    chapterForm: FormGroup;
    bookId?: string;
    chapterId?: string;
    isEditMode = false;
    submitting = false;

    constructor(
        private fb: FormBuilder,
        private chapterService: ChapterService,
        public ref: DynamicDialogRef,
        public config: DynamicDialogConfig
    ) {
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
                    this.ref.close(chapter);
                },
                error: (error) => {
                    console.error('Error updating chapter:', error);
                    this.submitting = false;
                }
            });
        } else if (this.bookId) {
            this.chapterService.create(this.bookId, formValue).subscribe({
                next: (chapter) => {
                    this.ref.close(chapter);
                },
                error: (error) => {
                    console.error('Error creating chapter:', error);
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
