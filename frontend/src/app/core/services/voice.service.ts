import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Voice } from '../models/voice.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class VoiceService {
    private apiUrl = `${environment.apiUrl}/voices`;

    constructor(private http: HttpClient) { }

    listVoices(): Observable<Voice[]> {
        return this.http.get<Voice[]>(this.apiUrl);
    }

    previewVoice(voiceId: string, text: string): Observable<{ audioBase64: string }> {
        return this.http.post<{ audioBase64: string }>(`${this.apiUrl}/preview`, { voiceId, text });
    }
}
