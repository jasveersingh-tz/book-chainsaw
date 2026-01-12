export interface User {
    id: string;
    username: string;
    email: string;
    phone: string;
    address: string;
    membershipDate: Date;
    status: 'active' | 'inactive' | 'suspended';
    borrowedBooks: string[];
    totalBooksBorrowed: number;
}

export interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string;
    employeeId: string;
    role: 'admin' | 'librarian' | 'staff';
    department: string;
    joinDate: Date;
    salary: number;
    status: 'active' | 'inactive';
    password: string;
}

export interface Book {
    id: string;
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    publishYear: number;
    category: string;
    totalCopies: number;
    availableCopies: number;
    shelfLocation: string;
    description: string;
    price: number;
}

export interface BookIssue {
    id: string;
    bookId: string;
    userId: string;
    issueDate: Date;
    dueDate: Date;
    returnDate?: Date;
    status: 'issued' | 'returned' | 'overdue';
    issuedBy: string;
    fineAmount?: number;
}

export interface PullRequest {
    id: string;
    title: string;
    description: string;
    branch: string;
    author: string;
    status: 'pending' | 'approved' | 'rejected';
    lintScore: number;
    testsPassed: boolean;
    codeReviewComments: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Dashboard {
    totalBooks: number;
    totalUsers: number;
    totalEmployees: number;
    booksIssued: number;
    booksOverdue: number;
    revenue: number;
    activeLoans: number;
}
