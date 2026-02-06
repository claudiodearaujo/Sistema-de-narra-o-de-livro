# CLAUDE.md - AI Assistant Development Guide

**Project**: Livrya - Sistema de Narração de Livro (Frontend)
**Framework**: Angular 21.1.1
**Language**: TypeScript 5.9.3
**Last Updated**: 2026-01-29

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Patterns](#architecture--patterns)
3. [Directory Structure](#directory-structure)
4. [Development Workflows](#development-workflows)
5. [Code Conventions](#code-conventions)
6. [State Management](#state-management)
7. [Testing Strategy](#testing-strategy)
8. [Common Tasks](#common-tasks)
9. [Important Notes for AI Assistants](#important-notes-for-ai-assistants)

---

## Project Overview

Livrya is a book narration system with social networking features. The application allows:
- **Writers** to create books, manage chapters, and configure narration
- **Readers** to explore content, interact socially, and access narrated books
- **Social features** including posts, comments, follows, and notifications
- **Gamification** with achievements, badges, and leaderboards
- **Subscription system** using virtual currency (Livras)

### Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Angular 21.1.1 (standalone components, zoneless) |
| **Language** | TypeScript 5.9.3 (strict mode) |
| **UI Framework** | PrimeNG 21.x |
| **Styling** | Tailwind CSS 4.x, custom design tokens |
| **State Management** | Angular Signals + RxJS |
| **i18n** | Transloco (PT-BR, EN, ES) |
| **Real-time** | Socket.io Client 4.8.3 |
| **Unit Testing** | Karma + Jasmine |
| **E2E Testing** | Playwright 1.58.0 |
| **HTTP** | Angular HttpClient with interceptors |

### API Backend

- **Base URL**: `https://sistema-de-narra-o-de-livro.onrender.com/api`
- **WebSocket URL**: `https://sistema-de-narra-o-de-livro.onrender.com`
- **Authentication**: JWT tokens (access + refresh)

---

## Architecture & Patterns

### Modern Angular Patterns (v21+)

This project uses cutting-edge Angular features:

#### 1. **Standalone Components**
- **NO NgModules** - entire app uses standalone architecture
- All components declare their dependencies via `imports: []`
- Services use `providedIn: 'root'`

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule],
  templateUrl: './example.component.html'
})
export class ExampleComponent {}
```

#### 2. **Zoneless Change Detection**
- Uses `provideZonelessChangeDetection()` for better performance
- Relies on signals and explicit change detection
- Event coalescing enabled

#### 3. **Signals-First State Management**
- Primary state mechanism using `signal()`, `computed()`, `effect()`
- RxJS Observables for HTTP and async operations
- No NgRx or heavy state management library

```typescript
// Modern signal pattern
export class BookService {
  private booksSignal = signal<Book[]>([]);
  readonly books = this.booksSignal.asReadonly();
  readonly bookCount = computed(() => this.books().length);
}
```

#### 4. **Functional Guards & Interceptors**
- `CanActivateFn` instead of class-based guards
- `HttpInterceptorFn` for HTTP interception
- Dependency injection via `inject()` function

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // Guard logic...
};
```

#### 5. **Lazy Loading & Route-Based Code Splitting**
- All feature modules lazy-loaded via routes
- Optimizes initial bundle size
- Route definitions use `loadChildren` pattern

### Component Architecture

**Pattern**: Smart/Dumb Components

- **Smart Components** (Container): Inject services, manage state, handle logic
- **Dumb Components** (Presentational): Receive inputs, emit outputs, pure display

```typescript
// Smart component
export class BookListComponent {
  private bookService = inject(BookService);
  books = signal<Book[]>([]);

  ngOnInit() {
    this.loadBooks();
  }
}

// Dumb component
export class BookCardComponent {
  book = input.required<Book>();
  onSelect = output<string>();
}
```

---

## Directory Structure

```
/
├── src/
│   ├── app/
│   │   ├── app.config.ts              # Root providers (router, i18n, HTTP, etc.)
│   │   ├── app.routes.ts              # Root routing configuration
│   │   ├── app.component.ts           # Root component with router-outlet
│   │   │
│   │   ├── core/                      # Core functionality (singleton services)
│   │   │   ├── auth/                  # Auth config
│   │   │   ├── directives/            # Global directives (scroll-tracker, lazy-image, etc.)
│   │   │   ├── guards/                # Route guards (auth, role, verified, guest)
│   │   │   ├── i18n/                  # Transloco configuration
│   │   │   ├── interceptors/          # HTTP interceptors (auth, error)
│   │   │   ├── models/                # TypeScript interfaces/types
│   │   │   ├── pipes/                 # Global pipes (time-ago, etc.)
│   │   │   └── services/              # Global services (29 services)
│   │   │
│   │   ├── features/                  # Feature modules (lazy-loaded)
│   │   │   ├── auth/                  # Authentication (login, signup, profile)
│   │   │   ├── writer/                # Writer features (books, chapters, narration)
│   │   │   ├── social/                # Social network (feed, explore, profiles)
│   │   │   ├── assinatura/            # Subscription & Livras system
│   │   │   ├── achievements/          # Gamification features
│   │   │   ├── institutional/         # Public pages (about, terms, privacy)
│   │   │   └── shared/                # Shared components (post-card, comments, etc.)
│   │   │
│   │   └── layouts/                   # Layout components
│   │       ├── main-layout/           # Authenticated layout (header, sidebar)
│   │       └── social-layout/         # Social feature layout
│   │
│   ├── assets/
│   │   ├── i18n/                      # Translation JSON files
│   │   │   ├── pt-BR.json             # Portuguese (default)
│   │   │   ├── en.json                # English
│   │   │   └── es.json                # Spanish
│   │   ├── images/                    # Image assets
│   │   └── flags/                     # Language flag icons
│   │
│   ├── environments/                  # Environment configs
│   │   ├── environment.ts             # Development
│   │   └── environment.prod.ts        # Production
│   │
│   ├── styles.css                     # Global styles (Tailwind imports)
│   ├── design-tokens.css              # Design system tokens (CSS variables)
│   ├── livrya-theme.preset.ts         # PrimeNG theme configuration
│   ├── main.ts                        # Bootstrap entry point
│   ├── manifest.webmanifest           # PWA manifest
│   └── sw.js                          # Service worker
│
├── e2e/                               # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── social.spec.ts
│   ├── pwa.spec.ts
│   └── gamification.spec.ts
│
├── angular.json                       # Angular CLI configuration
├── tsconfig.json                      # TypeScript configuration
├── tailwind.config.js                 # Tailwind configuration
├── playwright.config.ts               # Playwright configuration
├── package.json                       # Dependencies & scripts
└── README.md                          # Project documentation
```

### Feature Modules Breakdown

| Module | Path | Description | Layout |
|--------|------|-------------|--------|
| **Auth** | `/auth/*` | Login, signup, forgot password, profile | None |
| **Writer** | `/writer/*` | Book/chapter management, narration config | MainLayout |
| **Social** | `/social/*` | Feed, explore, profiles, posts | SocialLayout |
| **Subscription** | `/subscription/*` | Livras, payments, subscriptions | MainLayout |
| **Achievements** | `/achievements/*` | Badges, leaderboards, gamification | MainLayout |
| **Institutional** | `/institutional/*` | About, terms, privacy (public) | None |
| **Shared** | N/A (imported) | Reusable components | N/A |

---

## Development Workflows

### Setup & Running

```bash
# Install dependencies
npm install

# Start dev server (opens browser automatically)
npm start
# → Opens http://localhost:4200/

# Build for production
npm run build
# → Output in dist/

# Watch mode (rebuild on changes)
npm run watch
```

### Testing

```bash
# Unit tests (Karma + Jasmine)
npm test

# E2E tests (Playwright)
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui           # Interactive UI mode
npm run test:e2e:headed       # Watch tests in browser
npm run test:e2e:debug        # Debug mode with breakpoints
npm run test:e2e:report       # View HTML test report
```

### Code Generation

```bash
# Generate component (standalone)
ng generate component features/feature-name/components/my-component

# Generate service
ng generate service features/feature-name/services/my-service

# Generate guard
ng generate guard core/guards/my-guard --functional

# Generate pipe
ng generate pipe core/pipes/my-pipe --standalone

# Generate directive
ng generate directive core/directives/my-directive --standalone
```

### Git Workflow

**Branch Naming Convention**: `claude/<description>-<sessionId>`

```bash
# Create feature branch
git checkout -b claude/feature-description-abc123

# Commit with descriptive message
git commit -m "feat: add book search functionality

Implement full-text search for books with filters

https://claude.ai/code/session_xxx"

# Push to remote (always use -u for first push)
git push -u origin claude/feature-description-abc123

# Create PR using gh CLI
gh pr create --title "Add book search functionality" --body "Description..."
```

**CRITICAL**: Branch must start with `claude/` and end with session ID or push will fail (403 error).

### Build & Deployment

- **Build output**: `dist/` directory
- **Production build**: Includes service worker, PWA manifest, offline page
- **Deployment**: Configured for Render (see `render.yaml`)
- **SPA Routing**: `_redirects` file handles client-side routing

---

## Code Conventions

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| **Component** | PascalCase + `Component` suffix | `BookListComponent` |
| **Service** | PascalCase + `Service` suffix | `AuthService` |
| **Guard** | camelCase + `Guard` suffix (functional) | `authGuard` |
| **Pipe** | PascalCase + `Pipe` suffix | `TimeAgoPipe` |
| **Directive** | PascalCase + `Directive` suffix | `InfiniteScrollDirective` |
| **Interface/Type** | PascalCase | `Book`, `User`, `AuthResponse` |
| **Constant** | UPPER_SNAKE_CASE | `API_BASE_URL` |
| **Variable/Function** | camelCase | `currentUser`, `loadBooks()` |

### File Naming

- **Components**: `*.component.ts`
- **Services**: `*.service.ts`
- **Guards**: `*.guard.ts`
- **Pipes**: `*.pipe.ts`
- **Directives**: `*.directive.ts`
- **Models**: `*.model.ts`
- **Routes**: `*.routes.ts`
- **Tests**: `*.spec.ts`

### TypeScript Guidelines

```typescript
// ✅ DO: Use strict typing
interface Book {
  id: string;
  title: string;
  authorId: string;
  chapters: Chapter[];
}

// ✅ DO: Use readonly for immutable properties
readonly books = signal<Book[]>([]);

// ✅ DO: Use inject() in constructor or class properties
private authService = inject(AuthService);

// ✅ DO: Use signals for reactive state
private countSignal = signal(0);
readonly count = this.countSignal.asReadonly();

// ❌ DON'T: Use 'any' type
// Bad: getData(): any
// Good: getData(): Book[]

// ❌ DON'T: Mutate signal values directly
// Bad: this.booksSignal()[0].title = 'New Title';
// Good: this.booksSignal.update(books => [...books, newBook]);
```

### Component Guidelines

```typescript
@Component({
  selector: 'app-book-list',  // Always prefix with 'app-'
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    // ... only what you need
  ],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.css'  // Note: styleUrl (singular) in Angular 17+
})
export class BookListComponent implements OnInit {
  // Inject services
  private bookService = inject(BookService);
  private router = inject(Router);

  // Input/Output signals (modern approach)
  readonly categoryId = input<string>();
  readonly onBookSelect = output<string>();

  // Local state
  books = signal<Book[]>([]);
  isLoading = signal(false);

  // Computed values
  bookCount = computed(() => this.books().length);
  hasBooks = computed(() => this.bookCount() > 0);

  ngOnInit() {
    this.loadBooks();
  }

  private loadBooks() {
    this.isLoading.set(true);
    this.bookService.getAll().subscribe({
      next: (books) => {
        this.books.set(books);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load books:', error);
        this.isLoading.set(false);
      }
    });
  }
}
```

### Service Guidelines

```typescript
@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/books`;

  // Signal-based state
  private booksSignal = signal<Book[]>([]);
  readonly books = this.booksSignal.asReadonly();

  // Observable-based methods for HTTP
  getAll(page = 1, limit = 10): Observable<BooksResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<BooksResponse>(this.apiUrl, { params }).pipe(
      tap(response => this.booksSignal.set(response.data)),
      catchError(error => {
        console.error('Failed to fetch books:', error);
        return throwError(() => error);
      })
    );
  }

  getById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${id}`);
  }

  create(book: Partial<Book>): Observable<Book> {
    return this.http.post<Book>(this.apiUrl, book);
  }

  update(id: string, book: Partial<Book>): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/${id}`, book);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### Template Guidelines

```html
<!-- ✅ DO: Use Angular control flow (@if, @for, @switch) -->
@if (isLoading()) {
  <app-loading-spinner />
} @else if (hasBooks()) {
  <div class="book-grid">
    @for (book of books(); track book.id) {
      <app-book-card [book]="book" (select)="onSelect(book.id)" />
    }
  </div>
} @else {
  <app-empty-state message="No books found" />
}

<!-- ✅ DO: Use Transloco for all user-facing text -->
<h1>{{ 'books.title' | transloco }}</h1>

<!-- ✅ DO: Use signals with () -->
<p>{{ bookCount() }} books available</p>

<!-- ❌ DON'T: Use old structural directives (*ngIf, *ngFor) in new code -->
<!-- Bad: <div *ngIf="isLoading">Loading...</div> -->
<!-- Good: @if (isLoading()) { <div>Loading...</div> } -->
```

### Styling Guidelines

```css
/* ✅ DO: Use Tailwind utility classes */
<div class="flex items-center gap-4 p-6 bg-surface-0 rounded-lg shadow-md">

/* ✅ DO: Use PrimeNG theme tokens */
<p-button
  label="Save"
  severity="primary"
  [raised]="true" />

/* ✅ DO: Use design tokens for custom styles */
.custom-header {
  background-color: var(--primary-color);
  color: var(--primary-color-text);
  padding: var(--spacing-4);
}

/* ❌ DON'T: Use hardcoded colors */
/* Bad: color: #4F6F64; */
/* Good: color: var(--primary-color); */
```

---

## State Management

### Authentication State (Hybrid Pattern)

**Location**: `src/app/features/auth/services/auth.service.ts`

The AuthService uses a **hybrid signal + Observable pattern**:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals for reactive state
  private currentUserSignal = signal<User | null>(null);
  private isLoadingSignal = signal<boolean>(false);

  // Public readonly access
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  // Computed derived state
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly userRole = computed(() => this.currentUserSignal()?.role);
  readonly isWriter = computed(() => this.userRole() === 'writer');

  // Observable for components preferring RxJS
  private authStateSubject = new BehaviorSubject<boolean>(this.hasToken());
  readonly authState$ = this.authStateSubject.asObservable();

  // Methods
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/auth/login`, credentials).pipe(
      tap(response => {
        this.setTokens(response.accessToken, response.refreshToken);
        this.currentUserSignal.set(response.user);
        this.authStateSubject.next(true);
      })
    );
  }

  logout(): void {
    this.clearTokens();
    this.currentUserSignal.set(null);
    this.authStateSubject.next(false);
    this.router.navigate(['/auth/login']);
  }

  // Token management
  getToken(): string | null {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    // JWT expiration check logic
  }
}
```

**Usage in Components**:

```typescript
export class ProfileComponent {
  private authService = inject(AuthService);

  // Access signals
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;

  // Or use computed
  userName = computed(() => this.currentUser()?.name ?? 'Guest');

  ngOnInit() {
    console.log('User:', this.currentUser());
    console.log('Authenticated:', this.isAuthenticated());
  }
}
```

### Service-Based State Pattern

Each feature module has dedicated services managing their own state:

```typescript
@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);

  // Local state
  private booksSignal = signal<Book[]>([]);
  private selectedBookSignal = signal<Book | null>(null);
  private isLoadingSignal = signal(false);

  // Public readonly access
  readonly books = this.booksSignal.asReadonly();
  readonly selectedBook = this.selectedBookSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  // Computed
  readonly bookCount = computed(() => this.books().length);
  readonly hasBooks = computed(() => this.bookCount() > 0);

  loadBooks(): void {
    this.isLoadingSignal.set(true);
    this.http.get<Book[]>(`${API}/books`).subscribe({
      next: (books) => {
        this.booksSignal.set(books);
        this.isLoadingSignal.set(false);
      },
      error: () => this.isLoadingSignal.set(false)
    });
  }
}
```

### Global State Access

- **No centralized store** (no NgRx, Akita, etc.)
- Services are singletons via `providedIn: 'root'`
- Components inject services and access state via signals
- Cross-component communication via shared services

---

## Testing Strategy

### Unit Testing (Karma + Jasmine)

**Location**: `*.spec.ts` files colocated with source

```typescript
describe('BookService', () => {
  let service: BookService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BookService]
    });
    service = TestBed.inject(BookService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch books', () => {
    const mockBooks: Book[] = [
      { id: '1', title: 'Test Book', authorId: 'user1', chapters: [] }
    ];

    service.getAll().subscribe(books => {
      expect(books.length).toBe(1);
      expect(books[0].title).toBe('Test Book');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/books?page=1&limit=10`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockBooks, total: 1 });
  });
});
```

**Run tests**: `npm test`

### E2E Testing (Playwright)

**Location**: `/e2e/` directory

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('[data-testid="email-input"]', 'usuario@livrya.com.br');
    await page.fill('[data-testid="password-input"]', 'User@2024!');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/social/feed');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('[data-testid="email-input"]', 'invalid@test.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('.p-toast-message-error')).toBeVisible();
  });
});
```

