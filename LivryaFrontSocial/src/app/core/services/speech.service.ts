import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Speech } from '../models/speech.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SpeechService {
    private http = inject(HttpClient);

    private apiUrl = `${environment.apiUrl}`;

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

    spellCheck(payload: SpellCheckRequest): Observable<SpellCheckResponse> {
        return this.http.post<SpellCheckResponse>(`${this.apiUrl}/speeches/tools/spell-check`, payload);
    }

    suggestImprovements(payload: SuggestionRequest): Observable<SuggestionResponse> {
        return this.http.post<SuggestionResponse>(`${this.apiUrl}/speeches/tools/suggestions`, payload);
    }

    enrichWithCharacter(payload: CharacterEnrichmentRequest): Observable<CharacterEnrichmentResponse> {
        return this.http.post<CharacterEnrichmentResponse>(`${this.apiUrl}/speeches/tools/character-context`, payload);
    }

    generateEmotionImage(payload: EmotionImageRequest): Observable<EmotionImageResponse> {
        return this.http.post<EmotionImageResponse>(`${this.apiUrl}/speeches/tools/emotion-image`, payload);
    }
}

export interface SpellCheckRequest {
    text: string;
    language?: string;
}

export interface SpellCheckResponse {
    correctedText: string;
    notes: string[];
    confidence: number;
}

export interface SuggestionRequest {
    text: string;
    characterId?: string;
    chapterId?: string;
    includeContext?: boolean;
}

export interface SuggestionResponse {
    improvedText: string;
    suggestions: string[];
    summary: string;
}

export interface CharacterEnrichmentRequest {
    text?: string;
    characterId: string;
}

export interface CharacterEnrichmentResponse {
    enrichedText: string;
    highlights: string[];
}

export interface EmotionImageRequest {
    text: string;
    characterId?: string;
    styleHint?: string;
}

export interface EmotionImageResponse {
    imageBase64: string;
    mimeType: string;
    prompt: string;
    caption: string;
    sentiment: string;
}
