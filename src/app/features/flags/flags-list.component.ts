import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FlagsService } from '../../core/services/flags.service';
import { ToastService } from '../../core/services/toast.service';
import { NavbarComponent } from '../../shared/navbar.component';
import { FLAG_TYPE_LABELS, FLAG_TYPE_COLORS, FlagType } from '../../core/models/flag.model';
import { DatePipe } from '@angular/common';

type FilterType = 'all' | FlagType;

@Component({
  selector: 'app-flags-list',
  imports: [NavbarComponent, RouterLink, DatePipe],
  template: `
    <div class="min-h-screen bg-base">
      <app-navbar />

      <main class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-white">Flags</h1>
            <p class="text-gray-400 text-sm mt-1">{{ filteredFlags().length }} records · auto-refreshes every 30s</p>
          </div>
          <select
            (change)="setFilter($any($event.target).value)"
            class="px-4 py-2 rounded-lg bg-surface border border-gray-700 text-gray-300 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="no_subscription">No Subscription</option>
            <option value="subscription_expired">Expired</option>
            <option value="car_in_wrong_parking">Wrong Parking</option>
            <option value="subscription_close_to_expiration">Expiring Soon</option>
          </select>
        </div>

        <div class="bg-surface rounded-xl border border-gray-700">
          <div class="overflow-x-auto">
            @if (flags.loading() && flags.flags().length === 0) {
              <div class="p-6 space-y-3">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="h-12 rounded-lg bg-gray-700/50 animate-pulse"></div>
                }
              </div>
            } @else if (filteredFlags().length === 0) {
              <div class="py-16 text-center text-gray-500">
                <p class="text-3xl mb-2">📭</p>
                <p>No flags found.</p>
              </div>
            } @else {
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-surface z-10 border-b border-gray-700">
                  <tr class="text-gray-400 text-xs uppercase tracking-wider">
                    <th class="px-4 py-3 text-left font-medium w-10">#</th>
                    <th class="px-4 py-3 text-left font-medium">Plate</th>
                    <th class="px-4 py-3 text-left font-medium">Lot</th>
                    <th class="px-4 py-3 text-left font-medium">Type</th>
                    <th class="px-4 py-3 text-left font-medium">Confidence</th>
                    <th class="px-4 py-3 text-left font-medium">Detected</th>
                    <th class="px-4 py-3 text-left font-medium">Status</th>
                    <th class="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-700/50">
                  @for (flag of filteredFlags(); track flag.id) {
                    <tr
                      class="group hover:bg-elevated animate-fade-in"
                      [class]="rowClass(flag)"
                    >
                      <td class="px-4 py-3 text-gray-500 text-xs">{{ flag.id }}</td>
                      <td class="px-4 py-3 font-mono font-bold text-white">{{ flag.car_registration_no }}</td>
                      <td class="px-4 py-3 text-gray-400">#{{ flag.parking_id }}</td>
                      <td class="px-4 py-3">
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium {{ flagColors(flag.type) }}">
                          {{ flagLabel(flag.type) }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        @if (flag.confidence_score !== null) {
                          <span class="font-medium {{ confidenceTextClass(flag.confidence_score) }}">
                            {{ (flag.confidence_score * 100).toFixed(0) }}%
                          </span>
                        } @else {
                          <span class="text-gray-600">—</span>
                        }
                      </td>
                      <td class="px-4 py-3 text-gray-400">{{ flag.detected_at | date:'dd MMM, HH:mm' }}</td>
                      <td class="px-4 py-3">
                        @if (flag.verified_by_human) {
                          <span class="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">Verified</span>
                        } @else if (flag.requires_human_verification) {
                          <span class="px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">Needs Review</span>
                        } @else {
                          <span class="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">Auto-flagged</span>
                        }
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-1">
                          @if (flag.requires_human_verification && !flag.verified_by_human) {
                            <button
                              (click)="quickConfirm(flag.id, $event)"
                              [disabled]="processingId() === flag.id"
                              title="Confirm violation"
                              class="px-2 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/25 text-green-400 text-xs font-medium border border-green-500/20 hover:border-green-500/40 disabled:opacity-40"
                            >✓ Confirm</button>
                            <button
                              (click)="quickDismiss(flag.id, $event)"
                              [disabled]="processingId() === flag.id"
                              title="Dismiss flag"
                              class="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 text-xs font-medium border border-red-500/20 hover:border-red-500/40 disabled:opacity-40"
                            >✗ Dismiss</button>
                          }
                          <a
                            [routerLink]="['/flags', flag.id]"
                            class="px-2 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs"
                          >View →</a>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      </main>
    </div>
  `,
})
export class FlagsListComponent implements OnInit, OnDestroy {
  readonly flags = inject(FlagsService);
  private readonly toast = inject(ToastService);
  private refreshSub?: Subscription;

  readonly activeFilter = signal<FilterType>('all');
  readonly processingId = signal<number | null>(null);

  readonly filteredFlags = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.flags.flags();
    return this.flags.flags().filter((f) => f.type === filter);
  });

  flagLabel = (type: any) => FLAG_TYPE_LABELS[type as keyof typeof FLAG_TYPE_LABELS] ?? type;
  flagColors = (type: any) => FLAG_TYPE_COLORS[type as keyof typeof FLAG_TYPE_COLORS] ?? '';

  rowClass(flag: any): string {
    if (flag.requires_human_verification && !flag.verified_by_human) return 'row-needs-review';
    if (flag.confidence_score !== null && flag.confidence_score < 0.5) return 'row-danger';
    return 'row-normal';
  }

  confidenceTextClass(score: number): string {
    if (score >= 0.85) return 'text-green-400';
    if (score >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  }

  setFilter(value: FilterType) {
    this.activeFilter.set(value);
  }

  quickConfirm(id: number, e: Event) {
    e.stopPropagation();
    this.processingId.set(id);
    this.flags.verifyFlag(id, { is_valid_violation: true }).subscribe({
      next: () => { this.toast.success('Violation confirmed.'); this.processingId.set(null); },
      error: () => { this.toast.error('Action failed. Please try again.'); this.processingId.set(null); },
    });
  }

  quickDismiss(id: number, e: Event) {
    e.stopPropagation();
    this.processingId.set(id);
    this.flags.verifyFlag(id, { is_valid_violation: false }).subscribe({
      next: () => { this.toast.info('Flag dismissed.'); this.processingId.set(null); },
      error: () => { this.toast.error('Action failed. Please try again.'); this.processingId.set(null); },
    });
  }

  ngOnInit() {
    this.flags.loadFlags().subscribe();
    this.refreshSub = interval(30000)
      .pipe(switchMap(() => this.flags.loadFlags()))
      .subscribe();
  }

  ngOnDestroy() {
    this.refreshSub?.unsubscribe();
  }
}
