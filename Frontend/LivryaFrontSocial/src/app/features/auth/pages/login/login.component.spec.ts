import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let translocoService: jasmine.SpyObj<TranslocoService>;

  beforeEach(async () => {
    const translocoSpy = jasmine.createSpyObj('TranslocoService', [
      'getActiveLang',
      'getAvailableLangs',
      'translate',
      'load',
      'setActiveLang'
    ]);

    // Mock transloco to return translations
    translocoSpy.getActiveLang.and.returnValue('pt-BR');
    translocoSpy.getAvailableLangs.and.returnValue(['pt-BR', 'en', 'es']);
    translocoSpy.translate.and.callFake((key: string) => {
      const translations: Record<string, string> = {
        'auth.login.title': 'Bem-vindo de volta!',
        'auth.login.subtitle': 'Entre na sua conta para continuar',
        'auth.login.email': 'E-mail',
        'auth.login.emailPlaceholder': 'seu@email.com',
        'auth.login.password': 'Senha',
        'auth.login.passwordPlaceholder': 'Sua senha'
      };
      return translations[key] || key;
    });
    translocoSpy.load.and.returnValue(of({}));

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'isLoading', 'getToken', 'isAuthenticated']);
    authServiceSpy.isLoading.and.returnValue(false);

    const analyticsServiceSpy = jasmine.createSpyObj('AnalyticsService', ['trackLogin', 'trackError']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        TranslocoModule
      ],
      providers: [
        { provide: TranslocoService, useValue: translocoSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AnalyticsService, useValue: analyticsServiceSpy },
        MessageService
      ]
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService) as jasmine.SpyObj<TranslocoService>;
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.get('rememberMe')?.value).toBe(false);
  });

  it('should validate email field as required', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();
  });

  it('should validate password as required', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBeTruthy();
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('12345');
    expect(passwordControl?.hasError('minlength')).toBeTruthy();
  });

  it('should load transloco translations on init', () => {
    fixture.detectChanges();
    expect(translocoService.load).toHaveBeenCalledWith('pt-BR');
  });

  it('should set translocoLoaded to true after translations load', (done) => {
    fixture.detectChanges();

    setTimeout(() => {
      expect(component.translocoLoaded).toBeTruthy();
      done();
    }, 100);
  });

  it('should translate keys correctly', () => {
    const translated = translocoService.translate('auth.login.title');
    expect(translated).toBe('Bem-vindo de volta!');
  });

  it('should mark form as invalid when fields are empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should mark form as valid when fields are filled correctly', () => {
    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('password123');
    expect(component.loginForm.valid).toBeTruthy();
  });
});
