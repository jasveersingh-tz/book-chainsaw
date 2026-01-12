import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/index';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private usersSubject: BehaviorSubject<User[]>;
    public users$: Observable<User[]>;

    private mockUsers: User[] = [
        {
            id: '1',
            username: 'john_doe',
            email: 'john@example.com',
            phone: '9876543210',
            address: '123 Main St, City',
            membershipDate: new Date('2022-01-15'),
            status: 'active',
            borrowedBooks: ['1', '2'],
            totalBooksBorrowed: 12,
        },
        {
            id: '2',
            username: 'jane_smith',
            email: 'jane@example.com',
            phone: '9876543211',
            address: '456 Oak Ave, Town',
            membershipDate: new Date('2021-06-20'),
            status: 'active',
            borrowedBooks: ['3'],
            totalBooksBorrowed: 8,
        },
        {
            id: '3',
            username: 'alice_wonder',
            email: 'alice@example.com',
            phone: '9876543212',
            address: '789 Elm Rd, Village',
            membershipDate: new Date('2023-03-10'),
            status: 'suspended',
            borrowedBooks: [],
            totalBooksBorrowed: 3,
        },
    ];

    constructor() {
        this.usersSubject = new BehaviorSubject<User[]>(this.mockUsers);
        this.users$ = this.usersSubject.asObservable();
    }

    public getUsers(): Observable<User[]> {
        return this.users$;
    }

    public getUserById(id: string): User | undefined {
        return this.mockUsers.find((user) => user.id === id);
    }

    public addUser(user: Omit<User, 'id'>): void {
        const newUser: User = {
            ...user,
            id: Date.now().toString(),
        };
        this.mockUsers.push(newUser);
        this.usersSubject.next([...this.mockUsers]);
    }

    public updateUser(id: string, updatedUser: Partial<User>): void {
        const index = this.mockUsers.findIndex((user) => user.id === id);
        if (index !== -1) {
            this.mockUsers[index] = { ...this.mockUsers[index], ...updatedUser };
            this.usersSubject.next([...this.mockUsers]);
        }
    }

    public deleteUser(id: string): void {
        this.mockUsers = this.mockUsers.filter((user) => user.id !== id);
        this.usersSubject.next([...this.mockUsers]);
    }

    public suspendUser(id: string): void {
        this.updateUser(id, { status: 'suspended' });
    }

    public activateUser(id: string): void {
        this.updateUser(id, { status: 'active' });
    }
}
