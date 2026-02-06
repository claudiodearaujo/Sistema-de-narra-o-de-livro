import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Voice, GEMINI_VOICES } from '../models/voice.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class VoiceService {
    private http = inject(HttpClient);

    private apiUrl = `${environment.apiUrl}/voices`;

    /**
     * Lista todas as vozes disponíveis do Gemini TTS
     * As vozes são fixas e definidas pela API do Google
     */
    listVoices(): Observable<Voice[]> {
        // Retorna as vozes fixas do Gemini
        // Opcionalmente, pode buscar do backend para manter sincronizado
        return this.http.get<Voice[]>(this.apiUrl);
    }

    /**
     * Retorna as vozes locais (sem necessidade de API)
     */
    getLocalVoices(): Voice[] {
        return GEMINI_VOICES;
    }

    /**
     * Busca uma voz pelo ID
     */
    getVoiceById(voiceId: string): Voice | undefined {
        return GEMINI_VOICES.find(v => v.id === voiceId);
    }

    /**
     * Filtra vozes por gênero
     */
    getVoicesByGender(gender: 'MALE' | 'FEMALE' | 'NEUTRAL'): Voice[] {
        return GEMINI_VOICES.filter(v => v.gender === gender);
    }

    /**
     * Gera preview de áudio para uma voz
     */
    previewVoice(voiceId: string, text: string): Observable<{ audioBase64: string, format: string, voiceId: string }> {
        return this.http.post<{ audioBase64: string, format: string, voiceId: string }>(`${this.apiUrl}/preview`, { voiceId, text });
    }
}
