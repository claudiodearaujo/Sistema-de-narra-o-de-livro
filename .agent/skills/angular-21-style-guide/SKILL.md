---
description: Angular 21 official style guide, best practices, and coding standards
---

# Angular 21 - Guia Oficial de Estilo e Best Practices

Baseado na documentação oficial do Angular 21 (angular.dev) e style guide.

---

## I. Arquitetura e Estrutura

### Standalone Components
Angular 21 usa **standalone components por padrão**. NgModules são opcionais.

```typescript
@Component({
  selector: 'app-hero-list',
  standalone: true,  // ✅ Padrão
  imports: [CommonModule, HeroCardComponent],
  templateUrl: './hero-list.component.html'
})
export class HeroListComponent {}
```

### Single Responsibility Principle (SRP)
- **Uma coisa por arquivo**
- Máximo **400 linhas** por arquivo
- Máximo **75 linhas** por função

### Convenções de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componente | `feature.component.ts` | `hero-list.component.ts` |
| Service | `feature.service.ts` | `hero.service.ts` |
| Directive | `feature.directive.ts` | `highlight.directive.ts` |
| Pipe | `feature.pipe.ts` | `capitalize.pipe.ts` |
| Guard | `feature.guard.ts` | `auth.guard.ts` |
| Resolver | `feature.resolver.ts` | `hero.resolver.ts` |

### Estrutura de Pastas

```
src/app/
├── core/           # Services singleton, guards, interceptors
├── shared/         # Componentes, pipes, directives reutilizáveis
├── features/       # Módulos de feature
│   ├── heroes/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── heroes.routes.ts
│   └── dashboard/
└── app.routes.ts
```

---

## II. Signals e State Management

### ✅ Usar Signals para Estado
```typescript
// Estado local
count = signal(0);

// Estado derivado
doubleCount = computed(() => this.count() * 2);

// Atualizar
this.count.set(5);
this.count.update(c => c + 1);
```

### ❌ NÃO usar `mutate()` - use `set()` ou `update()`

### ❌ NÃO usar `effect()` para propagar estado
```typescript
// ❌ ERRADO
effect(() => {
  this.otherSignal.set(this.mySignal() * 2);
});

// ✅ CORRETO - use computed
otherSignal = computed(() => this.mySignal() * 2);
```

### Inputs e Outputs Funcionais
```typescript
// Angular 21 - Sintaxe moderna
export class HeroComponent {
  hero = input.required<Hero>();        // ✅ Input obrigatório
  optional = input<string>('default');  // ✅ Input opcional
  selected = output<Hero>();            // ✅ Output

  // Antigo - ainda funciona mas prefira signals
  // @Input() hero!: Hero;
  // @Output() selected = new EventEmitter<Hero>();
}
```

---

## III. Template Guidelines

### Control Flow Moderno (Angular 21)
```html
<!-- ❌ ANTIGO (ainda funciona) -->
<div *ngIf="condition">...</div>
<div *ngFor="let item of items">...</div>

<!-- ✅ NOVO - Prefira esta sintaxe -->
@if (condition) {
  <div>...</div>
}

@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <div>Nenhum item</div>
}

@switch (value) {
  @case ('A') { <div>A</div> }
  @case ('B') { <div>B</div> }
  @default { <div>Default</div> }
}
```

### ❌ Evitar `ngClass` e `ngStyle`
```html
<!-- ❌ EVITAR -->
<div [ngClass]="{'active': isActive, 'disabled': isDisabled}"></div>
<div [ngStyle]="{'color': textColor}"></div>

<!-- ✅ PREFERIR -->
<div [class.active]="isActive" [class.disabled]="isDisabled"></div>
<div [style.color]="textColor"></div>
```

### Async Pipe
```html
<!-- ✅ Gerencia subscription automaticamente -->
@if (heroes$ | async; as heroes) {
  @for (hero of heroes; track hero.id) {
    <app-hero-card [hero]="hero" />
  }
}
```

---

## IV. Performance

### OnPush Change Detection
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,  // ✅ Sempre usar
  // ...
})
```

### Lazy Loading
```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'heroes',
    loadComponent: () => import('./features/heroes/heroes.component')
      .then(m => m.HeroesComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes')
      .then(m => m.ADMIN_ROUTES)
  }
];
```

### NgOptimizedImage
```html
<!-- ✅ Otimização automática de imagens -->
<img ngSrc="/hero.jpg" width="400" height="300" priority />
```

### Zoneless (Angular 21)
```typescript
// main.ts - Aplicação sem zone.js
bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection()  // ✅ Melhor performance
  ]
});
```

---

## V. Services e Dependency Injection

### `inject()` Function (Preferido)
```typescript
// ✅ Angular 21 - Preferido
export class HeroService {
  private http = inject(HttpClient);
  private router = inject(Router);
}

// ❌ Antigo - ainda funciona
export class HeroService {
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}
}
```

### HttpClient (Providido por Padrão em Angular 21)
```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // provideHttpClient() - NÃO é mais necessário em Angular 21!
  ]
};
```

### Single-Purpose Services
```typescript
// ✅ Uma responsabilidade
@Injectable({ providedIn: 'root' })
export class HeroDataService {
  private http = inject(HttpClient);
  
  getHeroes() { /* ... */ }
  getHero(id: string) { /* ... */ }
}

// ❌ EVITAR - múltiplas responsabilidades
export class HeroService {
  // dados + validação + formatação = muito complexo
}
```

---

## VI. TypeScript Best Practices

### Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true  // ✅ Sempre ativar
  }
}
```

### Type Safety
```typescript
// ❌ EVITAR
const data: any = getData();

// ✅ PREFERIR
const data: unknown = getData();
if (isHero(data)) {
  // type narrowing
}
```

### Constantes
```typescript
const API_URL = 'https://api.example.com';  // ✅ const
let counter = 0;                             // ✅ let apenas quando necessário
// var x = 1;                                // ❌ NUNCA usar var
```

### Exports
```typescript
// ✅ Named exports - preferido
export { HeroService };
export { HeroComponent };

// ❌ Default exports - evitar
export default class HeroService {}
```

---

## VII. Testing (Angular 21)

### Vitest (Padrão em novos projetos)
```bash
ng test  # Usa Vitest + jsdom por padrão
```

### TestBed
```typescript
describe('HeroComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HeroComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

### Component Harnesses (CDK)
```typescript
// ✅ Preferir harnesses para interações DOM
const loader = TestbedHarnessEnvironment.loader(fixture);
const button = await loader.getHarness(MatButtonHarness);
await button.click();
```

---

## VIII. Checklist de Code Review

- [ ] Componente usa `standalone: true`?
- [ ] Usa `ChangeDetectionStrategy.OnPush`?
- [ ] Estado gerenciado com Signals (`signal()`, `computed()`)?
- [ ] Inputs/Outputs usam funções (`input()`, `output()`)?
- [ ] Template usa `@if`, `@for` em vez de `*ngIf`, `*ngFor`?
- [ ] Services usam `inject()` em vez de constructor?
- [ ] Rotas lazy usam `loadComponent()`?
- [ ] Evitou `ngClass` e `ngStyle`?
- [ ] Arquivo tem menos de 400 linhas?
- [ ] Funções têm menos de 75 linhas?