**Test Users (from e2e/auth.spec.ts)**:

```typescript
const TEST_USERS = {
  USER: { email: 'usuario@livrya.com.br', password: 'User@2024!' },
  WRITER: { email: 'escritor@livrya.com.br', password: 'Writer@2024!' },
  PRO: { email: 'pro@livrya.com.br', password: 'Pro@2024!' },
  ADMIN: { email: 'sophia@livrya.com.br', password: 'Livrya@2024!' }
};
```

**Run E2E tests**:
```bash
npm run test:e2e              # Run tests headless
npm run test:e2e:ui           # Interactive mode
npm run test:e2e:headed       # See browser
npm run test:e2e:debug        # Debug with breakpoints
npm run test:e2e:report       # View HTML report
```

---

## Common Tasks

### 1. Add a New Feature Module

```bash
# Create feature directory
mkdir -p src/app/features/my-feature

# Create routes file
ng generate @angular/core:route my-feature --project=frontend

# Create components
ng generate component features/my-feature/pages/my-page --standalone
ng generate component features/my-feature/components/my-component --standalone

# Create service
ng generate service features/my-feature/services/my-service

# Add to routes (src/app/features/my-feature/my-feature.routes.ts)
export const MY_FEATURE_ROUTES: Routes = [
  {
    path: '',
    component: MyPageComponent
  }
];

# Wire up in main routes (src/app/app.routes.ts)
{
  path: 'my-feature',
  loadChildren: () => import('./features/my-feature/my-feature.routes')
    .then(m => m.MY_FEATURE_ROUTES),
  canActivate: [authGuard]
}
```

