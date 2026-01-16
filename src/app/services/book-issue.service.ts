import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BookIssue } from '../models/index';
import { InventoryService } from './inventory.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root',
})
export class BookIssueService {
    private bookIssuesSubject: BehaviorSubject<BookIssue[]>;
    public bookIssues$: Observable<BookIssue[]>;

    private mockBookIssues: BookIssue[] = [
        {
            id: '1',
            bookId: '1',
            userId: '1',
            issueDate: new Date('2024-01-01'),
            dueDate: new Date('2024-01-15'),
            returnDate: new Date('2024-01-14'),
            status: 'returned',
            issuedBy: '2',
        },
        {
            id: '2',
            bookId: '2',
            userId: '1',
            issueDate: new Date('2024-01-10'),
            dueDate: new Date('2024-01-24'),
            status: 'issued',
            issuedBy: '2',
        },
        {
            id: '3',
            bookId: '3',
            userId: '2',
            issueDate: new Date('2024-01-05'),
            dueDate: new Date('2024-01-19'),
            status: 'overdue',
            issuedBy: '2',
            fineAmount: 100,
        },
    ];

    constructor(
        private inventoryService: InventoryService,
        private userService: UserService,
    ) {
        this.bookIssuesSubject = new BehaviorSubject<BookIssue[]>(this.mockBookIssues);
        this.bookIssues$ = this.bookIssuesSubject.asObservable();
    }

    public getBookIssues(): Observable<BookIssue[]> {
        return this.bookIssues$;
    }

    public getBookIssueById(id: string): BookIssue | undefined {
        return this.mockBookIssues.find((issue) => issue.id === id);
    }

    public issueBook(bookId: string, userId: string, issuedBy: string): void {
        const book = this.inventoryService.getBookById(bookId);
        const user = this.userService.getUserById(userId);

        if (!book || !user || book.availableCopies === 0) {
            throw new Error('Cannot issue book: Book not available or user not found');
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const newIssue: BookIssue = {
            id: Date.now().toString(),
            bookId,
            userId,
            issueDate: new Date(),
            dueDate,
            status: 'issued',
            issuedBy,
        };

        this.mockBookIssues.push(newIssue);
        this.inventoryService.decreaseAvailableCopies(bookId);
        this.userService.updateUser(userId, {
            borrowedBooks: [...user.borrowedBooks, bookId],
            totalBooksBorrowed: user.totalBooksBorrowed + 1,
        });

        this.bookIssuesSubject.next([...this.mockBookIssues]);
    }

    public returnBook(issueId: string, _employeeId: string): void {
        const issue = this.getBookIssueById(issueId);
        if (!issue) {
            throw new Error('Book issue not found');
        }

        const fineAmount = this.calculateFine(issue);
        const updatedIssue: BookIssue = {
            ...issue,
            returnDate: new Date(),
            status: 'returned',
            fineAmount,
        };

        const index = this.mockBookIssues.findIndex((bi) => bi.id === issueId);
        if (index !== -1) {
            this.mockBookIssues[index] = updatedIssue;
        }

        const user = this.userService.getUserById(issue.userId);
        if (user) {
            const updatedBorrowedBooks = user.borrowedBooks.filter((bid) => bid !== issue.bookId);
            this.userService.updateUser(issue.userId, {
                borrowedBooks: updatedBorrowedBooks,
            });
        }

        this.inventoryService.increaseAvailableCopies(issue.bookId);
        this.bookIssuesSubject.next([...this.mockBookIssues]);
    }

    private calculateFine(issue: BookIssue): number {
        const today = new Date();
        if (today <= issue.dueDate) {
            return 0;
        }

        const daysOverdue = Math.floor((today.getTime() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const finePerDay = 10;

        return daysOverdue * finePerDay;
    }

    public getOverdueBooks(): BookIssue[] {
        const today = new Date();
        return this.mockBookIssues.filter(
            (issue) => issue.status === 'issued' && issue.dueDate < today,
        );
    }
}
