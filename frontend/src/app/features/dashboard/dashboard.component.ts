import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { BookService } from '../../services/book.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, ChartModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    stats = {
        totalBooks: 0,
        totalChapters: 0,
        completedNarrations: 0,
        inProgressNarrations: 0
    };

    recentBooks: any[] = [];
    chartData: any;
    chartOptions: any;

    constructor(
        private bookService: BookService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadStats();
        this.loadRecentBooks();
    }

    loadStats() {
        this.bookService.getAll(1, 100).subscribe({
            next: (response: any) => {
                const books = response.books || [];
                this.stats.totalBooks = books.length;

                // Count chapters and narrations
                books.forEach((book: any) => {
                    if (book.chapters) {
                        this.stats.totalChapters += book.chapters.length;
                        book.chapters.forEach((chapter: any) => {
                            if (chapter.status === 'completed') {
                                this.stats.completedNarrations++;
                            } else if (chapter.status === 'in_progress') {
                                this.stats.inProgressNarrations++;
                            }
                        });
                    }
                });

                // Setup chart after loading stats
                this.setupChart();
            },
            error: (err: any) => console.error('Error loading stats:', err)
        });
    }

    loadRecentBooks() {
        this.bookService.getAll(1, 5).subscribe({
            next: (response: any) => {
                this.recentBooks = response.books || [];
            },
            error: (err: any) => console.error('Error loading recent books:', err)
        });
    }

    setupChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        this.chartData = {
            labels: ['Concluídos', 'Em Progresso', 'Rascunho'],
            datasets: [
                {
                    data: [this.stats.completedNarrations, this.stats.inProgressNarrations,
                    this.stats.totalChapters - this.stats.completedNarrations - this.stats.inProgressNarrations],
                    backgroundColor: [
                        'rgba(39, 174, 96, 0.7)',
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(149, 165, 166, 0.7)'
                    ],
                    borderColor: [
                        'rgb(39, 174, 96)',
                        'rgb(52, 152, 219)',
                        'rgb(149, 165, 166)'
                    ],
                    borderWidth: 1
                }
            ]
        };

        this.chartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            }
        };
    }

    navigateToBooks() {
        this.router.navigate(['/books']);
    }

    navigateToBook(bookId: string) {
        this.router.navigate(['/books', bookId]);
    }
}
