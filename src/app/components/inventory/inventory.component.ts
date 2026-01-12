import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Book } from '../../models/index';
import { InventoryService } from '../../services/inventory.service';

@Component({
    selector: 'app-inventory',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './inventory.component.html',
})
export class InventoryComponent implements OnInit {
    public books: Book[] = [];
    public searchTerm: string = '';
    public showAddForm: boolean = false;

    public newBook: Omit<Book, 'id'> = {
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

    constructor(private inventoryService: InventoryService) { }

    public ngOnInit(): void {
        this.inventoryService.getBooks().subscribe((books) => {
            this.books = books;
        });
    }

    public getFilteredBooks(): Book[] {
        if (!this.searchTerm) {
            return this.books;
        }

        const term = this.searchTerm.toLowerCase();
        return this.books.filter(
            (book) =>
                book.title.toLowerCase().includes(term) || book.author.toLowerCase().includes(term),
        );
    }

    public onAddBook(): void {
        if (this.newBook.title && this.newBook.author && this.newBook.isbn) {
            const bookToAdd: Omit<Book, 'id'> = {
                ...this.newBook,
                availableCopies: this.newBook.totalCopies,
            };
            this.inventoryService.addBook(bookToAdd);

            this.newBook = {
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

            this.showAddForm = false;
        }
    }

    public onDeleteBook(id: string): void {
        if (confirm('Are you sure you want to delete this book?')) {
            this.inventoryService.deleteBook(id);
        }
    }

    public toggleAddForm(): void {
        this.showAddForm = !this.showAddForm;
    }
}
