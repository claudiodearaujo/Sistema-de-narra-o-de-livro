import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Character } from '../models/character.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CharacterService {
    private apiUrl = `${environment.apiUrl}`;

    constructor(private http: HttpClient) { }

    getByBookId(bookId: string): Observable<Character[]> {
        return this.http.get<Character[]>(`${this.apiUrl}/books/${bookId}/characters`);
    }

    getById(id: string): Observable<Character> {
        return this.http.get<Character>(`${this.apiUrl}/characters/${id}`);
    }

    create(bookId: string, character: Omit<Character, 'id' | 'bookId'>): Observable<Character> {
        return this.http.post<Character>(`${this.apiUrl}/books/${bookId}/characters`, character);
    }

    update(id: string, character: Partial<Character>): Observable<Character> {
        return this.http.put<Character>(`${this.apiUrl}/characters/${id}`, character);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/characters/${id}`);
    }
}
