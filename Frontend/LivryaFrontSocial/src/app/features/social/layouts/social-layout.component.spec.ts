import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SocialLayoutComponent } from './social-layout.component';
import { AuthService } from '../../../core/auth/services/auth.service';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SocialLayoutComponent', () => {
  let component: SocialLayoutComponent;
  let fixture: ComponentFixture<SocialLayoutComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['currentUser', 'logout']);
    authSpy.currentUser.and.returnValue({ 
      id: '1', 
      name: 'Test User', 
      email: 'test@example.com',
      role: 'USER',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await TestBed.configureTestingModule({
      imports: [
        SocialLayoutComponent,
        RouterTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authSpy }
      ]
    })
    .compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(SocialLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default signals', () => {
    expect(component.notificationCount()).toBe('3');
    expect(component.messageCount()).toBe('1');
    const user = component.currentUser();
    expect(user?.id).toBe('1');
    expect(user?.name).toBe('Test User');
    expect(user?.email).toBe('test@example.com');
  });

  it('should check mobile on init', () => {
    // Mock window.innerWidth using Object.defineProperty since spyOnProperty can't be called twice
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });
    component.onResize();
    expect(component.isMobile()).toBeTrue();

    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    component.onResize();
    expect(component.isMobile()).toBeFalse();
  });

  it('should get correct initials', () => {
    expect(component.getInitials()).toBe('TU');
  });

  it('should call logout on AuthService when logout is called', () => {
    const navigateSpy = spyOn(router, 'navigate');
    // Calling the private logout wrapper via correct menu command simulation or direct call if exposed/public
    // Since logout is private, we can simulate the menu command execution
    // or we can test it if we change visibility. 
    // However, initUserMenu sets up the command.
    
    // We can't access private logout directly in TS strict mode usually, 
    // but for testing purposes we can try to find the menu item and execute command.
    
    // Let's trigger the command from the menu item "Sair"
    const logoutItem = component['userMenuItems'].find(item => item.label === 'Sair');
    expect(logoutItem).toBeDefined();
    if (logoutItem && logoutItem.command) {
      logoutItem.command({ originalEvent: new Event('click') });
    }
    
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should navigate to correct routes', () => {
    const navigateSpy = spyOn(router, 'navigate');
    
    component.goToFeed();
    expect(navigateSpy).toHaveBeenCalledWith(['/social/feed']);
    
    component.goToSearch();
    expect(navigateSpy).toHaveBeenCalledWith(['/social/search']);
    
    component.goToNotifications();
    expect(navigateSpy).toHaveBeenCalledWith(['/social/notifications']);
    
    component.goToMessages();
    expect(navigateSpy).toHaveBeenCalledWith(['/social/messages']);
  });
});