### 2. Add a New API Service

```typescript
// src/app/core/services/my-entity.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { MyEntity } from '@core/models/my-entity.model';

@Injectable({ providedIn: 'root' })
export class MyEntityService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/my-entities`;

  private entitiesSignal = signal<MyEntity[]>([]);
  readonly entities = this.entitiesSignal.asReadonly();

  getAll(): Observable<MyEntity[]> {
    return this.http.get<MyEntity[]>(this.apiUrl).pipe(
      tap(entities => this.entitiesSignal.set(entities))
    );
  }

  getById(id: string): Observable<MyEntity> {
    return this.http.get<MyEntity>(`${this.apiUrl}/${id}`);
  }

  create(entity: Partial<MyEntity>): Observable<MyEntity> {
    return this.http.post<MyEntity>(this.apiUrl, entity);
  }

  update(id: string, entity: Partial<MyEntity>): Observable<MyEntity> {
    return this.http.put<MyEntity>(`${this.apiUrl}/${id}`, entity);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### 3. Add a New Guard

```bash
# Generate guard
ng generate guard core/guards/my-guard --functional

# Implement guard logic
export const myGuard: CanActivateFn = (route, state) => {
  const service = inject(MyService);
  const router = inject(Router);

  if (service.checkCondition()) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};

# Use in routes
{
  path: 'protected',
  component: ProtectedComponent,
  canActivate: [authGuard, myGuard]
}
```

### 4. Add Translations

```json
// src/assets/i18n/pt-BR.json
{
  "myFeature": {
    "title": "Meu Recurso",
    "description": "Descrição do recurso",
    "actions": {
      "save": "Salvar",
      "cancel": "Cancelar"
    }
  }
}

// src/assets/i18n/en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Feature description",
    "actions": {
      "save": "Save",
      "cancel": "Cancel"
    }
  }
}
```

**Usage in templates**:
```html
<h1>{{ 'myFeature.title' | transloco }}</h1>
<p>{{ 'myFeature.description' | transloco }}</p>
<p-button [label]="'myFeature.actions.save' | transloco" />
```

**Usage in components**:
```typescript
private translocoService = inject(TranslocoService);

getTitle(): string {
  return this.translocoService.translate('myFeature.title');
}
```

### 5. Add a New Model/Interface

```typescript
// src/app/core/models/my-entity.model.ts
export interface MyEntity {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
}

export interface MyEntityCreateDto {
  name: string;
  description: string;
}

export interface MyEntityUpdateDto {
  name?: string;
  description?: string;
}

export interface MyEntitiesResponse {
  data: MyEntity[];
  total: number;
  page: number;
  limit: number;
}
```

### 6. Add a Global Directive

```bash
# Generate directive
ng generate directive core/directives/my-directive --standalone

# Implement directive
@Directive({
  selector: '[appMyDirective]',
  standalone: true
})
export class MyDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input() appMyDirective: string = '';

  ngOnInit() {
    this.renderer.addClass(this.el.nativeElement, 'my-class');
  }
}

# Use in templates
<div appMyDirective="value">Content</div>
```

### 7. Handle Forms

```typescript
export class MyFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    description: ['']
  });

  onSubmit() {
    if (this.form.valid) {
      const value = this.form.value;
      // Handle form submission
    }
  }
}
```

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <input pInputText formControlName="name" />
  @if (form.controls.name.invalid && form.controls.name.touched) {
    <small class="p-error">Name is required</small>
  }

  <input pInputText formControlName="email" type="email" />

  <textarea pInputTextarea formControlName="description"></textarea>

  <p-button type="submit" label="Submit" [disabled]="form.invalid" />
</form>
```

---

## Important Notes for AI Assistants

### ⚠️ CRITICAL DO's and DON'Ts

#### ✅ ALWAYS DO

1. **Read files before modifying**
   - NEVER propose changes to code you haven't read
   - Use `Read` tool to understand existing code first

2. **Use standalone components**
   - All new components MUST be standalone
   - Include `standalone: true` in `@Component` decorator
   - Declare dependencies in `imports: []` array

3. **Use modern Angular patterns**
   - Signals for state: `signal()`, `computed()`, `effect()`
   - New control flow: `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)
   - Functional guards: `CanActivateFn` (not class-based)
   - `inject()` for dependency injection

