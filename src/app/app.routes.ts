import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { UsersComponent } from './components/users/users.component';
import { EmployeesComponent } from './components/employees/employees.component';
import { PosComponent } from './components/pos/pos.component';
import { LayoutComponent } from './components/shared/layout.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    {
        path: '',
        component: LayoutComponent,
        canActivate: [AuthGuard],
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'inventory', component: InventoryComponent },
            { path: 'users', component: UsersComponent },
            { path: 'employees', component: EmployeesComponent },
            { path: 'pos', component: PosComponent },
        ],
    },
    { path: '**', redirectTo: '/login' },
];
