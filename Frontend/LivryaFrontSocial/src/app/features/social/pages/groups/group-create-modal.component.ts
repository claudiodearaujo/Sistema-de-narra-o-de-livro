import { Component, inject, signal, computed, output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { GroupService } from '../../../../core/services/group.service';
import { Group, GroupPrivacy } from '../../../../core/models/group.model';

@Component({
  selector: 'app-group-create-modal',
  standalone: true,
  imports: [FormsModule, TranslocoModule],
  templateUrl: './group-create-modal.component.html',
  styleUrl: './group-create-modal.component.css',
})
export class GroupCreateModalComponent {
  readonly close = output<void>();
  readonly created = output<Group>();

  private readonly groupService = inject(GroupService);
  private readonly translocoService = inject(TranslocoService);

  name = '';
  description = '';
  coverUrl = '';
  privacy: GroupPrivacy = 'PUBLIC';
  loading = signal(false);
  error = signal<string | null>(null);

  privacyOptions = computed(() => [
    {
      value: 'PUBLIC' as GroupPrivacy,
      label: this.translocoService.translate('social.groups.privacy.public'),
      description: this.translocoService.translate('social.groups.privacy.publicDesc')
    },
    {
      value: 'PRIVATE' as GroupPrivacy,
      label: this.translocoService.translate('social.groups.privacy.private'),
      description: this.translocoService.translate('social.groups.privacy.privateDesc')
    },
    {
      value: 'INVITE_ONLY' as GroupPrivacy,
      label: this.translocoService.translate('social.groups.privacy.inviteOnly'),
      description: this.translocoService.translate('social.groups.privacy.inviteOnlyDesc')
    }
  ]);

  onSubmit() {
    if (!this.name.trim()) return;

    this.loading.set(true);
    this.error.set(null);

    this.groupService.createGroup({
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      coverUrl: this.coverUrl.trim() || undefined,
      privacy: this.privacy
    }).subscribe({
      next: (group) => {
        this.loading.set(false);
        this.created.emit(group);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || this.translocoService.translate('social.groups.create.error'));
      }
    });
  }
}