4. **Follow strict TypeScript**
   - Always provide types for variables, parameters, return values
   - Never use `any` type
   - Use interfaces for data models

5. **Use translation system**
   - All user-facing text must use Transloco
   - Add translations to all three language files (pt-BR, en, es)
   - Use `{{ 'key' | transloco }}` in templates

6. **Test your changes**
   - Run `npm test` for unit tests
   - Run `npm run test:e2e` for E2E tests
   - Ensure tests pass before committing

7. **Follow naming conventions**
   - Component selectors: `app-` prefix
   - File names: `kebab-case` with appropriate suffix
   - Class names: `PascalCase` with suffix (Component, Service, etc.)
   - Variables/functions: `camelCase`

8. **Use design tokens**
   - Use CSS variables from `design-tokens.css`
   - Use Tailwind utility classes
   - Use PrimeNG theme tokens

#### ❌ NEVER DO

1. **Don't use NgModules**
   - This project is 100% standalone components
   - Never create `@NgModule` decorators

2. **Don't use old Angular patterns**
   - ❌ `*ngIf`, `*ngFor`, `*ngSwitch` (use `@if`, `@for`, `@switch`)
   - ❌ Class-based guards (use functional guards)
   - ❌ Class-based interceptors (use functional interceptors)

3. **Don't mutate signals directly**
   - ❌ `this.booksSignal()[0].title = 'New'`
   - ✅ `this.booksSignal.update(books => ...)`

