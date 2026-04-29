import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { NavbarComponent } from '../../shared/navbar.component';
import { CaptureService } from '../../core/services/capture.service';
import { ParkingLot, RawDetectionResponse } from '../../core/models/capture.model';
import { ToastService } from '../../core/services/toast.service';
import { FlagsService } from '../../core/services/flags.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-capture',
  imports: [DecimalPipe, FormsModule, NavbarComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-base">
      <app-navbar />

      <main class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/70">Field Capture</p>
            <h1 class="mt-1 text-3xl font-semibold text-white">Officer Camera</h1>
            <p class="mt-2 max-w-2xl text-sm text-slate-400">
              Take a vehicle photo on mobile, send it as base64 JSON, and push the result straight into the enforcement queue.
            </p>
          </div>
          <a
            routerLink="/flags"
            class="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
          >
            Review flags
          </a>
        </div>

        <div class="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <section class="overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top,#164e63_0%,#0f172a_38%,#020617_100%)] shadow-[0_30px_80px_rgba(2,6,23,0.55)]">
            <div class="border-b border-white/10 px-5 py-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-cyan-200">Capture Setup</p>
                  <p class="mt-1 text-xs text-slate-400">Optimized for phone cameras and one-handed use.</p>
                </div>
                <div class="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Mobile
                </div>
              </div>
            </div>

            <div class="space-y-5 px-5 py-5">
              <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Parking Lot
                </label>

                @if (parkings().length > 0) {
                  <select
                    class="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    [ngModel]="selectedParkingId()"
                    (ngModelChange)="setParkingId($event)"
                  >
                    @for (parking of parkings(); track parking.id) {
                      <option [ngValue]="parking.id">{{ parking.name }} · #{{ parking.id }}</option>
                    }
                  </select>
                  @if (selectedParking()) {
                    <p class="mt-2 text-xs text-slate-400">
                      {{ selectedParking()!.location }} · Capacity {{ selectedParking()!.capacity }}
                    </p>
                  }
                } @else {
                  <input
                    type="number"
                    min="1"
                    class="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    [ngModel]="selectedParkingId() ?? ''"
                    (ngModelChange)="setParkingId($event)"
                    placeholder="Enter parking ID"
                  />
                  <p class="mt-2 text-xs text-amber-300/80">
                    {{ parkingLoadError() || 'Parking list unavailable. Enter the lot ID manually.' }}
                  </p>
                }
              </div>

              <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Location</p>
                    @if (latitude() !== null && longitude() !== null) {
                      <p class="mt-2 text-sm text-emerald-300">
                        {{ latitude() | number:'1.4-4' }}, {{ longitude() | number:'1.4-4' }}
                      </p>
                    } @else {
                      <p class="mt-2 text-sm text-slate-300">Optional GPS metadata</p>
                    }
                  </div>
                  <button
                    type="button"
                    (click)="captureLocation()"
                    [disabled]="locating() || !geolocationSupported"
                    class="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    @if (locating()) { Locating... } @else { Use location }
                  </button>
                </div>
                @if (!geolocationSupported) {
                  <p class="mt-2 text-xs text-slate-500">
                    Location requires HTTPS or localhost. Plain HTTP on a phone over local network will be blocked.
                  </p>
                }
                @if (locationError()) {
                  <p class="mt-2 text-xs text-red-300">{{ locationError() }}</p>
                }
              </div>

              <div class="rounded-3xl border border-white/10 bg-slate-950/65 p-4">
                @if (previewUrl()) {
                  <div class="overflow-hidden rounded-[22px] border border-white/10 bg-black">
                    <img [src]="previewUrl()!" alt="Captured vehicle" class="h-[26rem] w-full object-cover sm:h-[30rem]" />
                  </div>
                } @else {
                  <div class="flex h-[26rem] flex-col items-center justify-center rounded-[22px] border border-dashed border-cyan-300/25 bg-[linear-gradient(180deg,rgba(8,145,178,0.12),rgba(15,23,42,0.55))] px-6 text-center sm:h-[30rem]">
                    <div class="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-100">
                      Ready
                    </div>
                    <p class="mt-4 text-lg font-medium text-white">No image selected</p>
                    <p class="mt-2 text-sm text-slate-400">
                      Use the back camera on your phone. The image will be converted to raw base64 before upload.
                    </p>
                  </div>
                }

                <div class="mt-4 grid gap-3 sm:grid-cols-2">
                  <label class="flex cursor-pointer items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                    Take Photo
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      class="hidden"
                      (change)="onFileSelected($event)"
                    />
                  </label>
                  <button
                    type="button"
                    (click)="clearPhoto()"
                    [disabled]="!photoFile()"
                    class="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>

                @if (photoFile()) {
                  <div class="mt-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs text-slate-300">
                    <div class="flex items-center justify-between gap-3">
                      <span class="truncate">{{ photoFile()!.name }}</span>
                      <span>{{ formatBytes(photoFile()!.size) }}</span>
                    </div>
                  </div>
                }
              </div>

              <button
                type="button"
                (click)="submitCapture()"
                [disabled]="!canSubmit()"
                class="w-full rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                @if (submitting()) { Uploading capture... } @else { Send to backend }
              </button>
            </div>
          </section>

          <section class="space-y-5">
            <div class="rounded-[28px] border border-white/10 bg-slate-900/90 p-5 shadow-[0_30px_70px_rgba(15,23,42,0.35)]">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-medium text-white">Upload Contract</p>
                  <p class="mt-1 text-xs text-slate-400">This screen posts JSON to <code>/api/v1/captures</code>.</p>
                </div>
                <div class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Current API
                </div>
              </div>
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                  <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Officer</p>
                  <p class="mt-2 text-sm font-medium text-white">{{ auth.username() || 'Unknown officer' }}</p>
                </div>
                <div class="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                  <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Payload</p>
                  <p class="mt-2 text-sm font-medium text-white">raw base64 + parking ID + metadata</p>
                </div>
              </div>
            </div>

            <div class="rounded-[28px] border border-white/10 bg-slate-900/90 p-5 shadow-[0_30px_70px_rgba(15,23,42,0.35)]">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-medium text-white">Backend Result</p>
                  <p class="mt-1 text-xs text-slate-400">Immediate OCR and enforcement outcome.</p>
                </div>
                @if (result()) {
                  <div class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" [class]="resultBadgeClass()">
                    {{ result()!.status }}
                  </div>
                }
              </div>

              @if (result()) {
                <div class="mt-5 space-y-4">
                  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div class="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                      <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Plate</p>
                      <p class="mt-2 font-mono text-lg font-semibold text-white">{{ result()!.detected_plate }}</p>
                    </div>
                    <div class="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                      <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Confidence</p>
                      <p class="mt-2 text-lg font-semibold text-white">{{ (result()!.confidence_score * 100).toFixed(0) }}%</p>
                    </div>
                    <div class="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                      <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Parking</p>
                      <p class="mt-2 text-lg font-semibold text-white">#{{ result()!.parking_id }}</p>
                    </div>
                    <div class="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                      <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Review</p>
                      <p class="mt-2 text-lg font-semibold text-white">
                        {{ result()!.requires_human_verification ? 'Needed' : 'Not needed' }}
                      </p>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                    <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Analysis notes</p>
                    <p class="mt-2 text-sm leading-6 text-slate-300">{{ result()!.analysis_notes }}</p>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-3">
                    <div class="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                      <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Vehicle color</p>
                      <p class="mt-2 text-sm font-medium text-white">{{ result()!.vehicle_color || 'Unknown' }}</p>
                    </div>
                    <div class="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                      <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Vehicle type</p>
                      <p class="mt-2 text-sm font-medium text-white">{{ result()!.vehicle_type || 'Unknown' }}</p>
                    </div>
                    <div class="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                      <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Plate obscured</p>
                      <p class="mt-2 text-sm font-medium text-white">{{ result()!.plate_obscured ? 'Yes' : 'No' }}</p>
                    </div>
                  </div>

                  @if (resultImageUrl()) {
                    <div class="overflow-hidden rounded-[24px] border border-white/10 bg-black">
                      <img [src]="resultImageUrl()!" alt="Saved evidence image" class="h-72 w-full object-cover" />
                    </div>
                  }

                  <div class="flex flex-col gap-3 sm:flex-row">
                    @if (result()!.flag_id) {
                      <button
                        type="button"
                        (click)="openFlagDetail()"
                        class="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                      >
                        Open flag #{{ result()!.flag_id }}
                      </button>
                    }
                    <button
                      type="button"
                      (click)="goToDashboard()"
                      class="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
                    >
                      View dashboard
                    </button>
                  </div>
                </div>
              } @else {
                <div class="mt-5 rounded-[24px] border border-dashed border-white/10 bg-slate-950/45 px-6 py-10 text-center">
                  <p class="text-base font-medium text-white">No capture submitted yet</p>
                  <p class="mt-2 text-sm text-slate-400">
                    The first successful upload will appear here, then the dashboard and flags list will refresh.
                  </p>
                </div>
              }
            </div>
          </section>
        </div>
      </main>
    </div>
  `,
})
export class CaptureComponent implements OnInit, OnDestroy {
  private readonly captureService = inject(CaptureService);
  readonly flags = inject(FlagsService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly parkings = signal<ParkingLot[]>([]);
  readonly parkingLoadError = signal('');
  readonly selectedParkingId = signal<number | null>(null);
  readonly photoFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly latitude = signal<number | null>(null);
  readonly longitude = signal<number | null>(null);
  readonly locationError = signal('');
  readonly locating = signal(false);
  readonly submitting = signal(false);
  readonly result = signal<RawDetectionResponse | null>(null);
  readonly geolocationSupported =
    typeof navigator !== 'undefined' &&
    'geolocation' in navigator &&
    typeof window !== 'undefined' &&
    (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  readonly canSubmit = computed(() => this.photoFile() !== null && this.selectedParkingId() !== null && !this.submitting());
  readonly selectedParking = computed(() =>
    this.parkings().find((parking) => parking.id === this.selectedParkingId()) ?? null
  );
  readonly resultImageUrl = computed(() => {
    const imagePath = this.result()?.evidence_image_url;
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    return `${environment.apiUrl}${imagePath}`;
  });
  readonly resultBadgeClass = computed(() =>
    this.result()?.status === 'flagged'
      ? 'border border-red-400/30 bg-red-400/10 text-red-200'
      : 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
  );

  private currentPreviewUrl: string | null = null;

  ngOnInit() {
    this.captureService.loadParkings().subscribe({
      next: (parkings) => {
        this.parkings.set(parkings);
        if (!this.selectedParkingId() && parkings.length > 0) {
          this.selectedParkingId.set(parkings[0].id);
        }
      },
      error: () => {
        this.parkingLoadError.set('Could not load parking list from the backend.');
        if (!this.selectedParkingId()) {
          this.selectedParkingId.set(1);
        }
      },
    });
  }

  ngOnDestroy() {
    this.revokePreviewUrl();
  }

  setParkingId(value: string | number | null) {
    const parsed = Number(value);
    this.selectedParkingId.set(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.error('Please select an image file.');
      input.value = '';
      return;
    }

    this.revokePreviewUrl();
    this.currentPreviewUrl = URL.createObjectURL(file);
    this.photoFile.set(file);
    this.previewUrl.set(this.currentPreviewUrl);
    this.result.set(null);
    input.value = '';
  }

  clearPhoto() {
    this.photoFile.set(null);
    this.result.set(null);
    this.revokePreviewUrl();
  }

  captureLocation() {
    if (this.locating()) return;
    if (!this.geolocationSupported) {
      this.locationError.set('Location access requires HTTPS or localhost.');
      return;
    }

    this.locating.set(true);
    this.locationError.set('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.latitude.set(position.coords.latitude);
        this.longitude.set(position.coords.longitude);
        this.locating.set(false);
      },
      (error) => {
        this.locationError.set(this.describeLocationError(error));
        this.locating.set(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  async submitCapture() {
    const file = this.photoFile();
    const parkingId = this.selectedParkingId();
    if (!file || parkingId === null) {
      this.toast.error('Photo and parking ID are required.');
      return;
    }

    this.submitting.set(true);
    this.result.set(null);

    try {
      const imageBase64 = await this.fileToBase64(file);
      const officerId = this.auth.username() ?? undefined;
      const deviceId = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : undefined;

      this.captureService
        .submitCapture({
          image_base64: imageBase64,
          parking_id: parkingId,
          latitude: this.latitude() ?? undefined,
          longitude: this.longitude() ?? undefined,
          timestamp: new Date().toISOString(),
          officer_id: officerId,
          device_id: deviceId,
        })
        .pipe(finalize(() => this.submitting.set(false)))
        .subscribe({
          next: (response) => {
            this.result.set(response);
            this.flags.loadFlags().subscribe({ error: () => undefined });
            if (response.status === 'flagged') {
              this.toast.success(`Flag #${response.flag_id} created for ${response.detected_plate}.`);
            } else {
              this.toast.info(response.message || 'Capture processed without creating a flag.');
            }
          },
          error: (error: { error?: { detail?: string | { message?: string } } }) => {
            this.toast.error(this.extractErrorMessage(error));
          },
        });
    } catch {
      this.submitting.set(false);
      this.toast.error('Could not convert image to base64.');
    }
  }

  openFlagDetail() {
    const flagId = this.result()?.flag_id;
    if (!flagId) return;
    this.router.navigate(['/flags', flagId]);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private revokePreviewUrl() {
    if (this.currentPreviewUrl) {
      URL.revokeObjectURL(this.currentPreviewUrl);
      this.currentPreviewUrl = null;
    }
    this.previewUrl.set(null);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('FileReader did not produce a string.'));
          return;
        }

        const [, base64Payload = result] = result.split(',', 2);
        resolve(base64Payload);
      };
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed.'));
      reader.readAsDataURL(file);
    });
  }

  private extractErrorMessage(error: { error?: { detail?: string | { message?: string } } }): string {
    const detail = error.error?.detail;
    if (typeof detail === 'string') return detail;
    if (detail?.message) return detail.message;
    return 'Capture upload failed.';
  }

  private describeLocationError(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location permission was denied by the browser.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information is unavailable on this device.';
      case error.TIMEOUT:
        return 'Location lookup timed out. Try again with GPS enabled.';
      default:
        return error.message || 'Could not read your location.';
    }
  }
}
