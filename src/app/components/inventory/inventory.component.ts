import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Book } from '../../models/index';
import { InventoryService } from '../../services/inventory.service';

interface NewBookForm extends Omit<Book, 'id'> {
    isbn: string;
    title: string;
    author: string;
}

@Component({
    selector: 'app-inventory',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './inventory.component.html',
})
export class InventoryComponent implements OnInit, OnDestroy {
    public books: Book[] = [];
    public searchTerm: string = '';
    public showAddForm: boolean = false;
    public errorMessage: string | null = null;
    private subscription: Subscription = new Subscription();

    public newBook: NewBookForm = this.getEmptyBookForm();

    constructor(private inventoryService: InventoryService) { }

    public ngOnInit(): void {
        this.loadBooks();
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    private loadBooks(): void {
        const sub = this.inventoryService.getBooks().subscribe({
            next: (books: Book[]) => {
                this.books = books;
                this.errorMessage = null;
            },
            error: (error: Error) => {
                this.errorMessage = 'Failed to load books. Please refresh the page.';
                console.error('Book loading error:', error);
            }
        });

        this.subscription.add(sub);
    }

    public getFilteredBooks(): Book[] {
        if (!this.searchTerm?.trim()) {
            return this.books;
        }

        const term = this.searchTerm.toLowerCase().trim();
        return this.books.filter(
            (book: Book) =>
                book.title?.toLowerCase().includes(term) ||
                book.author?.toLowerCase().includes(term) ||
                book.isbn?.toLowerCase().includes(term) ||
                book.category?.toLowerCase().includes(term),
        );
    }

    public onAddBook(): void {
        const validationError = this.validateBookForm();
        if (validationError) {
            this.errorMessage = validationError;
            return;
        }

        const bookToAdd: Omit<Book, 'id'> = {
            ...this.newBook,
            availableCopies: this.newBook.totalCopies,
            isbn: this.newBook.isbn.trim(),
            title: this.newBook.title.trim(),
            author: this.newBook.author.trim(),
        };

        this.inventoryService.addBook(bookToAdd);
        this.resetForm();
        this.showAddForm = false;
    }

    private validateBookForm(): string | null {
        if (!this.newBook.title?.trim()) {
            return 'Book title is required.';
        }

        if (!this.newBook.author?.trim()) {
            return 'Author name is required.';
        }

        if (!this.newBook.isbn?.trim()) {
            return 'ISBN is required.';
        }

        const isbnPattern = /^(?:\d{10}|\d{13})$/;
        if (!isbnPattern.test(this.newBook.isbn.replace(/-/g, ''))) {
            return 'ISBN must be 10 or 13 digits.';
        }

        if (this.newBook.totalCopies < 0) {
            return 'Total copies cannot be negative.';
        }

        if (this.newBook.price < 0) {
            return 'Price cannot be negative.';
        }

        const currentYear = new Date().getFullYear();
        if (this.newBook.publishYear < 1000 || this.newBook.publishYear > currentYear) {
            return `Publish year must be between 1000 and ${currentYear}.`;
        }

        return null;
    }

    private getEmptyBookForm(): NewBookForm {
        return {
            isbn: '',
            title: '',
            author: '',
            publisher: '',
            publishYear: new Date().getFullYear(),
            category: '',
            totalCopies: 0,
            availableCopies: 0,
            shelfLocation: '',
            description: '',
            price: 0,
        };
    }

    private resetForm(): void {
        this.newBook = this.getEmptyBookForm();
        this.errorMessage = null;
    }

    public onDeleteBook(id: string): void {
        if (!id) {
            this.errorMessage = 'Invalid book ID.';
            return;
        }

        const book = this.books.find((b: Book) => b.id === id);
        if (!book) {
            this.errorMessage = 'Book not found.';
            return;
        }

        const confirmMessage = `Are you sure you want to delete "${book.title}" by ${book.author}?`;
        if (confirm(confirmMessage)) {
            this.inventoryService.deleteBook(id);
            this.errorMessage = null;
        }
    }

    public toggleAddForm(): void {
        this.showAddForm = !this.showAddForm;
        if (!this.showAddForm) {
            this.resetForm();
        }
    }

    public clearSearch(): void {
        this.searchTerm = '';
    }
}
