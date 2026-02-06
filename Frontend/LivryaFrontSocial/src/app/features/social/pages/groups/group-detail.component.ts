import { Component, OnInit, inject, signal } from '@angular/core';

import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { GroupService } from '../../../../core/services/group.service';
import { CampaignService } from '../../../../core/services/campaign.service';
import { Group, GroupMember, Campaign, GroupRole } from '../../../../core/models/group.model';
import { CampaignCreateModalComponent } from '../campaigns/campaign-create-modal.component';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [RouterModule, TranslocoModule, CampaignCreateModalComponent],
  templateUrl: './group-detail.component.html',
  styleUrl: './group-detail.component.css',
})
export class GroupDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly groupService = inject(GroupService);
  private readonly campaignService = inject(CampaignService);
  private readonly translocoService = inject(TranslocoService);

  groupId = signal<string>('');
  group = signal<Group | null>(null);
  campaigns = signal<Campaign[]>([]);
  members = signal<GroupMember[]>([]);
  
  loading = signal(true);
  actionLoading = signal(false);
  membersLoading = signal(false);
  hasMoreMembers = signal(false);
  
  activeTab = signal<'campaigns' | 'members'>('campaigns');
  showSettings = signal(false);
  showCreateCampaign = signal(false);
  openMemberMenu = signal<string | null>(null);
  
  currentUserId = signal<string>('');
  membersPage = 1;

  ngOnInit() {
    // Get current user ID from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserId.set(JSON.parse(user).id);
    }

    this.route.params.subscribe(params => {
      this.groupId.set(params['id']);
      this.loadGroup();
    });
  }

  loadGroup() {
    this.loading.set(true);
    
    this.groupService.getGroupById(this.groupId()).subscribe({
      next: (group) => {
        this.group.set(group);
        this.loading.set(false);
        this.loadCampaigns();
      },
      error: (error) => {
        console.error('Error loading group:', error);
        this.loading.set(false);
      }
    });
  }

  loadCampaigns() {
    this.campaignService.getCampaignsByGroup(this.groupId()).subscribe({
      next: (response) => {
        this.campaigns.set(response.data);
      },
      error: (error) => {
        console.error('Error loading campaigns:', error);
      }
    });
  }

  loadMembers() {
    if (this.members().length > 0) return;
    
    this.membersLoading.set(true);
    this.membersPage = 1;
    
    this.groupService.getMembers(this.groupId(), 1, 20).subscribe({
      next: (response) => {
        this.members.set(response.data);
        this.hasMoreMembers.set(response.hasMore);
        this.membersLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading members:', error);
        this.membersLoading.set(false);
      }
    });
  }

  loadMoreMembers() {
    this.membersPage++;
    this.groupService.getMembers(this.groupId(), this.membersPage, 20).subscribe({
      next: (response) => {
        this.members.update(current => [...current, ...response.data]);
        this.hasMoreMembers.set(response.hasMore);
      },
      error: (error) => {
        console.error('Error loading more members:', error);
      }
    });
  }

  joinGroup() {
    this.actionLoading.set(true);
    this.groupService.joinGroup(this.groupId()).subscribe({
      next: (membership) => {
        this.group.update(g => g ? { 
          ...g, 
          isMember: true, 
          memberRole: membership.role,
          memberCount: g.memberCount + 1 
        } : g);
        this.actionLoading.set(false);
      },
      error: (error) => {
        console.error('Error joining group:', error);
        this.actionLoading.set(false);
      }
    });
  }

  leaveGroup() {
    if (!confirm(this.translocoService.translate('social.groups.detail.confirmLeave'))) return;
    
    this.actionLoading.set(true);
    this.groupService.leaveGroup(this.groupId()).subscribe({
      next: () => {
        this.group.update(g => g ? { 
          ...g, 
          isMember: false, 
          memberRole: undefined,
          memberCount: g.memberCount - 1 
        } : g);
        this.actionLoading.set(false);
      },
      error: (error) => {
        console.error('Error leaving group:', error);
        this.actionLoading.set(false);
      }
    });
  }

  updateRole(member: GroupMember, newRole: GroupRole) {
    this.openMemberMenu.set(null);
    this.groupService.updateMemberRole(this.groupId(), member.user.id, newRole).subscribe({
      next: (updated) => {
        this.members.update(members => 
          members.map(m => m.id === member.id ? { ...m, role: updated.role } : m)
        );
      },
      error: (error) => {
        console.error('Error updating role:', error);
      }
    });
  }

  removeMember(member: GroupMember) {
    if (!confirm(this.translocoService.translate('social.groups.detail.confirmRemove', { name: member.user.name }))) return;
    
    this.openMemberMenu.set(null);
    this.groupService.removeMember(this.groupId(), member.user.id).subscribe({
      next: () => {
        this.members.update(members => members.filter(m => m.id !== member.id));
        this.group.update(g => g ? { ...g, memberCount: g.memberCount - 1 } : g);
      },
      error: (error) => {
        console.error('Error removing member:', error);
      }
    });
  }

  toggleMemberMenu(memberId: string) {
    this.openMemberMenu.update(current => current === memberId ? null : memberId);
  }

  onCampaignCreated(campaign: Campaign) {
    this.showCreateCampaign.set(false);
    this.campaigns.update(campaigns => [campaign, ...campaigns]);
  }

  canManage(): boolean {
    const role = this.group()?.memberRole;
    return role === 'OWNER' || role === 'ADMIN';
  }

  canModerate(): boolean {
    const role = this.group()?.memberRole;
    return role === 'OWNER' || role === 'ADMIN' || role === 'MODERATOR';
  }

  getPrivacyLabel(privacy: string): string {
    const keys: Record<string, string> = {
      PUBLIC: 'social.groups.privacy.public',
      PRIVATE: 'social.groups.privacy.private',
      INVITE_ONLY: 'social.groups.privacy.inviteOnly'
    };
    return this.translocoService.translate(keys[privacy] || privacy);
  }

  getRoleLabel(role: GroupRole): string {
    const keys: Record<GroupRole, string> = {
      OWNER: 'social.groups.roles.owner',
      ADMIN: 'social.groups.roles.admin',
      MODERATOR: 'social.groups.roles.moderator',
      MEMBER: 'social.groups.roles.member'
    };
    return this.translocoService.translate(keys[role] || role);
  }

  getRoleBadgeClass(role: GroupRole): string {
    const classes: Record<GroupRole, string> = {
      OWNER: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      ADMIN: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300',
      MODERATOR: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      MEMBER: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300'
    };
    return classes[role] || 'bg-secondary-100 text-secondary-700';
  }

  getStatusLabel(status: string): string {
    const keys: Record<string, string> = {
      DRAFT: 'social.groups.status.draft',
      ACTIVE: 'social.groups.status.active',
      COMPLETED: 'social.groups.status.completed',
      CANCELLED: 'social.groups.status.cancelled'
    };
    return this.translocoService.translate(keys[status] || status);
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      DRAFT: 'bg-secondary-100 text-secondary-700',
      ACTIVE: 'bg-primary-100 text-primary-700',
      COMPLETED: 'bg-primary-50 text-primary-600',
      CANCELLED: 'bg-accent-100 text-accent-700'
    };
    return classes[status] || 'bg-secondary-100 text-secondary-700';
  }

  formatDate(dateString: string): string {
    const lang = this.translocoService.getActiveLang();
    return new Date(dateString).toLocaleDateString(lang, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
