import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookIssue, Book, User } from '../../models/index';
import { BookIssueService } from '../../services/book-issue.service';
import { InventoryService } from '../../services/inventory.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pos.component.html',
})
export class PosComponent implements OnInit {
    public books: Book[] = [];
    public users: User[] = [];
    public bookIssues: BookIssue[] = [];
    public overdueBooks: BookIssue[] = [];

    public selectedBookId: string = '';
    public selectedUserId: string = '';

    public selectedBook: Book | undefined;
    public selectedUser: User | undefined;

    constructor(
        private bookIssueService: BookIssueService,
        private inventoryService: InventoryService,
        private userService: UserService,
        private authService: AuthService,
    ) { }

    public ngOnInit(): void {
        this.inventoryService.getBooks().subscribe((books) => {
            this.books = books;
        });

        this.userService.getUsers().subscribe((users) => {
            this.users = users;
        });

        this.bookIssueService.getBookIssues().subscribe((issues) => {
            this.bookIssues = issues;
            this.overdueBooks = this.bookIssueService.getOverdueBooks();
        });
    }

    public getAvailableBooks(): Book[] {
        return this.books.filter((book) => book.availableCopies > 0);
    }

    public getIssuedBooks(): BookIssue[] {
        return this.bookIssues.filter((issue) => issue.status === 'issued' || issue.status === 'overdue');
    }

    public onIssueBook(): void {
        if (!this.selectedUserId || !this.selectedBookId) {
            alert('Please select both a user and a book');
            return;
        }

        try {
            const employeeId = this.authService.currentEmployee?.id || 'unknown';
            this.bookIssueService.issueBook(this.selectedBookId, this.selectedUserId, employeeId);
            alert('Book issued successfully!');
            this.selectedBookId = '';
            this.selectedUserId = '';
            this.selectedBook = undefined;
            this.selectedUser = undefined;
        } catch (error) {
            alert('Error issuing book: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    public onReturnBook(issueId: string): void {
        try {
            const employeeId = this.authService.currentEmployee?.id || 'unknown';
            this.bookIssueService.returnBook(issueId, employeeId);
            alert('Book returned successfully!');
        } catch (error) {
            alert('Error returning book: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    public getBookTitle(bookId: string): string {
        return this.books.find((book) => book.id === bookId)?.title || 'Unknown Book';
    }

    public getUserName(userId: string): string {
        return this.users.find((user) => user.id === userId)?.username || 'Unknown User';
    }
}
