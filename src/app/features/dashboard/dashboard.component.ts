import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FlagsService } from '../../core/services/flags.service';
import { NavbarComponent } from '../../shared/navbar.component';
import { FLAG_TYPE_LABELS, FLAG_TYPE_COLORS } from '../../core/models/flag.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [NavbarComponent, RouterLink, DatePipe],
  template: `
    <div class="min-h-screen bg-base">
      <app-navbar />

      <main class="max-w-7xl mx-auto px-6 py-8">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-white">Command Center</h1>
            <p class="text-gray-400 text-sm mt-1">
              Live enforcement overview
              @if (flags.lastRefreshTime()) {
                · Last updated {{ flags.lastRefreshTime() | date:'HH:mm:ss' }}
              }
            </p>
          </div>
          @if (flags.newFlagsCount() > 0) {
            <div class="animate-fade-in flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium">
              <span class="animate-pulse-soft">⚠</span>
              +{{ flags.newFlagsCount() }} new flag{{ flags.newFlagsCount() > 1 ? 's' : '' }} detected
            </div>
          }
        </div>

        <!-- Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <!-- Total Flags -->
          <div class="bg-surface rounded-xl border border-gray-700 p-5 hover:border-gray-600 transition-colors">
            <div class="flex items-center justify-between mb-3">
              <p class="text-gray-400 text-sm font-medium">Total Flags</p>
              <span class="text-2xl">🚩</span>
            </div>
            <p class="text-3xl font-bold text-white">{{ flags.totalFlags() }}</p>
            <p class="text-gray-500 text-xs mt-1">All time detections</p>
          </div>

          <!-- Pending Review -->
          <div class="bg-surface rounded-xl border p-5 transition-colors"
            [class]="flags.pendingVerification() > 0
              ? 'border-orange-500/40 animate-pulse-soft'
              : 'border-gray-700'">
            <div class="flex items-center justify-between mb-3">
              <p class="text-orange-400 text-sm font-medium">Pending Review</p>
              <span class="text-2xl">⏳</span>
            </div>
            <p class="text-3xl font-bold text-white">{{ flags.pendingVerification() }}</p>
            <p class="text-gray-500 text-xs mt-1">{{ flags.pendingPercent() }}% of total · require action</p>
          </div>

          <!-- Avg OCR Confidence -->
          <div class="bg-surface rounded-xl border border-blue-500/20 p-5">
            <div class="flex items-center justify-between mb-3">
              <p class="text-blue-400 text-sm font-medium">Avg OCR Confidence</p>
              <span class="text-2xl">🎯</span>
            </div>
            <p class="text-3xl font-bold text-white">{{ flags.avgConfidence() }}%</p>
            <div class="mt-2 w-full h-1.5 rounded-full bg-gray-700">
              <div class="h-1.5 rounded-full bg-blue-500 transition-all duration-700"
                [style.width.%]="flags.avgConfidence()"></div>
            </div>
          </div>

          <!-- No Subscription -->
          <div class="bg-surface rounded-xl border border-red-500/20 p-5">
            <div class="flex items-center justify-between mb-3">
              <p class="text-red-400 text-sm font-medium">No Subscription</p>
              <span class="text-2xl">🚫</span>
            </div>
            <p class="text-3xl font-bold text-white">{{ flags.noSubscriptionCount() }}</p>
            <p class="text-gray-500 text-xs mt-1">Unregistered vehicles</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <!-- Recent Flags (2/3 width) -->
          <div class="lg:col-span-2 bg-surface rounded-xl border border-gray-700">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h2 class="text-white font-semibold">Recent Flags</h2>
              <a routerLink="/flags" class="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                View all →
              </a>
            </div>
            <div class="overflow-x-auto">
              @if (flags.loading()) {
                <!-- Skeleton -->
                <div class="p-6 space-y-3">
                  @for (i of [1,2,3]; track i) {
                    <div class="h-10 rounded-lg bg-gray-700/50 animate-pulse"></div>
                  }
                </div>
              } @else if (flags.recentFlags().length === 0) {
                <div class="py-12 text-center text-gray-500">
                  <p class="text-3xl mb-2">📭</p>
                  <p>No flags yet. Send a detection to get started.</p>
                </div>
              } @else {
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-gray-400 text-xs uppercase tracking-wider">
                      <th class="px-6 py-3 text-left font-medium">Plate</th>
                      <th class="px-6 py-3 text-left font-medium">Type</th>
                      <th class="px-6 py-3 text-left font-medium">Status</th>
                      <th class="px-6 py-3 text-left font-medium">Detected</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-700">
                    @for (flag of flags.recentFlags(); track flag.id) {
                      <tr
                        class="hover:bg-elevated cursor-pointer animate-fade-in"
                        [class]="flag.requires_human_verification && !flag.verified_by_human ? 'row-needs-review' : 'row-normal'"
                        [routerLink]="['/flags', flag.id]"
                      >
                        <td class="px-6 py-3 font-mono font-bold text-white">{{ flag.car_registration_no }}</td>
                        <td class="px-6 py-3">
                          <span class="px-2 py-0.5 rounded-full text-xs font-medium {{ flagColors(flag.type) }}">
                            {{ flagLabel(flag.type) }}
                          </span>
                        </td>
                        <td class="px-6 py-3">
                          @if (flag.verified_by_human) {
                            <span class="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">Verified</span>
                          } @else if (flag.requires_human_verification) {
                            <span class="px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse-soft">Needs Review</span>
                          } @else {
                            <span class="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">Auto-flagged</span>
                          }
                        </td>
                        <td class="px-6 py-3 text-gray-400">{{ flag.detected_at | date:'HH:mm, dd MMM' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </div>

          <!-- Insights Panel (1/3 width) -->
          <div class="bg-surface rounded-xl border border-gray-700 p-5">
            <h2 class="text-white font-semibold mb-4">Insights</h2>

            @if (flags.loading()) {
              <div class="space-y-3">
                @for (i of [1,2,3]; track i) {
                  <div class="h-12 rounded-lg bg-gray-700/50 animate-pulse"></div>
                }
              </div>
            } @else if (flags.totalFlags() === 0) {
              <p class="text-gray-500 text-sm">Insights will appear after the first detections.</p>
            } @else {
              <div class="space-y-4">
                <!-- Top violation type -->
                @if (flags.topViolationType()) {
                  <div class="p-3 rounded-lg bg-elevated border border-gray-600">
                    <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Top Violation</p>
                    <p class="text-white text-sm font-medium">{{ flagLabel(flags.topViolationType()!) }}</p>
                    <p class="text-gray-500 text-xs mt-0.5">Most frequent violation type</p>
                  </div>
                }

                <!-- Top parking lot -->
                @if (flags.topParkingId()) {
                  <div class="p-3 rounded-lg bg-elevated border border-gray-600">
                    <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Hotspot</p>
                    <p class="text-white text-sm font-medium">Parking Lot #{{ flags.topParkingId() }}</p>
                    <p class="text-gray-500 text-xs mt-0.5">Highest violation rate</p>
                  </div>
                }

                <!-- Pending percentage -->
                <div class="p-3 rounded-lg bg-elevated border border-gray-600">
                  <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Review Backlog</p>
                  <p class="text-white text-sm font-medium">{{ flags.pendingVerification() }} cases pending</p>
                  <div class="mt-2 w-full h-1.5 rounded-full bg-gray-700">
                    <div class="h-1.5 rounded-full bg-orange-500 transition-all duration-700"
                      [style.width.%]="flags.pendingPercent()"></div>
                  </div>
                  <p class="text-gray-500 text-xs mt-1">{{ flags.pendingPercent() }}% of all flags</p>
                </div>

                <!-- OCR quality -->
                <div class="p-3 rounded-lg bg-elevated border border-gray-600">
                  <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">OCR Quality</p>
                  @if (flags.avgConfidence() >= 80) {
                    <p class="text-green-400 text-sm font-medium">✓ High confidence</p>
                    <p class="text-gray-500 text-xs mt-0.5">Camera placement is optimal</p>
                  } @else if (flags.avgConfidence() >= 50) {
                    <p class="text-yellow-400 text-sm font-medium">⚠ Review recommended</p>
                    <p class="text-gray-500 text-xs mt-0.5">Consider adjusting camera angle</p>
                  } @else {
                    <p class="text-red-400 text-sm font-medium">✗ Low confidence</p>
                    <p class="text-gray-500 text-xs mt-0.5">Camera placement needs attention</p>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly flags = inject(FlagsService);
  private refreshSub?: Subscription;

  flagLabel = (type: any) => FLAG_TYPE_LABELS[type as keyof typeof FLAG_TYPE_LABELS] ?? type;
  flagColors = (type: any) => FLAG_TYPE_COLORS[type as keyof typeof FLAG_TYPE_COLORS] ?? '';

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
