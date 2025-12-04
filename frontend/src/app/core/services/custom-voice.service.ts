import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CustomVoice {
    id?: string;
    name: string;
    gender: string;
    languageCode: string;
    description?: string;
    voiceId: string;
    provider?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CustomVoiceService {
    private apiUrl = `${environment.apiUrl}/custom-voices`;

    constructor(private http: HttpClient) { }

    list(): Observable<CustomVoice[]> {
        return this.http.get<CustomVoice[]>(this.apiUrl);
    }

    create(voice: CustomVoice): Observable<CustomVoice> {
        return this.http.post<CustomVoice>(this.apiUrl, voice);
    }

    getById(id: string): Observable<CustomVoice> {
        return this.http.get<CustomVoice>(`${this.apiUrl}/${id}`);
    }

    update(id: string, voice: Partial<CustomVoice>): Observable<CustomVoice> {
        return this.http.put<CustomVoice>(`${this.apiUrl}/${id}`, voice);
    }

    delete(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    hardDelete(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}/hard`);
    }
}