4. **Don't hardcode text**
   - ❌ `<h1>Welcome</h1>`
   - ✅ `<h1>{{ 'welcome.title' | transloco }}</h1>`

5. **Don't skip error handling**
   - Always handle HTTP errors
   - Always validate form inputs
   - Always check for null/undefined

6. **Don't commit without testing**
   - Run tests before creating commits
   - Ensure build succeeds: `npm run build`

7. **Don't use zone.js patterns**
   - This app is zoneless
   - Rely on signals and explicit change detection
   - Avoid manual `ChangeDetectorRef` usage

### 🎯 Performance Considerations

1. **Lazy load everything**
   - All feature modules should be lazy-loaded
   - Use route-based code splitting

2. **Use OnPush or signals**
   - Prefer signals for state management
   - Components benefit from zoneless change detection

3. **Optimize images**
   - Use `appLazyImage` directive for lazy loading
   - Provide width/height attributes

4. **Minimize bundle size**
   - Import only what you need from libraries
   - Tree-shakeable imports: `import { X } from 'lib'`

### 🔒 Security Considerations

1. **Never expose secrets**
   - Don't commit API keys, tokens, or passwords
   - Use environment variables for sensitive data

2. **Validate user input**
   - Always validate forms on both client and server
   - Sanitize HTML content

