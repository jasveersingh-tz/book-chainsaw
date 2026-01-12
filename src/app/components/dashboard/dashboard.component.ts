import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard } from '../../models/index';
import { DashboardService } from '../../services/dashboard.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
    public dashboardData: Dashboard | null = null;

    constructor(private dashboardService: DashboardService) { }

    public ngOnInit(): void {
        this.dashboardService.getDashboardData().subscribe((data) => {
            this.dashboardData = data;
        });
    }
}
