import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Employee } from '../../models/index';
import { EmployeeService } from '../../services/employee.service';

@Component({
    selector: 'app-employees',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './employees.component.html',
})
export class EmployeesComponent implements OnInit, OnDestroy {
    public employees: Employee[] = [];
    public searchTerm: string = '';
    public showAddForm: boolean = false;
    private subscription: Subscription = new Subscription();

    public newEmployee: Omit<Employee, 'id'> = {
        name: '',
        email: '',
        phone: '',
        employeeId: '',
        role: 'staff',
        department: '',
        joinDate: new Date(),
        salary: 0,
        status: 'active',
        password: '',
    };

    constructor(private employeeService: EmployeeService) { }

    public ngOnInit(): void {
        const sub = this.employeeService.getEmployees().subscribe((employees) => {
            this.employees = employees;
        });
        this.subscription.add(sub);
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public getFilteredEmployees(): Employee[] {
        if (!this.searchTerm || !this.searchTerm.trim()) {
            return this.employees;
        }

        const term = this.searchTerm.toLowerCase().trim();
        return this.employees.filter(
            (employee) =>
                employee.name?.toLowerCase().includes(term) ||
                employee.email?.toLowerCase().includes(term) ||
                employee.employeeId?.toLowerCase().includes(term),
        );
    }

    public onAddEmployee(): void {
        if (
            this.newEmployee.name?.trim() &&
            this.newEmployee.email?.trim() &&
            this.newEmployee.phone?.trim() &&
            this.newEmployee.employeeId?.trim() &&
            this.newEmployee.password?.trim()
        ) {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.newEmployee.email)) {
                alert('Please enter a valid email address');
                return;
            }

            // Validate phone format (basic check)
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(this.newEmployee.phone.replace(/\D/g, ''))) {
                alert('Please enter a valid 10-digit phone number');
                return;
            }

            this.employeeService.addEmployee(this.newEmployee);

            this.resetNewEmployeeForm();
            this.showAddForm = false;
        } else {
            alert('Please fill in all required fields');
        }
    }

    private resetNewEmployeeForm(): void {
        this.newEmployee = {
            name: '',
            email: '',
            phone: '',
            employeeId: '',
            role: 'staff',
            department: '',
            joinDate: new Date(),
            salary: 0,
            status: 'active',
            password: '',
        };
    }

    public onDeactivateEmployee(id: string): void {
        if (!id) {
            console.error('Invalid employee ID');
            return;
        }

        if (confirm('Are you sure you want to deactivate this employee?')) {
            this.employeeService.deactivateEmployee(id);
        }
    }

    public onActivateEmployee(id: string): void {
        if (!id) {
            console.error('Invalid employee ID');
            return;
        }

        this.employeeService.activateEmployee(id);
    }

    public onDeleteEmployee(id: string): void {
        if (!id) {
            console.error('Invalid employee ID');
            return;
        }

        if (confirm('Are you sure you want to permanently delete this employee? This action cannot be undone.')) {
            this.employeeService.deleteEmployee(id);
        }
    }

    public toggleAddForm(): void {
        this.showAddForm = !this.showAddForm;
    }

    public trackByEmployeeId(index: number, employee: Employee): string {
        return employee.id;
    }
}
