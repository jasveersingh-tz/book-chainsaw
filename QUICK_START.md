# Quick Start Guide 🚀

## Setup (1 minute)

```bash
npm install
npm start  # Opens at http://localhost:4200
```

## Demo Credentials

| Role      | Email                 | Password     |
| --------- | --------------------- | ------------ |
| Admin     | admin@library.com     | admin123     |
| Librarian | librarian@library.com | librarian123 |
| Staff     | staff@library.com     | staff123     |

## Main Features

- **Dashboard** - Metrics and recent activities
- **Books** - Add/edit/search books, manage inventory
- **Users** - Manage library members
- **Employees** - Staff management with roles
- **Issue/Return** - Book lending with auto fine calculation (₹10/day)
- **POS** - Quick book transactions

## Common Commands

```bash
npm start              # Start dev server
npm run build          # Production build
npm run lint           # Check code quality
npm test               # Run unit tests
npm run lint:fix       # Auto-fix lint issues
```

## Project Structure

```
src/app/
├── components/        # UI (dashboard, books, users, employees, pos, auth)
├── services/          # Business logic (7 services)
├── models/            # TypeScript interfaces
├── guards/            # Route protection
└── app.routes.ts      # Routing
```

## Troubleshooting

**Port in use?** `ng serve --port 4201`  
**Linting errors?** `npm run lint:fix`  
**Dependencies broken?** `rm -rf node_modules package-lock.json && npm install`

See `DEVELOPMENT.md` for detailed documentation.
