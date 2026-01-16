import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Dashboard } from '../../models/index';
import { DashboardService } from '../../services/dashboard.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
    public dashboardData: Dashboard | null = null;
    public isLoading: boolean = false;
    public errorMessage: string | null = null;
    private subscription: Subscription = new Subscription();

    constructor(private dashboardService: DashboardService) { }

    public ngOnInit(): void {
        this.loadDashboardData();
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    private loadDashboardData(): void {
        this.isLoading = true;
        this.errorMessage = null;

        const sub = this.dashboardService.getDashboardData().subscribe({
            next: (data: Dashboard) => {
                this.dashboardData = data;
                this.isLoading = false;
            },
            error: (error: Error) => {
                this.errorMessage = 'Failed to load dashboard data. Please try again.';
                this.isLoading = false;
                console.error('Dashboard loading error:', error);
            }
        });

        this.subscription.add(sub);
    }

    public refreshDashboard(): void {
        this.loadDashboardData();
    }
}
