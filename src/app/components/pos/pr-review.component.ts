import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PullRequest } from '../../models/index';
import { PrReviewService } from '../../services/pr-review.service';

@Component({
    selector: 'app-pr-review',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pr-review.component.html',
})
export class PrReviewComponent implements OnInit {
    public pullRequests: PullRequest[] = [];
    public selectedTab: 'pending' | 'approved' | 'rejected' = 'pending';
    public manualReviewComments: { [key: string]: string } = {};

    public newPr: Omit<PullRequest, 'id' | 'status' | 'updatedAt' | 'author' | 'codeReviewComments' | 'createdAt'> =
        {
            title: '',
            description: '',
            branch: '',
            lintScore: 0,
            testsPassed: false,
        };

    constructor(private prReviewService: PrReviewService) { }

    public ngOnInit(): void {
        this.prReviewService.getPullRequests().subscribe((prs) => {
            this.pullRequests = prs;
        });
    }

    public getFilteredPrs(): PullRequest[] {
        return this.pullRequests.filter((pr) => pr.status === this.selectedTab);
    }

    public onSubmitPr(): void {
        if (!this.newPr.title || !this.newPr.branch) {
            alert('Please fill in all required fields');
            return;
        }

        const prToSubmit: Omit<PullRequest, 'id' | 'status' | 'updatedAt'> = {
            ...this.newPr,
            author: 'current-user@library.com',
            codeReviewComments: [],
            createdAt: new Date(),
        };

        this.prReviewService.submitPullRequest(prToSubmit);

        this.newPr = {
            title: '',
            description: '',
            branch: '',
            lintScore: 0,
            testsPassed: false,
        };

        alert('Pull request submitted! Auto-review in progress...');
    }

    public onManualReview(prId: string, approved: boolean): void {
        const comment = this.manualReviewComments[prId] || (approved ? 'Approved' : 'Rejected');
        this.prReviewService.manualReview(prId, approved, comment);
        this.manualReviewComments[prId] = '';
        alert(`PR ${approved ? 'approved' : 'rejected'} successfully!`);
    }
}
