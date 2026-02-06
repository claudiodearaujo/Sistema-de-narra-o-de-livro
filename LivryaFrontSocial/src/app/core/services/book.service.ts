import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book, BooksResponse, CreateBookDto, UpdateBookDto, BookStats } from '../models/book.model';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BookService {
    private http = inject(HttpClient);

    private apiUrl = `${environment.apiUrl}/books`;

    getAll(page: number = 1, limit: number = 10, title?: string, author?: string): Observable<BooksResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (title) {
            params = params.set('title', title);
        }
        if (author) {
            params = params.set('author', author);
        }

        return this.http.get<BooksResponse>(this.apiUrl, { params });
    }

    getById(id: string): Observable<Book> {
        return this.http.get<Book>(`${this.apiUrl}/${id}`);
    }

    create(book: CreateBookDto): Observable<Book> {
        return this.http.post<Book>(this.apiUrl, book);
    }

    update(id: string, book: UpdateBookDto): Observable<Book> {
        return this.http.put<Book>(`${this.apiUrl}/${id}`, book);
    }

    delete(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }

    getStats(id: string): Observable<BookStats> {
        return this.http.get<BookStats>(`${this.apiUrl}/${id}/stats`);
    }
}
