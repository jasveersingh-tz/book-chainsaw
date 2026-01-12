import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employee } from '../../models/index';
import { EmployeeService } from '../../services/employee.service';

@Component({
    selector: 'app-employees',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './employees.component.html',
})
export class EmployeesComponent implements OnInit {
    public employees: Employee[] = [];
    public searchTerm: string = '';
    public showAddForm: boolean = false;

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
        this.employeeService.getEmployees().subscribe((employees) => {
            this.employees = employees;
        });
    }

    public getFilteredEmployees(): Employee[] {
        if (!this.searchTerm) {
            return this.employees;
        }

        const term = this.searchTerm.toLowerCase();
        return this.employees.filter(
            (employee) =>
                employee.name.toLowerCase().includes(term) ||
                employee.email.toLowerCase().includes(term),
        );
    }

    public onAddEmployee(): void {
        if (
            this.newEmployee.name &&
            this.newEmployee.email &&
            this.newEmployee.phone &&
            this.newEmployee.employeeId &&
            this.newEmployee.password
        ) {
            this.employeeService.addEmployee(this.newEmployee);

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

            this.showAddForm = false;
        }
    }

    public onDeactivateEmployee(id: string): void {
        this.employeeService.deactivateEmployee(id);
    }

    public onActivateEmployee(id: string): void {
        this.employeeService.activateEmployee(id);
    }

    public onDeleteEmployee(id: string): void {
        if (confirm('Are you sure you want to delete this employee?')) {
            this.employeeService.deleteEmployee(id);
        }
    }

    public toggleAddForm(): void {
        this.showAddForm = !this.showAddForm;
    }
}
