# BookChainsaw - Library Management System

Modern library management system with automated code quality checks and GitHub Actions CI/CD.

## Features

- 📚 Book inventory, user management, employee management
- 💰 Book issue/return with fine calculation
- 📊 Dashboard with real-time metrics
- 🤖 AI-powered PR reviews with automated scoring
- ✅ GitHub Actions workflows (build, test, quality, SonarQube)

## Tech Stack

- Angular 21, TypeScript 5.5, Bootstrap 5.3
- RxJS, ESLint 9, Vitest

## Quick Start

```bash
git clone https://github.com/jasveersingh-tz/book-chainsaw.git
cd book-chainsaw
npm install
npm start  # Opens at http://localhost:4200

# Start development server
npm start
```

Visit `http://localhost:4200`

### Demo Credentials

**Admin Account**

- Email: `admin@library.com`
- Password: `admin123`

**Librarian Account**

- Email: `librarian@library.com`
- Password: `librarian123`

**Staff Account**

- Email: `staff@library.com`
- Password: `staff123`

## GitHub Actions CI/CD```

## Demo Login

| Role      | Email                 | Password     |
| --------- | --------------------- | ------------ |
| Admin     | admin@library.com     | admin123     |
| Librarian | librarian@library.com | librarian123 |
| Staff     | staff@library.com     | staff123     |

## Development

```bash
npm start           # Dev server at http://localhost:4200
npm run build       # Production build
npm run lint        # Run ESLint
npm test            # Run unit tests with Vitest
```

## GitHub Actions

4 automated workflows run on every PR:

1. **build-test.yml** - Build, lint, test (required to merge)
2. **code-quality.yml** - TypeScript strict + security checks
3. **ai-code-review.yml** - AI-powered PR review with scoring
4. **sonarqube-analysis.yml** - Code quality metrics tracking

See `DEVELOPMENT.md` for detailed setup and contribution guidelines.
