import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NarrationService {
    private http = inject(HttpClient);

    private apiUrl = 'http://localhost:3000/api';

    startNarration(chapterId: string, speechId?: string): Observable<any> {
        const payload = speechId ? { speechId } : {};
        return this.http.post(`${this.apiUrl}/chapters/${chapterId}/narration/start`, payload);
    }

    getNarrationStatus(chapterId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/chapters/${chapterId}/narration/status`);
    }

    cancelNarration(chapterId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/chapters/${chapterId}/narration/cancel`, {});
    }
}
