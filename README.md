# BookChainsaw - Library Management System

Advanced library management system with AI-powered pull request reviews and GitHub Actions CI/CD.

## Features

### 📚 Core Features

- Book inventory management with search and filtering
- User management with membership tracking
- Employee management with role-based access
- Book issue/return system with fine calculation
- Dashboard with real-time metrics
- Point of Sale (POS) system for book transactions

### 🤖 AI-Powered Code Review

- Strict code quality checks (TypeScript, ESLint, Tests)
- Logical validation and analysis
- Security vulnerability detection
- Automated PR scoring (0-100)
- GitHub Actions integration
- Real-time feedback on pull requests

### 🔐 Technology Stack

- **Frontend**: Angular 21 (Standalone Components)
- **Language**: TypeScript 5.9 (Strict Mode)
- **Styling**: Tailwind CSS 4.1
- **State Management**: RxJS 7.8 with BehaviorSubjects
- **Testing**: Jasmine/Karma
- **Linting**: ESLint 9 with TypeScript plugin
- **Build**: esbuild (Angular CLI)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/jasveersingh-tz/book-chainsaw.git
cd book-chainsaw

# Install dependencies
npm install

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

## GitHub Actions CI/CD

This project includes automated GitHub Actions workflows:

### Available Workflows

1. **AI Code Review** - Automated code quality and security analysis
2. **Build & Test** - Continuous integration with multi-version testing
3. **Code Quality** - TypeScript and ESLint validation

### Setup Instructions

See [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) for:

- Workflow installation
- Branch protection rules
- Configuration options
- Troubleshooting

### Required Status Checks

Before merging PRs, all must pass:

- ✅ AI Code Review (Score ≥85)
- ✅ Build & Test (Node 18.x, 20.x)
- ✅ Code Quality (Lint, TypeScript strict)

## Development

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
