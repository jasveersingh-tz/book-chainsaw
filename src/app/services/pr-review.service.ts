import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PullRequest } from '../models/index';

@Injectable({
    providedIn: 'root',
})
export class PrReviewService {
    private pullRequestsSubject: BehaviorSubject<PullRequest[]>;
    public pullRequests$: Observable<PullRequest[]>;

    private mockPullRequests: PullRequest[] = [
        {
            id: '1',
            title: 'Add user authentication',
            description: 'Implements JWT-based authentication',
            branch: 'feature/auth',
            author: 'developer1@library.com',
            status: 'approved',
            lintScore: 98,
            testsPassed: true,
            codeReviewComments: ['Looks good!', 'Well structured code'],
            createdAt: new Date('2024-01-05'),
            updatedAt: new Date('2024-01-06'),
        },
        {
            id: '2',
            title: 'Fix book inventory bug',
            description: 'Resolves issue with duplicate book entries',
            branch: 'bugfix/inventory',
            author: 'developer2@library.com',
            status: 'pending',
            lintScore: 95,
            testsPassed: true,
            codeReviewComments: [],
            createdAt: new Date('2024-01-08'),
            updatedAt: new Date('2024-01-08'),
        },
        {
            id: '3',
            title: 'Update dependencies',
            description: 'Updates Angular to latest version',
            branch: 'chore/deps',
            author: 'developer1@library.com',
            status: 'rejected',
            lintScore: 75,
            testsPassed: false,
            codeReviewComments: ['Tests failing', 'Need to fix breaking changes'],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
        },
    ];

    constructor() {
        this.pullRequestsSubject = new BehaviorSubject<PullRequest[]>(this.mockPullRequests);
        this.pullRequests$ = this.pullRequestsSubject.asObservable();
    }

    public getPullRequests(): Observable<PullRequest[]> {
        return this.pullRequests$;
    }

    public getPullRequestById(id: string): PullRequest | undefined {
        return this.mockPullRequests.find((pr) => pr.id === id);
    }

    public submitPullRequest(pr: Omit<PullRequest, 'id' | 'status' | 'updatedAt'>): void {
        const newPr: PullRequest = {
            ...pr,
            id: Date.now().toString(),
            status: 'pending',
            updatedAt: new Date(),
        };

        this.mockPullRequests.push(newPr);
        this.autoReviewAndUpdatePr(newPr.id);
        this.pullRequestsSubject.next([...this.mockPullRequests]);
    }

    private autoReviewAndUpdatePr(prId: string): void {
        const pr = this.getPullRequestById(prId);
        if (!pr) {
            return;
        }

        const { shouldApprove, reason } = this.evaluatePullRequest(pr);

        const updatedPr: PullRequest = {
            ...pr,
            status: shouldApprove ? 'approved' : 'rejected',
            codeReviewComments: [...pr.codeReviewComments, reason],
            updatedAt: new Date(),
        };

        const index = this.mockPullRequests.findIndex((p) => p.id === prId);
        if (index !== -1) {
            this.mockPullRequests[index] = updatedPr;
        }

        this.pullRequestsSubject.next([...this.mockPullRequests]);
    }

    private evaluatePullRequest(pr: PullRequest): { shouldApprove: boolean; reason: string } {
        const lintThreshold = 90;
        const minLintScore = pr.lintScore >= lintThreshold;
        const testsPass = pr.testsPassed === true;

        if (!minLintScore) {
            return {
                shouldApprove: false,
                reason: `Lint score ${pr.lintScore} is below threshold of ${lintThreshold}`,
            };
        }

        if (!testsPass) {
            return {
                shouldApprove: false,
                reason: 'Tests are not passing. Please fix failing tests before resubmitting.',
            };
        }

        if (minLintScore && testsPass) {
            return {
                shouldApprove: true,
                reason: 'Automatic approval: Code meets all quality standards (lint score ≥ 90, tests passing)',
            };
        }

        return {
            shouldApprove: false,
            reason: 'Pull request does not meet approval criteria',
        };
    }

    public manualReview(prId: string, approved: boolean, comment: string): void {
        const pr = this.getPullRequestById(prId);
        if (!pr) {
            return;
        }

        const updatedPr: PullRequest = {
            ...pr,
            status: approved ? 'approved' : 'rejected',
            codeReviewComments: [...pr.codeReviewComments, comment],
            updatedAt: new Date(),
        };

        const index = this.mockPullRequests.findIndex((p) => p.id === prId);
        if (index !== -1) {
            this.mockPullRequests[index] = updatedPr;
        }

        this.pullRequestsSubject.next([...this.mockPullRequests]);
    }

    public getPendingReviews(): PullRequest[] {
        return this.mockPullRequests.filter((pr) => pr.status === 'pending');
    }

    public getApprovedPrs(): PullRequest[] {
        return this.mockPullRequests.filter((pr) => pr.status === 'approved');
    }

    public getRejectedPrs(): PullRequest[] {
        return this.mockPullRequests.filter((pr) => pr.status === 'rejected');
    }
}