3. **Handle authentication properly**
   - Use `authGuard` for protected routes
   - Check token expiration
   - Handle 401/403 responses

4. **CSRF protection**
   - HTTP interceptor handles token attachment
   - Backend should validate tokens

### 🐛 Debugging Tips

1. **Check browser console**
   - Look for errors in DevTools console
   - Check Network tab for API failures

2. **Use Angular DevTools**
   - Install Angular DevTools extension
   - Inspect component signals and state

3. **Enable source maps**
   - Development build includes source maps
   - Use debugger breakpoints in TypeScript

4. **Check auth state**
   - Verify token in localStorage/sessionStorage
   - Check `AuthService.isAuthenticated()`

### 📚 Helpful Resources

- **Angular Docs**: https://angular.dev
- **PrimeNG Docs**: https://primeng.org
- **Tailwind Docs**: https://tailwindcss.com
- **Transloco Docs**: https://jsverse.github.io/transloco
- **RxJS Docs**: https://rxjs.dev
- **Playwright Docs**: https://playwright.dev

### 🚀 Common Pitfalls

1. **Forgetting standalone: true**
   - All components must be standalone
   - Will cause compilation errors

2. **Not importing dependencies**
   - Standalone components must declare all imports
   - Common imports: `CommonModule`, `ReactiveFormsModule`, PrimeNG modules

