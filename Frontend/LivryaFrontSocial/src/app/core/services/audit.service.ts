import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  AuditLog, 
  AuditQueryFilters, 
  AuditPaginatedResult, 
  AuditStats 
} from '../models/audit.model';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/audit`;

  /**
   * List audit logs with filters
   */
  getLogs(filters: AuditQueryFilters): Observable<AuditPaginatedResult> {
    let params = new HttpParams();
    
    // Add only defined filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params = params.append(key, v));
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.get<AuditPaginatedResult>(this.apiUrl, { params });
  }

  /**
   * Get audit log by ID
   */
  getById(id: string): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get audit statistics
   */
  getStats(): Observable<AuditStats> {
    return this.http.get<AuditStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Export audit logs
   */
  export(filters: AuditQueryFilters, format: 'csv' | 'json'): void {
    let params = new HttpParams().set('format', format);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'page' && key !== 'limit') {
        if (Array.isArray(value)) {
          value.forEach(v => params = params.append(key, v));
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    const exportUrl = `${this.apiUrl}/export?${params.toString()}`;
    window.open(exportUrl, '_blank');
  }
}
