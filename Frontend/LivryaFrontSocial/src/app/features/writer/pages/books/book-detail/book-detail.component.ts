import { Component, OnInit, OnDestroy, inject, viewChild } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { ChapterListComponent } from '../../chapters/chapter-list/chapter-list.component';

import { ChapterFormComponent } from '../../chapters/chapter-form/chapter-form.component';
import { Book, BookStats, SeoService, StructuredDataService } from 'src/app/core';
import { BookService } from 'src/app/core/services/book.service';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

@Component({
    selector: 'app-book-detail',
    standalone: true,
    imports: [
    CardModule,
    ButtonModule,
    TagModule,
    Toast,
    ChapterListComponent,
    TranslocoModule
],
    providers: [MessageService, DialogService],
    templateUrl: './book-detail.component.html',
    styleUrls: ['./book-detail.component.css']
})
export class BookDetailComponent implements OnInit, OnDestroy {
    private bookService = inject(BookService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private analytics = inject(AnalyticsService);
    private dialogService = inject(DialogService);

    private seoService = inject(SeoService);
    private structuredDataService = inject(StructuredDataService);
    private translocoService = inject(TranslocoService);

    book?: Book;
    stats?: BookStats;
    loading = false;
    bookId?: string;
    activeTab: string | number = '0';
    private pageViewTime: number = 0;
    private pageViewInterval: any;
    ref: DynamicDialogRef<ChapterFormComponent> | null | undefined;

    readonly chapterListComponent = viewChild(ChapterListComponent);

    ngOnInit() {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.bookId = params['id'];
                this.loadBook();
                this.loadStats();
            }
        });

        // Track time on page
        this.pageViewInterval = setInterval(() => {
            this.pageViewTime += 1;
        }, 1000);
    }

    ngOnDestroy() {
        // Track total time spent on page
        if (this.book && this.pageViewTime > 0) {
            this.analytics.trackTimeOnPage(
                `Book Details: ${this.book.title}`,
                this.pageViewTime
            );
        }

        // Clear interval
        if (this.pageViewInterval) {
            clearInterval(this.pageViewInterval);
        }

        // Clean up SEO schemas
        this.structuredDataService.removeJsonLd('book-schema');
        this.structuredDataService.removeJsonLd('breadcrumb-schema');
        this.seoService.resetToDefaults();
    }

    loadBook() {
        if (!this.bookId) return;

        this.loading = true;
        this.bookService.getById(this.bookId).subscribe({
            next: (book: Book) => {
                this.book = book;
                this.loading = false;

                // Configure SEO for book page
                this.seoService.setBookPage({
                    title: book.title,
                    description: book.description || `Leia "${book.title}" na LIVRIA. Descubra esta história incrível.`,
                    cover: book.coverUrl,
                    author: book.author || 'Autor'
                });

                // Configure structured data for book
                this.structuredDataService.setBookSchema({
                    name: book.title,
                    description: book.description || '',
                    author: book.author || 'Autor',
                    datePublished: book.createdAt ? new Date(book.createdAt).toISOString() : new Date().toISOString(),
                    image: book.coverUrl,
                    genre: [],
                    inLanguage: 'pt-BR'
                });

                this.structuredDataService.setBreadcrumbSchema([
                    { name: 'Home', url: 'https://livrya.com.br/' },
                    { name: 'Livros', url: 'https://livrya.com.br/writer/books' },
                    { name: book.title, url: `https://livrya.com.br/writer/books/${book.id}` }
                ]);

                // Track book view
                this.analytics.trackBookView(book.id, book.title);
                this.analytics.trackPageView(
                    `Book Details: ${book.title}`,
                    `/writer/books/${book.id}`
                );
            },
            error: (error) => {
                console.error('Error loading book:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: this.translocoService.translate('errors.unexpected'),
                    detail: this.translocoService.translate('books.loadError')
                });
                this.loading = false;

                // Track error
                this.analytics.trackError(
                    'book_load_error',
                    error.message || 'Failed to load book',
                    'book-detail'
                );

                this.router.navigate(['/writer/books']);
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
        if (this.bookId && this.book) {
            // Track edit action
            this.analytics.trackNavigation(
                'book-detail',
                'book-edit',
                'edit_button_click'
            );

            this.router.navigate(['/writer/books', this.bookId, 'edit']);
        }
    }

    backToList() {
        // Track navigation
        this.analytics.trackNavigation(
            'book-detail',
            'book-list',
            'back_button_click'
        );

        this.router.navigate(['/writer/books']);
    }

    onTabChange(value: string | number | undefined) {
        if (value !== undefined) {
            this.activeTab = value;

            // Track tab switch
            const tabName = value === '0' ? 'chapters' : 'characters';
            this.analytics.trackTabSwitch(tabName, 'book-detail');
        }
    }

    viewCharacters() {
        // Track quick action
        this.analytics.trackQuickAction('view_characters', this.bookId);
        this.analytics.trackCharactersView(this.bookId || '');

        // Switch to Characters tab (which will be value '1')
        this.activeTab = '1';
        // Optionally scroll to the tabs
        const tabsElement = document.querySelector('p-tabs');
        if (tabsElement) {
            tabsElement.scrollIntoView({ behavior: 'smooth' });
        }
    }

    newChapter() {
        if (this.bookId) {
            // Track quick action
            this.analytics.trackQuickAction('new_chapter', this.bookId);
            this.analytics.trackNavigation(
                'book-detail',
                'chapter-create',
                'new_chapter_button_click'
            );

            this.router.navigate(['/writer/books', this.bookId, 'chapters', 'new']);
            this.ref = this.dialogService.open(ChapterFormComponent, {
                header: this.translocoService.translate('chapters.newChapter'),
                width: '50%',
                contentStyle: { overflow: 'auto' },
                baseZIndex: 10000,
                data: { bookId: this.bookId }
            });

            if (this.ref) {
                this.ref.onClose.subscribe((result) => {
                    if (result) {
                        this.loadStats();
                        // Reload chapter list in child component
                        const chapterListComponent = this.chapterListComponent();
                        if (chapterListComponent) {
                            chapterListComponent.loadChapters();
                        }
                        this.messageService.add({
                            severity: 'success',
                            summary: this.translocoService.translate('common.actions.confirm'),
                            detail: this.translocoService.translate('chapters.messages.createSuccess')
                        });
                    }
                });
            }
        }
    }
}
