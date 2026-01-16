import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Employee } from '../models/index';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private currentEmployeeSubject: BehaviorSubject<Employee | null>;
    public currentEmployee$: Observable<Employee | null>;
    private isAuthenticatedSubject: BehaviorSubject<boolean>;
    public isAuthenticated$: Observable<boolean>;

    constructor(@Inject(PLATFORM_ID) private platformId: object) {
        let storedEmployee: string | null = null;

        if (isPlatformBrowser(this.platformId)) {
            storedEmployee = localStorage.getItem('currentEmployee');
        }

        this.currentEmployeeSubject = new BehaviorSubject<Employee | null>(
            storedEmployee ? JSON.parse(storedEmployee) : null,
        );
        this.currentEmployee$ = this.currentEmployeeSubject.asObservable();

        this.isAuthenticatedSubject = new BehaviorSubject<boolean>(Boolean(storedEmployee));
        this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
    }

    public get currentEmployee(): Employee | null {
        return this.currentEmployeeSubject.value;
    }

    public get isAuthenticated(): boolean {
        return this.isAuthenticatedSubject.value;
    }

    public login(email: string, password: string): boolean {
        // Mock authentication - in production, call a real API
        const mockEmployees: Employee[] = [
            {
                id: '1',
                name: 'Admin User',
                email: 'admin@library.com',
                phone: '9876543210',
                employeeId: 'EMP001',
                role: 'admin',
                department: 'Administration',
                joinDate: new Date('2020-01-01'),
                salary: 50000,
                status: 'active',
                password: 'admin123',
            },
            {
                id: '2',
                name: 'Librarian User',
                email: 'librarian@library.com',
                phone: '9876543211',
                employeeId: 'EMP002',
                role: 'librarian',
                department: 'Library Services',
                joinDate: new Date('2021-06-15'),
                salary: 35000,
                status: 'active',
                password: 'librarian123',
            },
            {
                id: '3',
                name: 'Staff User',
                email: 'staff@library.com',
                phone: '9876543212',
                employeeId: 'EMP003',
                role: 'staff',
                department: 'Library Services',
                joinDate: new Date('2022-03-20'),
                salary: 25000,
                status: 'active',
                password: 'staff123',
            },
        ];

        const employee = mockEmployees.find((emp) => emp.email === email && emp.password === password);

        if (employee) {
            const { password: _, ...employeeWithoutPassword } = employee;
            this.currentEmployeeSubject.next(employeeWithoutPassword as Employee);
            this.isAuthenticatedSubject.next(true);
            if (isPlatformBrowser(this.platformId)) {
                localStorage.setItem('currentEmployee', JSON.stringify(employeeWithoutPassword));
            }
            return true;
        }

        return false;
    }

    public logout(): void {
        this.currentEmployeeSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('currentEmployee');
        }
    }
}
