import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 mb-4">
            <span class="text-3xl">⬡</span>
          </div>
          <h1 class="text-2xl font-bold text-white">EnforceNet</h1>
          <p class="text-gray-400 text-sm mt-1">Parking Enforcement System</p>
        </div>

        <!-- Card -->
        <div class="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <h2 class="text-lg font-semibold text-white mb-6">Officer Login</h2>

          @if (error()) {
            <div class="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">Username</label>
              <input
                type="text"
                name="username"
                [(ngModel)]="username"
                required
                autocomplete="username"
                class="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                [(ngModel)]="password"
                required
                autocomplete="current-password"
                class="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors mt-2"
            >
              @if (loading()) { Signing in... } @else { Sign In }
            </button>
          </form>
        </div>

        <p class="text-center text-gray-600 text-xs mt-6">TEDIH 2026 · EnforceNet v1.0</p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onSubmit() {
    if (!this.username || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error.set('Invalid username or password.');
        this.loading.set(false);
      },
    });
  }
}
