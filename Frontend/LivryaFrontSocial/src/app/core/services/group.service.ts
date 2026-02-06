import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Group,
  GroupMember,
  GroupsResponse,
  MembersResponse,
  CreateGroupDto,
  UpdateGroupDto,
  GroupRole
} from '../models/group.model';

/**
 * GroupService
 * 
 * Service for managing literary groups.
 * Handles CRUD operations, membership, and member management.
 */
@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/groups`;

  /**
   * Discover public groups
   */
  discoverGroups(page: number = 1, limit: number = 20, search?: string): Observable<GroupsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<GroupsResponse>(this.apiUrl, { params }).pipe(
      catchError(error => {
        console.error('[GroupService] Error discovering groups:', error);
        throw error;
      })
    );
  }

  /**
   * Get my groups (groups I'm a member of)
   */
  getMyGroups(page: number = 1, limit: number = 20): Observable<GroupsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<GroupsResponse>(`${this.apiUrl}/my`, { params }).pipe(
      catchError(error => {
        console.error('[GroupService] Error fetching my groups:', error);
        throw error;
      })
    );
  }

  /**
   * Get group by ID
   */
  getGroupById(id: string): Observable<Group> {
    return this.http.get<Group>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('[GroupService] Error fetching group:', error);
        throw error;
      })
    );
  }

  /**
   * Create a new group
   */
  createGroup(data: CreateGroupDto): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, data).pipe(
      catchError(error => {
        console.error('[GroupService] Error creating group:', error);
        throw error;
      })
    );
  }

  /**
   * Update a group
   */
  updateGroup(id: string, data: UpdateGroupDto): Observable<Group> {
    return this.http.put<Group>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(error => {
        console.error('[GroupService] Error updating group:', error);
        throw error;
      })
    );
  }

  /**
   * Delete a group
   */
  deleteGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('[GroupService] Error deleting group:', error);
        throw error;
      })
    );
  }

  /**
   * Join a group
   */
  joinGroup(id: string): Observable<GroupMember> {
    return this.http.post<GroupMember>(`${this.apiUrl}/${id}/join`, {}).pipe(
      catchError(error => {
        console.error('[GroupService] Error joining group:', error);
        throw error;
      })
    );
  }

  /**
   * Leave a group
   */
  leaveGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/leave`).pipe(
      catchError(error => {
        console.error('[GroupService] Error leaving group:', error);
        throw error;
      })
    );
  }

  /**
   * Get group members
   */
  getMembers(groupId: string, page: number = 1, limit: number = 20): Observable<MembersResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<MembersResponse>(`${this.apiUrl}/${groupId}/members`, { params }).pipe(
      catchError(error => {
        console.error('[GroupService] Error fetching members:', error);
        throw error;
      })
    );
  }

  /**
   * Update member role
   */
  updateMemberRole(groupId: string, userId: string, role: GroupRole): Observable<GroupMember> {
    return this.http.put<GroupMember>(
      `${this.apiUrl}/${groupId}/members/${userId}/role`,
      { role }
    ).pipe(
      catchError(error => {
        console.error('[GroupService] Error updating member role:', error);
        throw error;
      })
    );
  }

  /**
   * Remove a member from group
   */
  removeMember(groupId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${groupId}/members/${userId}`).pipe(
      catchError(error => {
        console.error('[GroupService] Error removing member:', error);
        throw error;
      })
    );
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: GroupRole): string {
    const roleNames: Record<GroupRole, string> = {
      OWNER: 'Dono',
      ADMIN: 'Administrador',
      MODERATOR: 'Moderador',
      MEMBER: 'Membro'
    };
    return roleNames[role] || role;
  }

  /**
   * Check if user can manage group
   */
  canManageGroup(role?: GroupRole): boolean {
    return role === 'OWNER' || role === 'ADMIN';
  }

  /**
   * Check if user can moderate group
   */
  canModerateGroup(role?: GroupRole): boolean {
    return role === 'OWNER' || role === 'ADMIN' || role === 'MODERATOR';
  }
}
