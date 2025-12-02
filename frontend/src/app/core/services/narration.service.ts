import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NarrationService {
    private apiUrl = 'http://localhost:3000/api'; // Configure properly

    constructor(private http: HttpClient) { }

    startNarration(chapterId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/chapters/${chapterId}/narration/start`, {});
    }

    getNarrationStatus(chapterId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/chapters/${chapterId}/narration/status`);
    }

    cancelNarration(chapterId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/chapters/${chapterId}/narration/cancel`, {});
    }
}
