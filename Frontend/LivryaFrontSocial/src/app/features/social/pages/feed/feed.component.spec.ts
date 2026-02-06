import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedComponent } from './feed.component';
import { PostService } from '../../../../core/services/post.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Post } from '../../../../core/models/post.model';
import { By } from '@angular/platform-browser';

describe('FeedComponent', () => {
  let component: FeedComponent;
  let fixture: ComponentFixture<FeedComponent>;
  let postServiceSpy: jasmine.SpyObj<PostService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  const mockPosts: Post[] = [
    {
      id: '1',
      type: 'TEXT',
      content: 'Post 1',
      userId: 'u1',
      likeCount: 5,
      commentCount: 2,
      shareCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: { id: 'u1', name: 'User 1', username: 'user1' },
      isLiked: false
    },
    {
      id: '2',
      type: 'IMAGE',
      content: 'Post 2',
      userId: 'u2',
      likeCount: 10,
      commentCount: 5,
      shareCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: { id: 'u2', name: 'User 2', username: 'user2' },
      isLiked: true
    }
  ];

  beforeEach(async () => {
    const postSpy = jasmine.createSpyObj('PostService', ['getFeed', 'toggleLike']);
    const authSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
    const messageSpy = jasmine.createSpyObj('MessageService', ['add']);

    postSpy.getFeed.and.returnValue(of({ posts: mockPosts, pagination: { page: 1, limit: 20, total: 2, pages: 1, hasMore: false } }));
    authSpy.currentUser.and.returnValue({ id: 'u1', name: 'User 1' });

    await TestBed.configureTestingModule({
      imports: [FeedComponent, BrowserAnimationsModule, RouterTestingModule],
      providers: [
        { provide: PostService, useValue: postSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: MessageService, useValue: messageSpy }
      ]
    }).compileComponents();

    postServiceSpy = TestBed.inject(PostService) as jasmine.SpyObj<PostService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    messageServiceSpy = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;

    fixture = TestBed.createComponent(FeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load posts on init', () => {
    expect(postServiceSpy.getFeed).toHaveBeenCalledWith(1, 20);
    expect(component.posts().length).toBe(2);
    expect(component.loading()).toBeFalse();
  });

  it('should handle load more posts', () => {
    // Reset spy calls
    postServiceSpy.getFeed.calls.reset();
    
    // Setup component state for loadMore
    component.hasMore.set(true);
    component.loadingMore.set(false);
    
    const morePosts = [{ ...mockPosts[0], id: '3' }];
    postServiceSpy.getFeed.and.returnValue(of({ posts: morePosts, pagination: { page: 2, limit: 20, total: 3, totalPages: 2, hasMore: true } }));

    component.loadMore();

    // Since the observable resolves synchronously, loadingMore will be false after completion
    expect(postServiceSpy.getFeed).toHaveBeenCalledWith(2, 20);
    expect(component.posts().length).toBe(3);
  });

  it('should toggle like optimistically', () => {
    const post = mockPosts[0];
    const initialLiked = post.isLiked; // false
    const initialCount = post.likeCount; // 5

    postServiceSpy.toggleLike.and.returnValue(of({ liked: true, likeCount: 6 }));

    component.toggleLike(post);

    // Optimistic update
    expect(post.isLiked).toBeTrue();
    expect(post.likeCount).toBe(6);
    expect(postServiceSpy.toggleLike).toHaveBeenCalledWith(post.id);
  });

  it('should revert like toggle on error', () => {
    const post = { ...mockPosts[1] }; // Copy to avoid mutation issues
    component.posts.set([post]);
    
    const initialLiked = post.isLiked; // true
    const initialCount = post.likeCount; // 10

    postServiceSpy.toggleLike.and.returnValue(throwError(() => new Error('Error')));

    component.toggleLike(post);
    
    // It temporarily changes, then reverts.
    // The post in the array should be reverted to original state
    const updatedPost = component.posts().find(p => p.id === post.id);
    expect(updatedPost?.isLiked).toBe(initialLiked);
    expect(updatedPost?.likeCount).toBe(initialCount);
  });

  it('should open post modal', () => {
    component.openPostModal();
    expect(component.showPostComposer()).toBeTrue();
  });

  it('should add new post when created', () => {
    const newPost: Post = { ...mockPosts[0], id: '99', content: 'New Post' };
    component.onPostCreated(newPost);
    expect(component.posts()[0].id).toBe('99');
    expect(component.posts().length).toBe(3);
  });
});
