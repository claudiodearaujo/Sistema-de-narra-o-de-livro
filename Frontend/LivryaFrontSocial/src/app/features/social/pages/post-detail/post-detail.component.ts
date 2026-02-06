import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

import { PostService } from '../../../../core/services/post.service';
import { Post } from '../../../../core/models/post.model';
import { CommentService, Comment } from '../../../../core/services/comment.service';
import { LikeService } from '../../../../core/services/like.service';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslocoModule,
    ButtonModule,
    AvatarModule,
    TextareaModule,
    SkeletonModule,
    MenuModule
  ],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.css'
})
export class PostDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly postService = inject(PostService);
  private readonly commentService = inject(CommentService);
  private readonly likeService = inject(LikeService);
  private readonly seoService = inject(SeoService);
  private readonly structuredDataService = inject(StructuredDataService);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroy$ = new Subject<void>();

  loading = signal(true);
  post = signal<Post | null>(null);
  comments = signal<Comment[]>([]);
  commentText = signal('');
  replyingTo = signal<string | null>(null);
  replyText = signal('');
  submittingComment = signal(false);
  likingPost = signal(false);
  likingComments = signal<Set<string>>(new Set());

  menuItems = computed<MenuItem[]>(() => [
    { label: this.translocoService.translate('common.actions.share'), icon: 'pi pi-share-alt', command: () => this.sharePost() },
    { label: this.translocoService.translate('social.postDetail.bookmark'), icon: 'pi pi-bookmark', command: () => this.toggleBookmark() },
    { separator: true },
    { label: this.translocoService.translate('social.postDetail.report'), icon: 'pi pi-flag', command: () => this.reportPost() }
  ]);

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const postId = params['id'];
      this.loadPost(postId);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up SEO schemas
    this.structuredDataService.removeJsonLd('article-schema');
    this.structuredDataService.removeJsonLd('breadcrumb-schema');
    this.seoService.resetToDefaults();
  }

  loadPost(postId: string) {
    this.loading.set(true);
    
    forkJoin({
      post: this.postService.getPostById(postId),
      comments: this.commentService.getComments(postId)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ post, comments }) => {
        this.post.set(post);
        this.comments.set(comments.comments);
        this.loading.set(false);

        // Configure SEO for post
        this.configurePostSeo(post);
      },
      error: (err) => {
        console.error('Failed to load post:', err);
        this.loading.set(false);
      }
    });
  }

  formatTimeAgo(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return this.translocoService.translate('common.time.now');
    if (diffMins < 60) return `${diffMins}${this.translocoService.translate('common.time.min')}`;
    if (diffHours < 24) return `${diffHours}${this.translocoService.translate('common.time.hour')}`;
    if (diffDays < 7) return `${diffDays}${this.translocoService.translate('common.time.day')}`;

    const lang = this.translocoService.getActiveLang();
    return d.toLocaleDateString(lang);
  }

  toggleLike() {
    const p = this.post();
    if (!p || this.likingPost()) return;
    
    this.likingPost.set(true);
    
    this.likeService.toggleLike(p.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.post.set({
          ...p,
          isLiked: response.liked,
          likeCount: response.likeCount
        });
        this.likingPost.set(false);
      },
      error: () => this.likingPost.set(false)
    });
  }

  toggleBookmark() {
    const p = this.post();
    if (!p) return;
    
    // TODO: Implement bookmark service
    this.post.set({
      ...p,
      isBookmarked: !p.isBookmarked
    });
  }

  toggleCommentLike(comment: Comment) {
    const likingSet = new Set(this.likingComments());
    if (likingSet.has(comment.id)) return;
    
    likingSet.add(comment.id);
    this.likingComments.set(likingSet);
    
    this.commentService.toggleCommentLike(comment.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.comments.update(comments => 
          comments.map(c => {
            if (c.id === comment.id) {
              return {
                ...c,
                isLiked: response.liked,
                likeCount: response.likeCount
              };
            }
            // Check replies
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map(r => 
                  r.id === comment.id 
                    ? { ...r, isLiked: response.liked, likeCount: response.likeCount }
                    : r
                )
              };
            }
            return c;
          })
        );
        
        const newSet = new Set(this.likingComments());
        newSet.delete(comment.id);
        this.likingComments.set(newSet);
      },
      error: () => {
        const newSet = new Set(this.likingComments());
        newSet.delete(comment.id);
        this.likingComments.set(newSet);
      }
    });
  }

  startReply(commentId: string) {
    this.replyingTo.set(commentId);
    this.replyText.set('');
  }

  cancelReply() {
    this.replyingTo.set(null);
    this.replyText.set('');
  }

  submitComment() {
    const p = this.post();
    if (!this.commentText().trim() || !p || this.submittingComment()) return;
    
    this.submittingComment.set(true);
    
    this.commentService.createComment(p.id, { content: this.commentText() }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (newComment) => {
        this.comments.update(comments => [newComment, ...comments]);
        this.post.set({
          ...p,
          commentCount: p.commentCount + 1
        });
        this.commentText.set('');
        this.submittingComment.set(false);
      },
      error: () => this.submittingComment.set(false)
    });
  }

  submitReply(parentId: string) {
    const p = this.post();
    if (!this.replyText().trim() || !p || this.submittingComment()) return;
    
    this.submittingComment.set(true);
    
    this.commentService.createComment(p.id, { content: this.replyText(), parentId }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (newReply: Comment) => {
        this.comments.update(comments => 
          comments.map(c => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newReply]
              };
            }
            return c;
          })
        );
        this.replyingTo.set(null);
        this.replyText.set('');
        this.submittingComment.set(false);
      },
      error: () => this.submittingComment.set(false)
    });
  }

  sharePost() {
    const p = this.post();
    if (!p) return;

    if (navigator.share) {
      navigator.share({
        title: this.translocoService.translate('social.postDetail.postBy') + ' ' + p.user.name,
        text: p.content.substring(0, 100),
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  }

  reportPost() {
    // TODO: Implement report functionality
    console.log('Report post');
  }

  goBack() {
    history.back();
  }

  private configurePostSeo(post: Post): void {
    // Get a truncated version of the content for description
    const description = post.content.length > 160
      ? post.content.substring(0, 157) + '...'
      : post.content;

    // Configure SEO meta tags
    this.seoService.updateSeoTags({
      title: `Post de ${post.user.name} - LIVRIA`,
      description: description,
      image: post.mediaUrl || undefined,
      type: 'article'
    });

    // Configure Article schema for structured data
    this.structuredDataService.setArticleSchema({
      headline: `Post de ${post.user.name}`,
      description: description,
      author: post.user.name,
      datePublished: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString(),
      image: post.mediaUrl
    });

    // Configure breadcrumb
    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Comunidade', url: 'https://livrya.com.br/social' },
      { name: post.user.name, url: `https://livrya.com.br/social/profile/${post.user.username || post.user.id}` },
      { name: 'Post', url: `https://livrya.com.br/social/posts/${post.id}` }
    ]);
  }
}
