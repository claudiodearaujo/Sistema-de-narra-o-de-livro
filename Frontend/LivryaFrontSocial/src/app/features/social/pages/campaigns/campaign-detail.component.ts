import { Component, OnInit, inject, signal } from '@angular/core';

import { RouterModule, ActivatedRoute } from '@angular/router';
import { CampaignService } from '../../../../core/services/campaign.service';
import { Campaign, CampaignProgress, CampaignBook } from '../../../../core/models/group.model';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './campaign-detail.component.html',
  styleUrl: './campaign-detail.component.css',
})
export class CampaignDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly campaignService = inject(CampaignService);

  campaign = signal<Campaign | null>(null);
  myProgress = signal<CampaignProgress | null>(null);
  leaderboard = signal<CampaignProgress[]>([]);
  completedBooks = signal<Set<string>>(new Set());
  
  loading = signal(true);
  actionLoading = signal(false);
  leaderboardLoading = signal(true);
  completingBook = signal<string | null>(null);

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loadCampaign(params['id']);
    });
  }

  loadCampaign(id: string) {
    this.loading.set(true);
    
    this.campaignService.getCampaignById(id).subscribe({
      next: (campaign) => {
        this.campaign.set(campaign);
        this.loading.set(false);
        
        // Check if user progress exists
        if (campaign.userProgress) {
          this.myProgress.set(campaign.userProgress);
          // Calculate which books are completed (simplified - just count)
          const completedSet = new Set<string>();
          for (let i = 0; i < campaign.userProgress.booksRead; i++) {
            if (campaign.books[i]) {
              completedSet.add(campaign.books[i].bookId);
            }
          }
          this.completedBooks.set(completedSet);
        }
        
        this.loadLeaderboard(id);
      },
      error: (error) => {
        console.error('Error loading campaign:', error);
        this.loading.set(false);
      }
    });
  }

  loadLeaderboard(campaignId: string) {
    this.leaderboardLoading.set(true);
    
    this.campaignService.getLeaderboard(campaignId).subscribe({
      next: (leaderboard) => {
        this.leaderboard.set(leaderboard);
        this.leaderboardLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
        this.leaderboardLoading.set(false);
      }
    });
  }

  joinCampaign() {
    if (!this.campaign()) return;
    
    this.actionLoading.set(true);
    this.campaignService.joinCampaign(this.campaign()!.id).subscribe({
      next: (progress) => {
        this.myProgress.set(progress);
        this.campaign.update(c => c ? { 
          ...c, 
          _count: { ...c._count, progress: c._count.progress + 1 } 
        } : c);
        this.actionLoading.set(false);
        this.loadLeaderboard(this.campaign()!.id);
      },
      error: (error) => {
        console.error('Error joining campaign:', error);
        this.actionLoading.set(false);
      }
    });
  }

  completeBook(campaignBook: CampaignBook) {
    if (!this.campaign()) return;
    
    this.completingBook.set(campaignBook.bookId);
    
    this.campaignService.completeBook(this.campaign()!.id, campaignBook.bookId).subscribe({
      next: (progress) => {
        this.myProgress.set(progress);
        this.completedBooks.update(set => {
          const newSet = new Set(set);
          newSet.add(campaignBook.bookId);
          return newSet;
        });
        this.completingBook.set(null);
        this.loadLeaderboard(this.campaign()!.id);
        
        // Show reward if earned
        if (progress.rewardEarned) {
          alert(`Parabéns! Você completou a campanha e ganhou ${progress.rewardEarned} Livras! 🎉`);
        }
      },
      error: (error) => {
        console.error('Error completing book:', error);
        this.completingBook.set(null);
      }
    });
  }

  isBookCompleted(campaignBook: CampaignBook): boolean {
    return this.completedBooks().has(campaignBook.bookId);
  }

  getProgressPercent(): number {
    if (!this.myProgress() || !this.campaign()) return 0;
    const total = this.campaign()!.books.length;
    if (total === 0) return 0;
    return Math.round((this.myProgress()!.booksRead / total) * 100);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Rascunho',
      ACTIVE: 'Ativa',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      DRAFT: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300',
      ACTIVE: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      COMPLETED: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300',
      CANCELLED: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400'
    };
    return classes[status] || 'bg-secondary-100 text-secondary-700';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Não definida';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  }
}
