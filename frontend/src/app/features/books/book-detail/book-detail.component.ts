import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BookService } from '../../../services/book.service';
import { Book, BookStats } from '../../../models/book.model';
import { ChapterListComponent } from '../../chapters/chapter-list/chapter-list.component';

@Component({
    selector: 'app-book-detail',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        TagModule,
        ToastModule,
        ChapterListComponent
    ],
    providers: [MessageService],
    templateUrl: './book-detail.component.html',
    styleUrls: ['./book-detail.component.css']
})
export class BookDetailComponent implements OnInit {
    book?: Book;
    stats?: BookStats;
    loading = false;
    bookId?: string;

    constructor(
        private bookService: BookService,
        private route: ActivatedRoute,
        private router: Router,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.bookId = params['id'];
                this.loadBook();
                this.loadStats();
            }
        });
    }

    loadBook() {
        if (!this.bookId) return;

        this.loading = true;
        this.bookService.getById(this.bookId).subscribe({
            next: (book: Book) => {
                this.book = book;
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

    loadStats() {
        if (!this.bookId) return;

        this.bookService.getStats(this.bookId).subscribe({
            next: (stats: BookStats) => {
                this.stats = stats;
            },
            error: (error) => {
                console.error('Error loading stats:', error);
            }
        });
    }

    editBook() {
        if (this.bookId) {
            this.router.navigate(['/books', this.bookId, 'edit']);
        }
    }

    backToList() {
        this.router.navigate(['/books']);
    }
}
