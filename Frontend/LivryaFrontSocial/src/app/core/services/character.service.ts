import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Character } from '../models/character.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CharacterService {
    private http = inject(HttpClient);

    private apiUrl = `${environment.apiUrl}`;

    getByBookId(bookId: string): Observable<Character[]> {
        return this.http.get<Character[]>(`${this.apiUrl}/books/${bookId}/characters`);
    }

    getAll(): Observable<Character[]> {
        return this.http.get<Character[]>(`${this.apiUrl}/characters`);
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

    /**
     * Busca o áudio de preview existente de um personagem
     */
    getPreviewAudio(characterId: string): Observable<PreviewAudioResponse> {
        return this.http.get<PreviewAudioResponse>(`${this.apiUrl}/characters/${characterId}/preview-audio`);
    }

    /**
     * Gera e persiste o áudio de preview de um personagem
     * Se já existir, retorna o existente (a menos que forceRegenerate seja true)
     */
    generatePreviewAudio(characterId: string, forceRegenerate: boolean = false): Observable<PreviewAudioResponse> {
        return this.http.post<PreviewAudioResponse>(
            `${this.apiUrl}/characters/${characterId}/preview-audio`,
            { forceRegenerate }
        );
    }
}

export interface PreviewAudioResponse {
    audioBase64: string;
    format: string;
    voiceId: string;
    audioUrl?: string;
    cached?: boolean;
    hasAudio?: boolean;
}
