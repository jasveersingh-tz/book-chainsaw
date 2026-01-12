import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router,
    ) { }

    public canActivate(
        _route: ActivatedRouteSnapshot,
        _state: RouterStateSnapshot,
    ): boolean {
        if (this.authService.isAuthenticated) {
            return true;
        }

        this.router.navigate(['/login']);
        return false;
    }
}
