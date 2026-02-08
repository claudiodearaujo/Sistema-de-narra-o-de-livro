import { Component, OnInit, inject, signal, computed } from '@angular/core';

import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { GroupService } from '../../../../core/services/group.service';
import { Group, GroupsResponse } from '../../../../core/models/group.model';
import { GroupCreateModalComponent } from './group-create-modal.component';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [RouterModule, FormsModule, TranslocoModule, GroupCreateModalComponent],
  templateUrl: './group-list.component.html',
  styleUrl: './group-list.component.css',
})
export class GroupListComponent implements OnInit {
  private readonly groupService = inject(GroupService);
  private readonly translocoService = inject(TranslocoService);

  groups = signal<Group[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(false);
  activeTab = signal<'discover' | 'my'>('discover');
  searchQuery = '';
  page = 1;
  joiningGroup = signal<string | null>(null);
  showCreateModal = signal(false);

  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    this.loading.set(true);
    this.page = 1;

    if (this.activeTab() === 'my') {
      this.loadMyGroups();
    } else {
      this.loadDiscoverGroups();
    }
  }

  loadDiscoverGroups() {
    this.groupService.discoverGroups(this.page, 20, this.searchQuery || undefined)
      .subscribe({
        next: (response) => {
          this.groups.set(response.data);
          this.hasMore.set(response.hasMore);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading groups:', error);
          this.loading.set(false);
        }
      });
  }

  loadMyGroups() {
    this.loading.set(true);
    this.groupService.getMyGroups(this.page, 20)
      .subscribe({
        next: (response) => {
          this.groups.set(response.data.map(g => ({ ...g, isMember: true })));
          this.hasMore.set(response.hasMore);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading my groups:', error);
          this.loading.set(false);
        }
      });
  }

  loadMore() {
    this.loadingMore.set(true);
    this.page++;

    const request$ = this.activeTab() === 'my'
      ? this.groupService.getMyGroups(this.page, 20)
      : this.groupService.discoverGroups(this.page, 20, this.searchQuery || undefined);

    request$.subscribe({
      next: (response) => {
        this.groups.update(current => [...current, ...response.data]);
        this.hasMore.set(response.hasMore);
        this.loadingMore.set(false);
      },
      error: (error) => {
        console.error('Error loading more groups:', error);
        this.loadingMore.set(false);
      }
    });
  }

  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadGroups();
    }, 300);
  }

  joinGroup(group: Group) {
    this.joiningGroup.set(group.id);
    this.groupService.joinGroup(group.id).subscribe({
      next: (membership) => {
        this.groups.update(groups => 
          groups.map(g => 
            g.id === group.id 
              ? { ...g, isMember: true, memberRole: membership.role, memberCount: g.memberCount + 1 }
              : g
          )
        );
        this.joiningGroup.set(null);
      },
      error: (error) => {
        console.error('Error joining group:', error);
        this.joiningGroup.set(null);
      }
    });
  }

  onGroupCreated(group: Group) {
    this.showCreateModal.set(false);
    this.groups.update(groups => [{ ...group, isMember: true, memberRole: 'OWNER' }, ...groups]);
  }

  getRoleDisplay(role?: string): string {
    if (!role) return this.translocoService.translate('social.groups.roles.member');
    const roleKeys: Record<string, string> = {
      OWNER: 'social.groups.roles.owner',
      ADMIN: 'social.groups.roles.admin',
      MODERATOR: 'social.groups.roles.admin',
      MEMBER: 'social.groups.roles.member'
    };
    return this.translocoService.translate(roleKeys[role] || 'social.groups.roles.member');
  }
}
