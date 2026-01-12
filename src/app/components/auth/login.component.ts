import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
})
export class LoginComponent {
    public email: string = '';
    public password: string = '';
    public errorMessage: string = '';

    constructor(
        private authService: AuthService,
        private router: Router,
    ) { }

    public onLogin(): void {
        this.errorMessage = '';

        if (!this.email || !this.password) {
            this.errorMessage = 'Please enter both email and password';
            return;
        }

        if (this.authService.login(this.email, this.password)) {
            this.router.navigate(['/dashboard']);
        } else {
            this.errorMessage = 'Invalid email or password';
        }
    }
}
