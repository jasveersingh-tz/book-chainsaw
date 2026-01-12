# Library Management System - Book Chainsaw

A comprehensive Angular-based Library Management System with inventory management, user management, employee management, POS for book issuing, and automated PR review capabilities.

## Features

### 1. **Authentication & Employee Login**

- Employee login system with role-based access (Admin, Librarian, Staff)
- Secure session management
- Demo credentials for testing:
  - **Admin**: admin@library.com / admin123
  - **Librarian**: librarian@library.com / librarian123
  - **Staff**: staff@library.com / staff123

### 2. **Dashboard**

- Real-time statistics and metrics
- Total books, users, and employees count
- Active loans and overdue books tracking
- Revenue from fines collection
- System status overview

### 3. **Inventory Management**

- Add, edit, and delete books
- Track available copies
- Organize books by category and shelf location
- Search and filter capabilities
- Book pricing information

### 4. **User Management System**

- Register and manage library members
- Track user borrowing history
- User status management (active, inactive, suspended)
- View member details and contact information
- Membership date tracking

### 5. **Employee Management**

- Manage library staff
- Role-based employee classification
- Salary and department tracking
- Employee activation/deactivation
- Track employee information and join dates

### 6. **POS (Point of Sale) - Book Issuing**

- Issue books to users with automatic inventory updates
- Return books with automatic fine calculation
- Due date management (default 14 days)
- Overdue tracking with fine amount calculation
- Real-time availability checking
- Book and user detail panels

### 7. **Automated PR Review System**

- Automatic pull request evaluation
- Lint score validation (threshold: 90/100)
- Test status verification
- Automatic approval/rejection based on criteria
- Manual review capability for edge cases
- PR status tracking (pending, approved, rejected)

### Auto-Review Logic:

- **Approved if:**
  - Lint score ≥ 90
  - All tests passing
- **Rejected if:**
  - Lint score < 90
  - Tests failing

## Project Structure

```
src/app/
├── models/
│   └── index.ts                 # Core interfaces and types
├── services/
│   ├── auth.service.ts          # Authentication
│   ├── inventory.service.ts     # Book inventory
│   ├── user.service.ts          # User management
│   ├── employee.service.ts      # Employee management
│   ├── book-issue.service.ts    # Book issuing and returns
│   ├── pr-review.service.ts     # PR review automation
│   └── dashboard.service.ts     # Dashboard data aggregation
├── components/
│   ├── auth/
│   │   └── login.component.ts   # Login page
│   ├── dashboard/
│   │   └── dashboard.component.ts # Dashboard
│   ├── inventory/
│   │   └── inventory.component.ts # Inventory management
│   ├── users/
│   │   └── users.component.ts   # User management
│   ├── employees/
│   │   └── employees.component.ts # Employee management
│   ├── pos/
│   │   ├── pos.component.ts     # Book issuing POS
│   │   └── pr-review.component.ts # PR review interface
│   └── shared/
│       └── layout.component.ts  # Main layout
├── guards/
│   └── auth.guard.ts            # Route authentication guard
└── utils/
```

## Installation & Setup

### Prerequisites

- Node.js (v18+)
- npm (v10+)
- Angular CLI (v21+)

### Installation Steps

1. **Navigate to project directory:**

   ```bash
   cd book-chainsaw
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:4200`

## Available Scripts

```bash
# Start development server
npm start

# Build for production
npm build

# Watch mode (rebuild on changes)
npm run watch

# Run tests
npm test

# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Generate ESLint JSON report
npm run lint:check

# Run production SSR server
npm run serve:ssr:book-chainsaw
```

## Technology Stack

- **Framework**: Angular 21
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4.1
- **State Management**: RxJS
- **Linting**: ESLint 9 with TypeScript support
- **Testing**: Vitest
- **Build Tool**: Angular Build

## Usage Guide

### Login

1. Open the application
2. Enter credentials (use demo credentials above)
3. Click "Login"

### Dashboard

- View system statistics
- Monitor key metrics
- Check system status

### Inventory Management

- Click "Add Book" to add new books
- Search books by title or author
- View available copies
- Delete books as needed

### User Management

- Add new library members
- Suspend/activate users
- Manage membership details
- Track borrowing history

### Employee Management

- Add new employees
- Manage roles and departments
- Activate/deactivate employees
- Update salary information

### Book Issuing (POS)

- Select user and book
- Click "Issue Book"
- System automatically updates inventory
- Click "Return" to process returns
- Fine calculated automatically for overdue books

### PR Review

- Submit pull request with:
  - Title and description
  - Branch name
  - Lint score (0-100)
  - Test status
- System automatically reviews based on criteria
- Manual review available for pending PRs

## ESLint Configuration

The project includes strict ESLint rules:

- No `any` types allowed
- Explicit return types required
- Explicit member accessibility
- No unused variables
- Strict equality checks
- No implicit type coercion
- Nullish coalescing and optional chaining enforcement

Run `npm run lint` to check code quality.

## Data Management

All data is currently stored in-memory using RxJS BehaviorSubjects. For production, integrate with a backend API:

### Services to Update:

- `auth.service.ts` - Connect to authentication API
- `inventory.service.ts` - Connect to book database
- `user.service.ts` - Connect to user database
- `employee.service.ts` - Connect to employee database
- `book-issue.service.ts` - Connect to transaction database
- `pr-review.service.ts` - Connect to CI/CD pipeline

## Fine Calculation

- **Daily fine**: ₹10 per day
- **Formula**: `(Days Overdue) × ₹10`
- Calculated automatically on book return

## Role-Based Permissions

### Admin

- Full system access
- User and employee management
- System configuration

### Librarian

- Inventory management
- User management
- Book issuing/returns

### Staff

- Book issuing/returns
- User lookup
- Basic inventory view

## Future Enhancements

- [ ] Backend API integration
- [ ] Database integration
- [ ] Email notifications for overdue books
- [ ] Advanced reporting and analytics
- [ ] Barcode scanning for books
- [ ] Mobile app integration
- [ ] Payment gateway integration
- [ ] Member portal
- [ ] Reservation system
- [ ] Fine payment processing

## Troubleshooting

### Port 4200 already in use

```bash
ng serve --port 4201
```

### Clear node modules and reinstall

```bash
rm -r node_modules package-lock.json
npm install
```

### ESLint errors

```bash
npm run lint:fix
```

## Support & License

This is a demonstration project. For production use, ensure proper authentication, data validation, and backend integration.

## Contributors

Developed using Angular 21 and modern web technologies.
