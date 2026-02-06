import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostComposerComponent } from './post-composer.component';
import { PostService } from '../../../core/services/post.service';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CreatePostDto, Post } from '../../../core/models/post.model';

describe('PostComposerComponent', () => {
  let component: PostComposerComponent;
  let fixture: ComponentFixture<PostComposerComponent>;
  let postServiceSpy: jasmine.SpyObj<PostService>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    const postSpy = jasmine.createSpyObj('PostService', ['createPost']);
    const messageSpy = jasmine.createSpyObj('MessageService', ['add']);

    // Provide default successful response
    postSpy.createPost.and.returnValue(of({ id: '123' } as Post));

    await TestBed.configureTestingModule({
      imports: [PostComposerComponent, BrowserAnimationsModule],
      providers: [
        { provide: PostService, useValue: postSpy },
        { provide: MessageService, useValue: messageSpy }
      ]
    })
    .compileComponents();

    postServiceSpy = TestBed.inject(PostService) as jasmine.SpyObj<PostService>;
    messageServiceSpy = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;

    fixture = TestBed.createComponent(PostComposerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default state', () => {
    expect(component.content()).toBe('');
    expect(component.postType()).toBe('TEXT');
    expect(component.submitting()).toBeFalse();
    expect(component.isValid).toBeFalse();
  });

  it('should validate content', () => {
    component.onContentChange('  ');
    expect(component.isValid).toBeFalse(); // Trimmed length is 0

    component.onContentChange('Hello');
    expect(component.isValid).toBeTrue();

    const longText = 'a'.repeat(2001);
    component.onContentChange(longText);
    expect(component.isValid).toBeFalse(); // Too long
  });

  it('should toggle image input', () => {
    component.toggleImageInput();
    expect(component.showImageInput()).toBeTrue();
    expect(component.postType()).toBe('IMAGE');

    // Case 2: Toggle off
    component.mediaUrl.set('http://example.com/image.jpg');
    component.toggleImageInput();
    expect(component.showImageInput()).toBeFalse();
    expect(component.mediaUrl()).toBe(''); // Should reset
  });

  it('should submit post successfully', () => {
    component.onContentChange('My new post');
    component.submit();

    const expectedDto: CreatePostDto = {
      type: 'TEXT',
      content: 'My new post',
      mediaUrl: undefined
    };

    expect(postServiceSpy.createPost).toHaveBeenCalledWith(expectedDto);
    expect(messageServiceSpy.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
  });

  it('should not submit if invalid', () => {
    component.onContentChange('');
    component.submit();
    expect(postServiceSpy.createPost).not.toHaveBeenCalled();
  });

  it('should handle submit error', () => {
    postServiceSpy.createPost.and.returnValue(throwError(() => ({ error: { error: 'Failed' } })));
    
    component.onContentChange('My new post');
    component.submit();

    expect(postServiceSpy.createPost).toHaveBeenCalled();
    expect(messageServiceSpy.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
    expect(component.submitting()).toBeFalse();
  });

  it('should close dialog and reset', () => {
    spyOn(component.visibleChange, 'emit');
    component.onContentChange('Some text');
    component.close();

    expect(component.visible()).toBeFalse();
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    expect(component.content()).toBe('');
  });
});