3. **Signal update patterns**
   - Use `.set()` to replace entire value
   - Use `.update()` to modify based on previous value

4. **Route lazy loading syntax**
   - Use `loadChildren` with dynamic import
   - Return routes array, not module

5. **HTTP interceptor order**
   - Interceptors run in order provided
   - Auth interceptor should run first

---

## Brand & Theme

**Brand Name**: Livrya (not "Livria")
**Tagline**: Sistema de Narração de Livro

**Brand Colors**:
- **Primary** (Verde musgo): `#4F6F64`
- **Secondary** (Papel/Bege): `#B89A7F`
- **Accent** (Vinho): `#6B2E3A`

**Theme Configuration**: `src/livrya-theme.preset.ts`

**Design Tokens**: `src/design-tokens.css`

---

## Summary

This is a **modern, production-ready Angular 21 application** using:

- ✅ Standalone components architecture
- ✅ Zoneless change detection
- ✅ Signals-first state management
- ✅ Lazy-loaded feature modules
- ✅ Functional guards and interceptors
- ✅ Comprehensive testing (Karma + Playwright)
- ✅ Multi-language support (PT-BR, EN, ES)
- ✅ PrimeNG UI framework with custom theme
- ✅ Tailwind CSS for styling
- ✅ PWA capabilities
- ✅ Real-time features via Socket.io

**When making changes**:
1. Read existing code first
2. Follow established patterns
3. Use modern Angular features
4. Test thoroughly
5. Update translations if needed
6. Commit with descriptive messages

**For questions or issues**: Refer to this document or ask for clarification before making changes.

---

**Last Updated**: 2026-01-29
**Angular Version**: 21.1.1
**TypeScript Version**: 5.9.3
