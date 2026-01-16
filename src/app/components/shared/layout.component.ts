import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { Employee } from '../../models/index';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterOutlet],
    templateUrl: './layout.component.html'
})
export class LayoutComponent implements OnInit, OnDestroy {
    public currentEmployee: Employee | null = null;
    public currentTime: Date = new Date();
    private subscription: Subscription = new Subscription();
    private timeInterval: ReturnType<typeof setInterval> | null = null;

    constructor(
        private authService: AuthService,
        private router: Router,
    ) {
        this.timeInterval = setInterval(() => {
            this.currentTime = new Date();
        }, 1000);
    }

    public ngOnInit(): void {
        const sub = this.authService.currentEmployee$.subscribe((employee) => {
            this.currentEmployee = employee;
        });
        this.subscription.add(sub);
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }

    public onLogout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
