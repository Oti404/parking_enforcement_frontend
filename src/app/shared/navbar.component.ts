import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-8">
        <span class="text-white font-bold text-lg tracking-wide flex items-center gap-2">
          <span class="text-blue-400">⬡</span> EnforceNet
        </span>
        <div class="flex gap-1">
          <a
            routerLink="/dashboard"
            routerLinkActive="bg-gray-700 text-white"
            class="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Dashboard
          </a>
          <a
            routerLink="/capture"
            routerLinkActive="bg-gray-700 text-white"
            class="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Capture
          </a>
          <a
            routerLink="/flags"
            routerLinkActive="bg-gray-700 text-white"
            class="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Flags
          </a>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-gray-400 text-sm">{{ auth.username() }}</span>
        <button
          (click)="auth.logout()"
          class="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
}
