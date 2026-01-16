# Development Guide

## Setup

```bash
npm install
npm start  # http://localhost:4200
```

## Demo Credentials

| Role      | Email                 | Password     |
| --------- | --------------------- | ------------ |
| Admin     | admin@library.com     | admin123     |
| Librarian | librarian@library.com | librarian123 |
| Staff     | staff@library.com     | staff123     |

## Code Quality

```bash
npm run lint           # Check code quality
npm run lint:fix       # Auto-fix issues
npm test               # Run unit tests
npm run build          # Production build
```

### Enforced Rules

- No `any` types, explicit return types
- Strict equality (`===`), no unused vars
- Type-safe expressions, null/undefined handling
- Public/private/protected accessibility modifiers

## Architecture

**Services** - Business logic with RxJS observables
**Components** - UI with Bootstrap, standalone components
**Guards** - Route protection (`authGuard`)
**Models** - TypeScript interfaces in `models/index.ts`

## Adding Features

1. **Create model** in `src/app/models/index.ts`
2. **Create service** with RxJS BehaviorSubject
3. **Create component** with `ng generate component`
4. **Add route** in `app.routes.ts`
5. **Test** with `npm run lint` and `npm test`

## Project Structure

```
src/app/
├── components/
│   ├── dashboard/      # Metrics
│   ├── inventory/      # Book management
│   ├── users/          # Member management
│   ├── employees/      # Staff management
│   ├── book-issue/     # Issue/return
│   ├── pos/            # POS system
│   └── auth/           # Login
├── services/           # 7 services (auth, book, user, etc.)
├── models/             # TypeScript interfaces
├── guards/             # Route protection
└── app.routes.ts       # Routing config
```

## GitHub Actions Workflows

4 workflows run automatically on PR:

### 2. Create Service

Create `src/app/services/new-feature.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NewFeature } from '../models/index';

@Injectable({
  providedIn: 'root',
})
export class NewFeatureService {
  private itemsSubject: BehaviorSubject<NewFeature[]>;
  public items$: Observable<NewFeature[]>;

  constructor() {
    this.itemsSubject = new BehaviorSubject<NewFeature[]>([]);
    this.items$ = this.itemsSubject.asObservable();
  }

  public getItems(): Observable<NewFeature[]> {
    return this.items$;
  }

  // ... other methods
}
```

### 3. Create Component

Create `src/app/components/new-feature/new-feature.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewFeature } from '../../models/index';
import { NewFeatureService } from '../../services/new-feature.service';

@Component({
  selector: 'app-new-feature',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: ` <!-- Your template here --> `,
})
export class NewFeatureComponent implements OnInit {
  public items: NewFeature[] = [];

  constructor(private newFeatureService: NewFeatureService) {}

  public ngOnInit(): void {
    this.newFeatureService.getItems().subscribe((items) => {
      this.items = items;
    });
  }
}
```

### 4. Add Route

Update `src/app/app.routes.ts`:

```typescript
{
  path: 'new-feature',
  component: NewFeatureComponent,
  canActivate: [AuthGuard],
}
```

### 5. Update Layout

Add navigation link in `src/app/components/shared/layout.component.ts`

## Testing Guidelines

### Unit Tests

Create test files alongside components:

```typescript
// my-component.spec.ts
import { TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  let component: MyComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();

    component = TestBed.createComponent(MyComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Run Tests

```bash
npm test
```

## Backend Integration

### Replace Mock Data with API Calls

#### Example: User Service

```typescript
// Before: Mock data
private mockUsers: User[] = [...];

// After: API calls
constructor(private http: HttpClient) {}

public getUsers(): Observable<User[]> {
  return this.http.get<User[]>('/api/users');
}
```

### Add HttpClient

```typescript
// app.config.ts
import { HttpClientModule } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    HttpClientModule,
  ],
};
```

## Common Tasks

### Fix Lint Errors

```bash
npm run lint:fix
```

### Update a Service

1. Modify the service method
2. Run `npm run lint` to check
3. Update any dependent components
4. Test the feature

### Add Authentication Header

```typescript
// In a service
import { HttpClient, HttpHeaders } from '@angular/common/http';

private getHeaders(): HttpHeaders {
  const token = localStorage.getItem('token');
  return new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });
}
```

## Performance Tips

### 1. OnPush Change Detection

```typescript
@Component({
  // ...
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### 2. Unsubscribe Pattern

```typescript
import { Subscription } from 'rxjs';

export class MyComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();

  ngOnInit(): void {
    this.subscription = this.myService.getData().subscribe((data) => this.handleData(data));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
```

### 3. Async Pipe

```typescript
<!-- In template -->
<div *ngIf="items$ | async as items">
  <!-- items are automatically unsubscribed -->
</div>
```

## Debugging

### Enable Debug Logging

```typescript
// In service
private log(message: string): void {
  console.log(`[ServiceName] ${message}`);
}
```

### Use Browser DevTools

- Open Developer Tools (F12)
- Console tab for errors
- Network tab for API calls
- Application tab for localStorage

### Angular DevTools

Chrome Extension for Angular debugging:

1. Install Angular DevTools
2. Open DevTools
3. Navigate to "Angular" tab

## Deployment

### Build for Production

```bash
npm run build
```

Output goes to `dist/book-chainsaw/`

### Environment Configuration

Create `environment.ts` and `environment.prod.ts`:

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.library.com',
};
```

### Use in Service

```typescript
import { environment } from '../../environments/environment';

const apiUrl = `${environment.apiUrl}/users`;
```

## Git Workflow

### Branch Naming

```
feature/feature-name
bugfix/bug-name
chore/maintenance-task
docs/documentation-update
```

### Commit Messages

```
feat: Add book inventory management
fix: Resolve book availability update issue
docs: Update README with setup instructions
style: Format code according to eslint rules
```

### Before Push

1. Run linter: `npm run lint:fix`
2. Run tests: `npm test`
3. Verify features work locally
4. Create descriptive PR

## Troubleshooting

### Module not found error

```bash
npm install
```

### TypeScript errors

Run type check:

1. **build-test.yml** - Build, lint, test (must pass to merge)
2. **code-quality.yml** - TypeScript strict + security checks
3. **ai-code-review.yml** - AI-powered PR scoring (0-100)
4. **sonarqube-analysis.yml** - Quality metrics tracking

All workflows trigger on PR and run: `npm install → npm rebuild → npm run lint → npm run build`

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with proper TypeScript types
3. Run `npm run lint:fix` before commit
4. Push and create PR - workflows run automatically
5. Fix any workflow failures before merge

## Troubleshooting

**Port in use:** `ng serve --port 4201`  
**Lint errors:** `npm run lint:fix`  
**Type errors:** `npx tsc --noEmit`  
**Build fails:** `rm -rf .angular/ && npm run build`  
**Dependencies broken:** `rm -rf node_modules package-lock.json && npm install`
