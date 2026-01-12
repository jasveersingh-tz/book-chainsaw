import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/index';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
    public users: User[] = [];
    public searchTerm: string = '';
    public showAddForm: boolean = false;

    public newUser: Omit<User, 'id'> = {
        username: '',
        email: '',
        phone: '',
        address: '',
        membershipDate: new Date(),
        status: 'active',
        borrowedBooks: [],
        totalBooksBorrowed: 0,
    };

    constructor(private userService: UserService) { }

    public ngOnInit(): void {
        this.userService.getUsers().subscribe((users) => {
            this.users = users;
        });
    }

    public getFilteredUsers(): User[] {
        if (!this.searchTerm) {
            return this.users;
        }

        const term = this.searchTerm.toLowerCase();
        return this.users.filter(
            (user) =>
                user.username.toLowerCase().includes(term) || user.email.toLowerCase().includes(term),
        );
    }

    public onAddUser(): void {
        if (this.newUser.username && this.newUser.email && this.newUser.phone) {
            this.userService.addUser(this.newUser);

            this.newUser = {
                username: '',
                email: '',
                phone: '',
                address: '',
                membershipDate: new Date(),
                status: 'active',
                borrowedBooks: [],
                totalBooksBorrowed: 0,
            };

            this.showAddForm = false;
        }
    }

    public onSuspendUser(id: string): void {
        this.userService.suspendUser(id);
    }

    public onActivateUser(id: string): void {
        this.userService.activateUser(id);
    }

    public onDeleteUser(id: string): void {
        if (confirm('Are you sure you want to delete this user?')) {
            this.userService.deleteUser(id);
        }
    }

    public toggleAddForm(): void {
        this.showAddForm = !this.showAddForm;
    }
}
