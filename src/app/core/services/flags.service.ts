import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { FlaggedCar, FlagVerificationUpdate, FlagType } from '../models/flag.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FlagsService {
  private readonly http = inject(HttpClient);

  readonly flags = signal<FlaggedCar[]>([]);
  readonly loading = signal(false);
  readonly newFlagsCount = signal(0);
  readonly lastRefreshTime = signal<Date | null>(null);
  private _previousCount = 0;
  private _isFirstLoad = true;

  readonly totalFlags = computed(() => this.flags().length);

  readonly pendingVerification = computed(
    () => this.flags().filter((f) => f.requires_human_verification && !f.verified_by_human).length
  );

  readonly avgConfidence = computed(() => {
    const withScore = this.flags().filter((f) => f.confidence_score !== null);
    if (!withScore.length) return 0;
    const avg = withScore.reduce((sum, f) => sum + (f.confidence_score ?? 0), 0) / withScore.length;
    return Math.round(avg * 100);
  });

  readonly noSubscriptionCount = computed(
    () => this.flags().filter((f) => f.type === 'no_subscription').length
  );

  readonly recentFlags = computed(() =>
    [...this.flags()]
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
      .slice(0, 5)
  );

  // Insights
  readonly topViolationType = computed<FlagType | null>(() => {
    const counts: Record<string, number> = {};
    for (const f of this.flags()) counts[f.type] = (counts[f.type] ?? 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length ? (sorted[0][0] as FlagType) : null;
  });

  readonly topParkingId = computed<number | null>(() => {
    const counts: Record<number, number> = {};
    for (const f of this.flags()) counts[f.parking_id] = (counts[f.parking_id] ?? 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]));
    return sorted.length ? Number(sorted[0][0]) : null;
  });

  readonly pendingPercent = computed(() => {
    if (!this.totalFlags()) return 0;
    return Math.round((this.pendingVerification() / this.totalFlags()) * 100);
  });

  loadFlags() {
    this.loading.set(true);
    return this.http.get<FlaggedCar[]>(`${environment.apiUrl}/api/v1/flags`).pipe(
      tap({
        next: (flags) => {
          const prev = this._previousCount;
          const delta = this._isFirstLoad ? 0 : Math.max(0, flags.length - prev);
          this.newFlagsCount.set(delta);
          this._previousCount = flags.length;
          this._isFirstLoad = false;
          this.flags.set(flags);
          this.lastRefreshTime.set(new Date());
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  verifyFlag(id: number, payload: FlagVerificationUpdate) {
    return this.http
      .patch<FlaggedCar>(`${environment.apiUrl}/api/v1/flags/${id}/verify`, payload)
      .pipe(
        tap((updated) => {
          this.flags.update((flags) => flags.map((f) => (f.id === id ? updated : f)));
        })
      );
  }

  getFlag(id: number): FlaggedCar | undefined {
    return this.flags().find((f) => f.id === id);
  }
}
