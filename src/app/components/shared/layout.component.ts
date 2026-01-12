import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterOutlet } from '@angular/router';
import { Employee } from '../../models/index';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterOutlet],
    templateUrl: './layout.component.html'
})
export class LayoutComponent implements OnInit {
    public currentEmployee: Employee | null = null;
    public currentTime: Date = new Date();

    constructor(
        private authService: AuthService,
        private router: Router,
    ) {
        setInterval(() => {
            this.currentTime = new Date();
        }, 1000);
    }

    public ngOnInit(): void {
        this.authService.currentEmployee$.subscribe((employee) => {
            this.currentEmployee = employee;
        });
    }

    public onLogout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
