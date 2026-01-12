import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Book } from '../models/index';

@Injectable({
    providedIn: 'root',
})
export class InventoryService {
    private booksSubject: BehaviorSubject<Book[]>;
    public books$: Observable<Book[]>;

    private mockBooks: Book[] = [
        {
            id: '1',
            isbn: '978-0-13-110362-7',
            title: 'The C Programming Language',
            author: 'Brian W. Kernighan, Dennis M. Ritchie',
            publisher: 'Prentice Hall',
            publishYear: 1988,
            category: 'Programming',
            totalCopies: 5,
            availableCopies: 3,
            shelfLocation: 'A1-001',
            description: 'A comprehensive guide to C programming',
            price: 1200,
        },
        {
            id: '2',
            isbn: '978-0-201-61622-4',
            title: 'The Design Patterns',
            author: 'Gang of Four',
            publisher: 'Addison-Wesley',
            publishYear: 1994,
            category: 'Software Design',
            totalCopies: 4,
            availableCopies: 2,
            shelfLocation: 'A2-005',
            description: 'Elements of Reusable Object-Oriented Software',
            price: 1500,
        },
        {
            id: '3',
            isbn: '978-0-596-00712-6',
            title: 'Learning Angular.js',
            author: 'Brad Green, Shyam Seshadri',
            publisher: 'O\'Reilly Media',
            publishYear: 2013,
            category: 'Web Development',
            totalCopies: 3,
            availableCopies: 1,
            shelfLocation: 'B1-010',
            description: 'Build dynamic web applications with Angular',
            price: 1000,
        },
        {
            id: '4',
            isbn: '978-1-491-95435-0',
            title: 'You Don\'t Know JS',
            author: 'Kyle Simpson',
            publisher: 'O\'Reilly Media',
            publishYear: 2014,
            category: 'JavaScript',
            totalCopies: 6,
            availableCopies: 4,
            shelfLocation: 'B2-015',
            description: 'A deep dive into JavaScript fundamentals',
            price: 800,
        },
        {
            id: '5',
            isbn: '978-0-062-69129-0',
            title: 'Atomic Habits',
            author: 'James Clear',
            publisher: 'Avery',
            publishYear: 2018,
            category: 'Self-Help',
            totalCopies: 7,
            availableCopies: 5,
            shelfLocation: 'C1-020',
            description: 'An easy and proven way to build good habits',
            price: 950,
        },
    ];

    constructor() {
        this.booksSubject = new BehaviorSubject<Book[]>(this.mockBooks);
        this.books$ = this.booksSubject.asObservable();
    }

    public getBooks(): Observable<Book[]> {
        return this.books$;
    }

    public getBookById(id: string): Book | undefined {
        return this.mockBooks.find((book) => book.id === id);
    }

    public addBook(book: Omit<Book, 'id'>): void {
        const newBook: Book = {
            ...book,
            id: Date.now().toString(),
        };
        this.mockBooks.push(newBook);
        this.booksSubject.next([...this.mockBooks]);
    }

    public updateBook(id: string, updatedBook: Partial<Book>): void {
        const index = this.mockBooks.findIndex((book) => book.id === id);
        if (index !== -1) {
            this.mockBooks[index] = { ...this.mockBooks[index], ...updatedBook };
            this.booksSubject.next([...this.mockBooks]);
        }
    }

    public deleteBook(id: string): void {
        this.mockBooks = this.mockBooks.filter((book) => book.id !== id);
        this.booksSubject.next([...this.mockBooks]);
    }

    public decreaseAvailableCopies(id: string): void {
        const book = this.getBookById(id);
        if (book && book.availableCopies > 0) {
            this.updateBook(id, { availableCopies: book.availableCopies - 1 });
        }
    }

    public increaseAvailableCopies(id: string): void {
        const book = this.getBookById(id);
        if (book && book.availableCopies < book.totalCopies) {
            this.updateBook(id, { availableCopies: book.availableCopies + 1 });
        }
    }
}
