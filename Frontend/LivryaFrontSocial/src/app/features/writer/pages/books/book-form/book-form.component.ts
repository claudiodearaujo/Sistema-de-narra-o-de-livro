import { Component, OnInit, inject } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { BookService } from 'src/app/core/services/book.service';
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { Book } from 'src/app/core';
@Component({
    selector: 'app-book-form',
    standalone: true,
    imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    TextareaModule,
    ToastModule,
    TranslocoModule
],
    providers: [MessageService],
    templateUrl: './book-form.component.html',
    styleUrls: ['./book-form.component.css']
})
export class BookFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private bookService = inject(BookService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private analytics = inject(AnalyticsService);

    private translocoService = inject(TranslocoService);
    bookForm: FormGroup;
    isEditMode = false;
    bookId?: string;
    loading = false;
    submitting = false;

    constructor() {
        this.bookForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(3)]],
            author: ['', [Validators.required]],
            description: [''],
            coverUrl: ['']
        });
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.bookId = params['id'];
                this.loadBook();
            }
        });
    }

    loadBook() {
        if (!this.bookId) return;

        this.loading = true;
        this.bookService.getById(this.bookId).subscribe({
            next: (book: Book) => {
                this.bookForm.patchValue({
                    title: book.title,
                    author: book.author,
                    description: book.description || '',
                    coverUrl: book.coverUrl || ''
                });
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading book:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: this.translocoService.translate('errors.unexpected'),
                    detail: this.translocoService.translate('books.loadError')
                });
                this.loading = false;
                this.router.navigate(['/writer/books']);
            }
        });
    }

    onSubmit() {
        if (this.bookForm.invalid) {
            this.markFormGroupTouched(this.bookForm);
            return;
        }

        this.submitting = true;
        const formValue = this.bookForm.value;

        const operation = this.isEditMode && this.bookId
            ? this.bookService.update(this.bookId, formValue)
            : this.bookService.create(formValue);

        operation.subscribe({
            next: (book: Book) => {
                const successKey = this.isEditMode ? 'books.updateSuccess' : 'books.createSuccess';

                // Track analytics
                if (this.isEditMode && this.bookId) {
                    this.analytics.trackBookEdit(this.bookId, formValue.title);
                } else {
                    this.analytics.trackBookCreate(book.id, book.title);
                }

                this.messageService.add({
                    severity: 'success',
                    summary: this.translocoService.translate('common.actions.confirm'),
                    detail: this.translocoService.translate(successKey)
                });
                setTimeout(() => {
                    this.router.navigate(['/writer/books']);
                }, 1000);
            },
            error: (error) => {
                console.error('Error saving book:', error);
                const errorKey = this.isEditMode ? 'books.updateError' : 'books.createError';
                this.analytics.trackError(
                    this.isEditMode ? 'book_edit_error' : 'book_create_error',
                    error.message || 'Failed to save book',
                    'book-form'
                );
                this.messageService.add({
                    severity: 'error',
                    summary: this.translocoService.translate('errors.unexpected'),
                    detail: this.translocoService.translate(errorKey)
                });
                this.submitting = false;
            }
        });
    }

    cancel() {
        this.router.navigate(['/writer/books']);
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    get title() { return this.bookForm.get('title'); }
    get author() { return this.bookForm.get('author'); }
}
