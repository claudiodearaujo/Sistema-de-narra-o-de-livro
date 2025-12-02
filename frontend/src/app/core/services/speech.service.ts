import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Speech } from '../models/speech.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SpeechService {
    private apiUrl = `${environment.apiUrl}`;

    constructor(private http: HttpClient) { }

    getByChapterId(chapterId: string): Observable<Speech[]> {
        return this.http.get<Speech[]>(`${this.apiUrl}/chapters/${chapterId}/speeches`);
    }

    getById(id: string): Observable<Speech> {
        return this.http.get<Speech>(`${this.apiUrl}/speeches/${id}`);
    }

    create(chapterId: string, speech: Omit<Speech, 'id' | 'chapterId' | 'orderIndex'>): Observable<Speech> {
        return this.http.post<Speech>(`${this.apiUrl}/chapters/${chapterId}/speeches`, speech);
    }

    update(id: string, speech: Partial<Speech>): Observable<Speech> {
        return this.http.put<Speech>(`${this.apiUrl}/speeches/${id}`, speech);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/speeches/${id}`);
    }

    reorder(chapterId: string, orderedIds: string[]): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/chapters/${chapterId}/speeches/reorder`, { orderedIds });
    }

    bulkCreate(chapterId: string, text: string, strategy: string, defaultCharacterId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/chapters/${chapterId}/speeches/bulk`, { text, strategy, defaultCharacterId });
    }
}
