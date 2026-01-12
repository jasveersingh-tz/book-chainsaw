import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Employee } from '../models/index';

@Injectable({
    providedIn: 'root',
})
export class EmployeeService {
    private employeesSubject: BehaviorSubject<Employee[]>;
    public employees$: Observable<Employee[]>;

    private mockEmployees: Employee[] = [
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

    constructor() {
        this.employeesSubject = new BehaviorSubject<Employee[]>(this.mockEmployees);
        this.employees$ = this.employeesSubject.asObservable();
    }

    public getEmployees(): Observable<Employee[]> {
        return this.employees$;
    }

    public getEmployeeById(id: string): Employee | undefined {
        return this.mockEmployees.find((emp) => emp.id === id);
    }

    public addEmployee(employee: Omit<Employee, 'id'>): void {
        const newEmployee: Employee = {
            ...employee,
            id: Date.now().toString(),
        };
        this.mockEmployees.push(newEmployee);
        this.employeesSubject.next([...this.mockEmployees]);
    }

    public updateEmployee(id: string, updatedEmployee: Partial<Employee>): void {
        const index = this.mockEmployees.findIndex((emp) => emp.id === id);
        if (index !== -1) {
            this.mockEmployees[index] = { ...this.mockEmployees[index], ...updatedEmployee };
            this.employeesSubject.next([...this.mockEmployees]);
        }
    }

    public deleteEmployee(id: string): void {
        this.mockEmployees = this.mockEmployees.filter((emp) => emp.id !== id);
        this.employeesSubject.next([...this.mockEmployees]);
    }

    public deactivateEmployee(id: string): void {
        this.updateEmployee(id, { status: 'inactive' });
    }

    public activateEmployee(id: string): void {
        this.updateEmployee(id, { status: 'active' });
    }
}
