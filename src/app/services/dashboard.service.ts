import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { Dashboard } from '../models/index';
import { InventoryService } from './inventory.service';
import { UserService } from './user.service';
import { EmployeeService } from './employee.service';
import { BookIssueService } from './book-issue.service';

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    constructor(
        private inventoryService: InventoryService,
        private userService: UserService,
        private employeeService: EmployeeService,
        private bookIssueService: BookIssueService,
    ) { }

    public getDashboardData(): Observable<Dashboard> {
        return combineLatest([
            this.inventoryService.getBooks(),
            this.userService.getUsers(),
            this.employeeService.getEmployees(),
            this.bookIssueService.getBookIssues(),
        ]).pipe(
            map(([books, users, employees, bookIssues]) => {
                const totalBooks = books.reduce((sum, book) => sum + book.totalCopies, 0);
                const booksIssued = bookIssues.filter((issue) => issue.status === 'issued').length;
                const booksOverdue = this.bookIssueService.getOverdueBooks().length;
                const activeLoans = bookIssues.filter((issue) => issue.status === 'issued').length;

                let revenue = 0;
                bookIssues.forEach((issue) => {
                    if (issue.fineAmount) {
                        revenue += issue.fineAmount;
                    }
                });

                return {
                    totalBooks,
                    totalUsers: users.length,
                    totalEmployees: employees.length,
                    booksIssued,
                    booksOverdue,
                    revenue,
                    activeLoans,
                };
            }),
        );
    }
}
