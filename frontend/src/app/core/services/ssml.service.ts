import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SsmlService {
    private apiUrl = `${environment.apiUrl}/ssml`;

    constructor(private http: HttpClient) { }

    validate(ssmlText: string): Observable<{ valid: boolean; errors: string[] }> {
        return this.http.post<{ valid: boolean; errors: string[] }>(`${this.apiUrl}/validate`, { ssmlText });
    }
}
