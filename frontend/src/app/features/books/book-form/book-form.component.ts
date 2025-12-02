import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { EditorModule } from 'primeng/editor';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BookService } from '../../../services/book.service';
import { Book } from '../../../models/book.model';

@Component({
    selector: 'app-book-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputTextModule,
        ButtonModule,
        EditorModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './book-form.component.html',
    styleUrls: ['./book-form.component.css']
})
export class BookFormComponent implements OnInit {
    bookForm: FormGroup;
    isEditMode = false;
    bookId?: string;
    loading = false;
    submitting = false;

    constructor(
        private fb: FormBuilder,
        private bookService: BookService,
        private route: ActivatedRoute,
        private router: Router,
        private messageService: MessageService
    ) {
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
                    summary: 'Erro',
                    detail: 'Falha ao carregar livro'
                });
                this.loading = false;
                this.router.navigate(['/books']);
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
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: `Livro ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso`
                });
                setTimeout(() => {
                    this.router.navigate(['/books']);
                }, 1000);
            },
            error: (error) => {
                console.error('Error saving book:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: `Falha ao ${this.isEditMode ? 'atualizar' : 'criar'} livro`
                });
                this.submitting = false;
            }
        });
    }

    cancel() {
        this.router.navigate(['/books']);
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
