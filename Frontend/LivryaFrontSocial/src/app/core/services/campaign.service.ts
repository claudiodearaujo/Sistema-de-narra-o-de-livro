import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Campaign,
  CampaignProgress,
  CampaignsResponse,
  CampaignProgressResponse,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignStatus
} from '../models/group.model';

/**
 * CampaignService
 * 
 * Service for managing reading campaigns within groups.
 * Handles campaign CRUD, progress tracking, and leaderboards.
 */
@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private readonly http = inject(HttpClient);
  private readonly groupsApiUrl = `${environment.apiUrl}/groups`;
  private readonly campaignsApiUrl = `${environment.apiUrl}/campaigns`;

  /**
   * Get campaigns by group
   */
  getCampaignsByGroup(
    groupId: string,
    page: number = 1,
    limit: number = 20,
    status?: CampaignStatus
  ): Observable<CampaignsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<CampaignsResponse>(
      `${this.groupsApiUrl}/${groupId}/campaigns`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('[CampaignService] Error fetching group campaigns:', error);
        throw error;
      })
    );
  }

  /**
   * Get my campaigns (campaigns I'm participating in)
   */
  getMyCampaigns(
    page: number = 1,
    limit: number = 20,
    showCompleted: boolean = false
  ): Observable<CampaignProgressResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('showCompleted', showCompleted.toString());

    return this.http.get<CampaignProgressResponse>(
      `${this.campaignsApiUrl}/my`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('[CampaignService] Error fetching my campaigns:', error);
        throw error;
      })
    );
  }

  /**
   * Get campaign by ID
   */
  getCampaignById(id: string): Observable<Campaign> {
    return this.http.get<Campaign>(`${this.campaignsApiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('[CampaignService] Error fetching campaign:', error);
        throw error;
      })
    );
  }

  /**
   * Create a new campaign
   */
  createCampaign(groupId: string, data: CreateCampaignDto): Observable<Campaign> {
    return this.http.post<Campaign>(
      `${this.groupsApiUrl}/${groupId}/campaigns`,
      data
    ).pipe(
      catchError(error => {
        console.error('[CampaignService] Error creating campaign:', error);
        throw error;
      })
    );
  }

  /**
   * Update a campaign
   */
  updateCampaign(id: string, data: UpdateCampaignDto): Observable<Campaign> {
    return this.http.put<Campaign>(`${this.campaignsApiUrl}/${id}`, data).pipe(
      catchError(error => {
        console.error('[CampaignService] Error updating campaign:', error);
        throw error;
      })
    );
  }

  /**
   * Delete a campaign
   */
  deleteCampaign(id: string): Observable<void> {
    return this.http.delete<void>(`${this.campaignsApiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('[CampaignService] Error deleting campaign:', error);
        throw error;
      })
    );
  }

  /**
   * Join a campaign
   */
  joinCampaign(id: string): Observable<CampaignProgress> {
    return this.http.post<CampaignProgress>(
      `${this.campaignsApiUrl}/${id}/join`,
      {}
    ).pipe(
      catchError(error => {
        console.error('[CampaignService] Error joining campaign:', error);
        throw error;
      })
    );
  }

  /**
   * Get my progress in a campaign
   */
  getProgress(campaignId: string): Observable<CampaignProgress> {
    return this.http.get<CampaignProgress>(
      `${this.campaignsApiUrl}/${campaignId}/progress`
    ).pipe(
      catchError(error => {
        console.error('[CampaignService] Error fetching progress:', error);
        throw error;
      })
    );
  }

  /**
   * Get campaign leaderboard
   */
  getLeaderboard(campaignId: string, limit: number = 10): Observable<CampaignProgress[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<CampaignProgress[]>(
      `${this.campaignsApiUrl}/${campaignId}/leaderboard`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('[CampaignService] Error fetching leaderboard:', error);
        throw error;
      })
    );
  }

  /**
   * Mark a book as completed in a campaign
   */
  completeBook(campaignId: string, bookId: string): Observable<CampaignProgress> {
    return this.http.post<CampaignProgress>(
      `${this.campaignsApiUrl}/${campaignId}/complete-book`,
      { bookId }
    ).pipe(
      catchError(error => {
        console.error('[CampaignService] Error completing book:', error);
        throw error;
      })
    );
  }

  /**
   * Get status display name
   */
  getStatusDisplayName(status: CampaignStatus): string {
    const statusNames: Record<CampaignStatus, string> = {
      DRAFT: 'Rascunho',
      ACTIVE: 'Ativa',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada'
    };
    return statusNames[status] || status;
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: CampaignStatus): string {
    const statusClasses: Record<CampaignStatus, string> = {
      DRAFT: 'bg-secondary-100 text-secondary-700',
      ACTIVE: 'bg-primary-100 text-primary-700',
      COMPLETED: 'bg-primary-50 text-primary-600',
      CANCELLED: 'bg-accent-100 text-accent-700'
    };
    return statusClasses[status] || 'bg-secondary-100 text-secondary-700';
  }

  /**
   * Format date for display
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'Não definida';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
