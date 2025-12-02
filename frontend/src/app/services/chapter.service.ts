import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chapter, CreateChapterDto, UpdateChapterDto } from '../models/chapter.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ChapterService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getByBookId(bookId: string): Observable<Chapter[]> {
        return this.http.get<Chapter[]>(`${this.apiUrl}/books/${bookId}/chapters`);
    }

    getById(id: string): Observable<Chapter> {
        return this.http.get<Chapter>(`${this.apiUrl}/chapters/${id}`);
    }

    create(bookId: string, chapter: CreateChapterDto): Observable<Chapter> {
        return this.http.post<Chapter>(`${this.apiUrl}/books/${bookId}/chapters`, chapter);
    }

    update(id: string, chapter: UpdateChapterDto): Observable<Chapter> {
        return this.http.put<Chapter>(`${this.apiUrl}/chapters/${id}`, chapter);
    }

    delete(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/chapters/${id}`);
    }

    reorder(bookId: string, orderedIds: string[]): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.apiUrl}/books/${bookId}/chapters/reorder`, { orderedIds });
    }
}
