import { Component, inject } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium animate-slide-in-right min-w-64 max-w-sm"
          [class]="toastClass(toast.type)"
        >
          <span>{{ toastIcon(toast.type) }}</span>
          <span class="flex-1">{{ toast.message }}</span>
          <button
            (click)="toastService.dismiss(toast.id)"
            class="opacity-60 hover:opacity-100 text-lg leading-none"
          >×</button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  toastClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-900/90 border-green-500/40 text-green-300';
      case 'error':   return 'bg-red-900/90 border-red-500/40 text-red-300';
      default:        return 'bg-gray-800/90 border-gray-600/40 text-gray-200';
    }
  }

  toastIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error':   return '✗';
      default:        return 'ℹ';
    }
  }
}
