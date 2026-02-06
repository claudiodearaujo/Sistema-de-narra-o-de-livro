import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Achievement, 
  AchievementsResponse, 
  UserAchievementsResponse,
  AchievementStats,
  AchievementCategory
} from '../models/achievement.model';

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/achievements`;

  /**
   * Get all achievements (with user progress if authenticated)
   */
  getAllAchievements(): Observable<AchievementsResponse> {
    return this.http.get<AchievementsResponse>(this.apiUrl);
  }

  /**
   * Get my achievements (authenticated user)
   */
  getMyAchievements(): Observable<UserAchievementsResponse> {
    return this.http.get<UserAchievementsResponse>(`${this.apiUrl}/me`);
  }

  /**
   * Get my achievement stats
   */
  getMyStats(): Observable<AchievementStats> {
    return this.http.get<AchievementStats>(`${this.apiUrl}/me/stats`);
  }

  /**
   * Get achievements for a specific user (public profile)
   */
  getUserAchievements(userId: string): Observable<UserAchievementsResponse> {
    return this.http.get<UserAchievementsResponse>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Get achievements by category
   */
  getByCategory(category: AchievementCategory): Observable<{ achievements: Achievement[] }> {
    return this.http.get<{ achievements: Achievement[] }>(`${this.apiUrl}/category/${category}`);
  }

  /**
   * Recheck all achievements (manual trigger)
   */
  recheckAchievements(): Observable<{ message: string; unlocked: any[] }> {
    return this.http.post<{ message: string; unlocked: any[] }>(`${this.apiUrl}/me/recheck`, {});
  }
}
