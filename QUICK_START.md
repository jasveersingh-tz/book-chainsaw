# Quick Start Guide 🚀

## Get Started in 3 Minutes

### 1. Install Dependencies

```bash
cd book-chainsaw
npm install
```

### 2. Start the Application

```bash
npm start
```

### 3. Login with Demo Credentials

The app opens at `http://localhost:4200`

| Role      | Email                 | Password     |
| --------- | --------------------- | ------------ |
| Admin     | admin@library.com     | admin123     |
| Librarian | librarian@library.com | librarian123 |
| Staff     | staff@library.com     | staff123     |

## Main Features at a Glance

### 📊 Dashboard

See key metrics: total books, users, employees, active loans, and overdue books.

### 📦 Inventory Management

- Add/delete books
- Search by title or author
- Track available copies
- View pricing

### 👥 User Management

- Add library members
- Manage statuses (active, suspended)
- Track borrowing history

### 💼 Employee Management

- Manage staff
- Assign roles (Admin, Librarian, Staff)
- Set salaries
- Track departments

### 🛒 Book POS

- Issue books to users
- Track due dates (14 days default)
- Return books
- Auto-calculate fines (₹10/day overdue)

### 🔍 PR Auto-Review

- Submit pull requests
- Automatic evaluation (lint score ≥90, tests passing)
- Manual review capability
- Track PR status

## Code Quality

All code follows strict rules:

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

## Available Commands

```bash
npm start             # Development server (port 4200)
npm run build         # Production build
npm run watch         # Watch mode
npm test              # Run tests
npm run lint          # Check linting
npm run lint:fix      # Fix linting issues
```

## Project Structure

```
src/app/
├── models/           # Data types
├── services/         # Business logic (7 services)
├── components/       # UI components (8 components)
├── guards/           # Route protection
└── utils/            # Utilities
```

## Key Files Modified

- ✅ `app.routes.ts` - Added all routes
- ✅ `app.ts` - Updated main component
- ✅ `package.json` - Added lint scripts
- ✅ `eslint.config.mjs` - Configured strict rules

## Next Steps

1. **Explore the Dashboard**: See real-time statistics
2. **Add Books**: Go to Inventory → Add Book
3. **Register Users**: Go to Users → Add User
4. **Test POS**: Go to POS → Issue a book
5. **Review Code Quality**: Run `npm run lint`

## Documentation

- **LIBRARY_FEATURES.md** - Complete feature guide
- **DEVELOPMENT.md** - Developer guide
- **IMPLEMENTATION_SUMMARY.md** - Technical overview

## Troubleshooting

**Port 4200 already in use?**

```bash
ng serve --port 4201
```

**Linting errors?**

```bash
npm run lint:fix
```

**Need to reinstall?**

```bash
rm -rf node_modules package-lock.json
npm install
```

## Key Technologies

- **Angular 21** - Framework
- **TypeScript 5.9** - Language
- **Tailwind CSS 4.1** - Styling
- **RxJS 7.8** - Reactive programming
- **ESLint 9** - Code quality

## Demo Features

### Included Sample Data

- ✅ 5 books in inventory
- ✅ 3 sample users
- ✅ 3 employees with different roles
- ✅ 3 sample book transactions
- ✅ 3 pull requests for review

### Auto-Calculations

- Fine calculation: 10 × days overdue
- Loan period: 14 days
- Due date: Auto-set on issue
- Inventory: Auto-updated on issue/return

## Testing the PR Auto-Review

1. Go to **PR Review** section
2. Submit a PR with:
   - **Lint Score 95** → ✅ Auto-approved
   - **Tests Passing** ✓
3. Submit a PR with:
   - **Lint Score 75** → ❌ Auto-rejected
   - Reason: Below threshold
4. Submit pending PR → Use manual review

## Performance Optimizations Included

- Standalone components (faster compilation)
- Reactive data streams (RxJS)
- Tailwind CSS (optimized styling)
- Strict type checking

## Need Help?

1. Check `DEVELOPMENT.md` for detailed guide
2. Run `npm run lint:fix` to auto-fix code issues
3. Check browser console for errors (F12)
4. Review service implementations for business logic

---

**Ready to code?** Start with `npm start` and begin exploring! 🎉
