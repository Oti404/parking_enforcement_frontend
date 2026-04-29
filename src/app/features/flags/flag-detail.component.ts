import { Component, OnInit, HostListener, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { FlagsService } from '../../core/services/flags.service';
import { ToastService } from '../../core/services/toast.service';
import { NavbarComponent } from '../../shared/navbar.component';
import { FLAG_TYPE_LABELS, FLAG_TYPE_COLORS, FlaggedCar } from '../../core/models/flag.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-flag-detail',
  imports: [NavbarComponent, RouterLink, FormsModule, DatePipe],
  styles: [`
    :host { display:block; height:100vh; overflow:hidden; }
    .panel-body { height:calc(100vh - 57px); display:flex; overflow:hidden; }

    /* ── Left: photo only ── */
    .left-col {
      flex:1; min-width:0;
      display:flex; flex-direction:column;
      overflow:hidden;
      border-right:1px solid rgba(255,255,255,0.07);
    }
    .top-bar {
      flex-shrink:0;
      padding:16px 24px;
      display:flex; align-items:center; justify-content:space-between; gap:16px;
      border-bottom:1px solid rgba(255,255,255,0.06);
      background:rgba(26,31,46,0.9);
    }
    .evidence-zone {
      flex:1; min-height:0;
      position:relative; overflow:hidden;
      background:#060d1a;
      cursor:zoom-in;
    }
    .evidence-zone img { width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.4s ease; }
    .evidence-zone:hover img { transform:scale(1.02); }
    .expand-btn {
      position:absolute; top:12px; right:12px;
      background:rgba(0,0,0,0.55); border:1px solid rgba(255,255,255,0.18); border-radius:8px;
      color:#e2e8f0; width:36px; height:36px;
      display:flex; align-items:center; justify-content:center; font-size:16px;
      cursor:pointer; opacity:0; transition:opacity 0.2s, background 0.2s;
      backdrop-filter:blur(4px);
    }
    .evidence-zone:hover .expand-btn { opacity:1; }
    .expand-btn:hover { background:rgba(0,0,0,0.85); }
    .no-photo {
      width:100%; height:100%; display:flex; flex-direction:column;
      align-items:center; justify-content:center; gap:10px;
      color:rgba(100,116,139,0.35);
    }

    /* ── Right: action panel ── */
    .right-col {
      width:380px; flex-shrink:0;
      display:flex; flex-direction:column;
      overflow-y:auto;
      background:#10162a;
    }

    /* Section separator */
    .section { padding:22px 24px; border-bottom:1px solid rgba(255,255,255,0.06); }
    .section:last-child { border-bottom:none; }

    /* Section heading */
    .section-heading {
      font-size:10px; font-weight:700;
      text-transform:uppercase; letter-spacing:0.1em;
      color:#64748b;           /* clearly readable gray */
      margin-bottom:14px;
    }

    /* Metadata cards */
    .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .meta-card {
      background:rgba(255,255,255,0.03);
      border:1px solid rgba(255,255,255,0.07);
      border-radius:10px; padding:14px 16px;
    }
    .meta-lbl {
      font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em;
      color:#64748b;           /* readable gray — not ghosted */
      margin-bottom:6px;
    }
    .meta-val {
      font-size:20px; font-weight:700;
      color:#f8fafc;           /* near-white — maximum readability */
      line-height:1;
    }

    /* AI Alert Card */
    .ai-card {
      border-radius:12px; padding:18px 20px;
    }
    .ai-card-title {
      font-size:16px; font-weight:700;
      color:#f8fafc;           /* white — primary attention */
      margin-bottom:8px; line-height:1.3;
    }
    .ai-card-body {
      font-size:14px; font-weight:400;
      color:#cbd5e1;           /* slate-300 — clearly readable */
      line-height:1.7;
    }
    .ai-card-conf {
      display:inline-flex; align-items:center; gap:8px;
      margin-top:12px; padding:6px 12px;
      border-radius:99px; font-size:12px; font-weight:600;
    }
    .conf-track {
      width:60px; height:6px;
      background:rgba(255,255,255,0.1);
      border-radius:99px; overflow:hidden; flex-shrink:0;
    }
    .conf-fill { height:100%; border-radius:99px; transition:width 0.8s ease; }
    .fill-low  { background:linear-gradient(90deg,#7f1d1d,#ef4444); }
    .fill-mid  { background:linear-gradient(90deg,#78350f,#f59e0b); }
    .fill-high { background:linear-gradient(90deg,#065f46,#10b981); }

    /* Decision buttons */
    .btn-c, .btn-d {
      flex:1; padding:13px 8px; border-radius:10px;
      font-weight:600; font-size:14px;      /* 14px — readable */
      cursor:pointer; transition:all 0.18s ease;
    }
    .btn-c { background:rgba(16,185,129,0.08); border:1.5px solid rgba(16,185,129,0.25); color:#6ee7b7; }
    .btn-c:hover { background:rgba(16,185,129,0.18); border-color:#10b981; box-shadow:0 0 18px rgba(16,185,129,0.22); transform:translateY(-1px); }
    .btn-c.sel   { background:rgba(16,185,129,0.2); border-color:#10b981; box-shadow:0 0 18px rgba(16,185,129,0.25); color:#a7f3d0; }
    .btn-d { background:rgba(255,255,255,0.03); border:1.5px solid rgba(255,255,255,0.1); color:#94a3b8; }
    .btn-d:hover { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.45); color:#fca5a5; box-shadow:0 0 18px rgba(239,68,68,0.15); transform:translateY(-1px); }
    .btn-d.sel   { background:rgba(239,68,68,0.14); border-color:#ef4444; color:#fca5a5; box-shadow:0 0 18px rgba(239,68,68,0.2); }

    /* Inputs */
    .field {
      width:100%; padding:11px 14px; border-radius:9px;
      background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08);
      color:#f1f5f9; font-size:14px;         /* 14px minimum */
      box-shadow:inset 0 2px 8px rgba(0,0,0,0.3);
      transition:border-color 0.2s, box-shadow 0.2s;
    }
    .field::placeholder { color:rgba(255,255,255,0.22); }
    .field:focus { outline:none; border-color:rgba(99,102,241,0.55); box-shadow:inset 0 2px 8px rgba(0,0,0,0.3), 0 0 0 3px rgba(99,102,241,0.12); }

    /* Field label */
    .field-lbl {
      display:block; margin-bottom:8px;
      font-size:12px; font-weight:600;
      color:#94a3b8;           /* light, readable gray */
      text-transform:uppercase; letter-spacing:0.07em;
    }

    /* Submit */
    .btn-submit {
      width:100%; padding:14px; border-radius:10px;
      background:#4f46e5; color:#fff;
      font-weight:700; font-size:15px;
      box-shadow:0 4px 16px rgba(79,70,229,0.35);
      transition:all 0.18s ease;
    }
    .btn-submit:hover:not(:disabled) { background:#6366f1; box-shadow:0 6px 22px rgba(99,102,241,0.42); transform:translateY(-1px); }
    .btn-submit:disabled { opacity:0.35; cursor:not-allowed; transform:none; }

    /* ── Lightbox ── */
    .lightbox-overlay {
      position:fixed; inset:0; z-index:1000;
      background:rgba(0,0,0,0.96);
      display:flex; align-items:center; justify-content:center;
      animation:lb-in 0.2s ease;
    }
    @keyframes lb-in { from{opacity:0} to{opacity:1} }
    .lb-container {
      position:relative; width:100%; height:100%;
      display:flex; align-items:center; justify-content:center;
      overflow:hidden; cursor:grab;
    }
    .lb-container.dragging { cursor:grabbing; }
    .lb-container img { max-width:95vw; max-height:95vh; object-fit:contain; pointer-events:none; user-select:none; transform-origin:center center; }
    .lb-close {
      position:fixed; top:20px; right:24px;
      width:40px; height:40px; border-radius:50%;
      background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15);
      color:#e2e8f0; font-size:22px;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; transition:background 0.2s;
    }
    .lb-close:hover { background:rgba(255,255,255,0.16); }
    .lb-hint { position:fixed; bottom:22px; left:50%; transform:translateX(-50%); color:rgba(100,116,139,0.5); font-size:12px; pointer-events:none; }
    .lb-zoom { position:fixed; bottom:22px; right:24px; color:rgba(100,116,139,0.55); font-size:12px; font-weight:600; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.08); border-radius:7px; padding:4px 11px; pointer-events:none; }
  `],
  template: `
    <div style="height:100vh;overflow:hidden;background:#0f172a;font-family:'Inter',sans-serif">
      <app-navbar />

      @if (loading()) {
        <div style="height:calc(100vh - 57px);display:flex;align-items:center;justify-content:center;color:#475569">
          <div style="text-align:center">
            <div class="animate-spin" style="font-size:40px;margin-bottom:12px">⟳</div>
            <p style="font-size:14px">Loading flag...</p>
          </div>
        </div>

      } @else if (!flag()) {
        <div style="height:calc(100vh - 57px);display:flex;align-items:center;justify-content:center;color:#475569">
          <div style="text-align:center">
            <p style="font-size:40px;margin-bottom:12px">🔍</p>
            <p style="font-size:15px;font-weight:600;margin-bottom:10px;color:#f1f5f9">Flag not found</p>
            <a routerLink="/flags" style="color:#818cf8;font-size:13px">← Back to Flags</a>
          </div>
        </div>

      } @else {
        <div class="panel-body">

          <!-- ══ LEFT — Photo only ══ -->
          <div class="left-col">

            <!-- Top bar: breadcrumb + plate + status -->
            <div class="top-bar">
              <div style="display:flex;align-items:center;gap:16px;min-width:0">
                <a routerLink="/flags"
                   style="color:#64748b;font-size:13px;font-weight:500;white-space:nowrap;flex-shrink:0;text-decoration:none"
                   class="hover:text-slate-300 transition-colors">
                  ← Flags
                </a>
                <div style="width:1px;height:14px;background:rgba(255,255,255,0.1);flex-shrink:0"></div>
                <span style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;color:#f8fafc;letter-spacing:0.1em;white-space:nowrap">
                  {{ flag()!.car_registration_no }}
                </span>
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full {{ flagColors(flag()!.type) }}" style="flex-shrink:0">
                  {{ flagLabel(flag()!.type) }}
                </span>
              </div>
              <div style="flex-shrink:0">
                @if (flag()!.verified_by_human) {
                  <span style="background:rgba(16,185,129,0.1);color:#34d399;border:1px solid rgba(16,185,129,0.28);padding:4px 13px;border-radius:99px;font-size:12px;font-weight:600">
                    ✓ Verified
                  </span>
                } @else if (flag()!.requires_human_verification) {
                  <span class="animate-pulse-soft"
                        style="background:rgba(245,158,11,0.1);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);padding:4px 13px;border-radius:99px;font-size:12px;font-weight:600">
                    ⚠ Needs Review
                  </span>
                } @else {
                  <span style="background:rgba(99,102,241,0.1);color:#818cf8;border:1px solid rgba(99,102,241,0.25);padding:4px 13px;border-radius:99px;font-size:12px;font-weight:600">
                    Auto-flagged
                  </span>
                }
              </div>
            </div>

            <!-- Evidence photo — full remaining height -->
            <div class="evidence-zone" (click)="flag()!.evidence_image_url && !imageError() && openLightbox()">
              @if (flag()!.evidence_image_url && !imageError()) {
                <img [src]="imageUrl(flag()!.evidence_image_url!)" alt="Evidence capture" (error)="imageError.set(true)" />
                <button class="expand-btn" (click)="$event.stopPropagation(); openLightbox()" title="Cinematic zoom">⛶</button>
              } @else {
                <div class="no-photo">
                  <span style="font-size:40px">📷</span>
                  <span style="font-size:13px">No evidence image</span>
                </div>
              }
            </div>
          </div>

          <!-- ══ RIGHT — Metadata · AI · Action ══ -->
          <div class="right-col">

            <!-- 1. Event Details -->
            <div class="section">
              <p class="section-heading">Event Details</p>
              <div class="meta-grid">
                <div class="meta-card">
                  <p class="meta-lbl">Flag ID</p>
                  <p class="meta-val">#{{ flag()!.id }}</p>
                </div>
                <div class="meta-card">
                  <p class="meta-lbl">Parking lot</p>
                  <p class="meta-val">#{{ flag()!.parking_id }}</p>
                </div>
                <div class="meta-card">
                  <p class="meta-lbl">Time</p>
                  <p class="meta-val">{{ flag()!.detected_at | date:'HH:mm' }}</p>
                </div>
                <div class="meta-card">
                  <p class="meta-lbl">Date</p>
                  <p class="meta-val" style="font-size:16px">{{ flag()!.detected_at | date:'dd MMM yyyy' }}</p>
                </div>
              </div>
            </div>

            <!-- 2. AI Diagnostic Card -->
            <div class="section">
              <p class="section-heading" style="display:flex;align-items:center;gap:6px">
                <span>✦</span> AI Diagnostic
              </p>
              <div class="ai-card" [style]="aiCardStyle(flag()!)">
                <p class="ai-card-title">{{ violationTitle(flag()!.type) }}</p>
                <p class="ai-card-body">{{ violationSummary(flag()!) }}</p>
                @if (flag()!.confidence_score !== null) {
                  <div class="ai-card-conf" [style]="confidencePillStyle(flag()!.confidence_score!)">
                    <div class="conf-track">
                      <div class="conf-fill {{ confidenceFillClass(flag()!.confidence_score!) }}"
                           [style.width.%]="flag()!.confidence_score! * 100"></div>
                    </div>
                    <span>OCR {{ (flag()!.confidence_score! * 100).toFixed(0) }}% — {{ confidenceLabel(flag()!.confidence_score!) }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- 3. Verification / Result -->
            <div class="section">
              @if (flag()!.verified_by_human) {
                <p class="section-heading">Verification Result</p>

                @if (flag()!.verification_notes?.startsWith('[REJECTED BY OFFICER]')) {
                  <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:16px;display:flex;align-items:center;gap:14px;margin-bottom:14px">
                    <div style="width:38px;height:38px;border-radius:50%;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;color:#f87171;font-size:18px;flex-shrink:0">✗</div>
                    <div>
                      <p style="color:#f8fafc;font-weight:700;font-size:15px">Rejected</p>
                      <p style="color:#94a3b8;font-size:13px;margin-top:3px">Officer dismissed this flag</p>
                    </div>
                  </div>
                } @else {
                  <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:12px;padding:16px;display:flex;align-items:center;gap:14px;margin-bottom:14px">
                    <div style="width:38px;height:38px;border-radius:50%;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;color:#34d399;font-size:18px;flex-shrink:0">✓</div>
                    <div>
                      <p style="color:#f8fafc;font-weight:700;font-size:15px">Confirmed</p>
                      <p style="color:#94a3b8;font-size:13px;margin-top:3px">Officer approved — valid violation</p>
                    </div>
                  </div>
                }
                @if (flag()!.verification_notes) {
                  <div style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px">
                    <p class="meta-lbl" style="margin-bottom:6px">Officer notes</p>
                    <p style="color:#cbd5e1;font-size:14px;line-height:1.7">{{ flag()!.verification_notes }}</p>
                  </div>
                }

              } @else if (flag()!.requires_human_verification) {
                <p class="section-heading">Officer Decision</p>

                @if (submitSuccess()) {
                  <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:13px 15px;color:#6ee7b7;font-size:14px;font-weight:500;margin-bottom:16px">
                    ✓ Verification submitted successfully.
                  </div>
                }
                @if (submitError()) {
                  <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:13px 15px;color:#fca5a5;font-size:14px;font-weight:500;margin-bottom:16px">
                    {{ submitError() }}
                  </div>
                }

                <div style="display:flex;flex-direction:column;gap:20px">
                  <!-- Decision buttons -->
                  <div>
                    <p class="field-lbl">Your decision</p>
                    <div style="display:flex;gap:8px">
                      <button type="button" class="btn-c" [class.sel]="isValid() === true" (click)="isValid.set(true)">✓ Confirm</button>
                      <button type="button" class="btn-d" [class.sel]="isValid() === false" (click)="isValid.set(false)">✗ Dismiss</button>
                    </div>
                  </div>

                  <!-- Corrected plate -->
                  <div>
                    <label class="field-lbl">
                      Corrected plate
                      <span style="text-transform:none;letter-spacing:0;font-weight:400;color:#475569;font-size:11px"> — if OCR misread</span>
                    </label>
                    <input type="text" [(ngModel)]="correctedPlate"
                           placeholder="Leave empty if plate is correct"
                           class="field" style="font-family:'JetBrains Mono',monospace" />
                  </div>

                  <!-- Notes -->
                  <div>
                    <label class="field-lbl">Notes</label>
                    <textarea [(ngModel)]="notes" rows="3" placeholder="Optional officer notes..." class="field" style="resize:none"></textarea>
                  </div>

                  <!-- Submit -->
                  <button class="btn-submit" (click)="submitVerification()" [disabled]="isValid() === null || submitting()">
                    @if (submitting()) {
                      <span style="display:flex;align-items:center;justify-content:center;gap:8px">
                        <span class="animate-spin">⟳</span> Submitting...
                      </span>
                    } @else { Submit Verification }
                  </button>
                </div>

              } @else {
                <p class="section-heading">Status</p>
                <div style="background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:16px">
                  <p style="color:#a5b4fc;font-weight:700;font-size:15px;margin-bottom:6px">Auto-processed</p>
                  <p style="color:#94a3b8;font-size:14px;line-height:1.7">
                    AI confidence exceeded 85%. This flag was automatically confirmed — no officer action required.
                  </p>
                </div>
              }
            </div>

          </div>
        </div>

        <!-- ══ LIGHTBOX ══ -->
        @if (lightboxOpen()) {
          <div class="lightbox-overlay" (click)="closeLightbox()">
            <div class="lb-container"
                 [class.dragging]="isDragging()"
                 (click)="$event.stopPropagation()"
                 (wheel)="onWheel($event)"
                 (mousedown)="onDragStart($event)"
                 (mousemove)="onDrag($event)"
                 (mouseup)="onDragEnd()"
                 (mouseleave)="onDragEnd()">
              <img [src]="imageUrl(flag()!.evidence_image_url!)" alt="Evidence" [style.transform]="imgTransform()" />
            </div>
            <button class="lb-close" (click)="closeLightbox()">×</button>
            <div class="lb-zoom">{{ (zoomLevel() * 100).toFixed(0) }}%</div>
            <div class="lb-hint">Scroll to zoom · Drag to pan · Esc to close</div>
          </div>
        }
      }
    </div>
  `,
})
export class FlagDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly flagsService = inject(FlagsService);
  private readonly toast = inject(ToastService);

  readonly flag = signal<FlaggedCar | undefined>(undefined);
  readonly loading = signal(true);
  readonly imageError = signal(false);

  // Form
  isValid = signal<boolean | null>(null);
  correctedPlate = '';
  notes = '';
  submitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal('');

  // Lightbox
  readonly lightboxOpen = signal(false);
  readonly zoomLevel = signal(1);
  readonly panX = signal(0);
  readonly panY = signal(0);
  readonly isDragging = signal(false);
  private _dragStartX = 0;
  private _dragStartY = 0;

  readonly imgTransform = computed(() =>
    `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoomLevel()})`
  );

  flagLabel = (t: any) => FLAG_TYPE_LABELS[t as keyof typeof FLAG_TYPE_LABELS] ?? t;
  flagColors = (t: any) => FLAG_TYPE_COLORS[t as keyof typeof FLAG_TYPE_COLORS] ?? '';

  imageUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('data:image')) return path;
    return `data:image/jpeg;base64,${path}`;
  }

  // ── Violation helpers ──
  violationTitle(type: string): string {
    switch (type) {
      case 'no_subscription':                  return 'Unregistered Vehicle';
      case 'subscription_expired':             return 'Expired Subscription';
      case 'car_in_wrong_parking':             return 'Wrong Parking Lot';
      case 'subscription_close_to_expiration': return 'Subscription Expiring Soon';
      default: return 'Violation Detected';
    }
  }

  violationSummary(flag: FlaggedCar): string {
    const conf = flag.confidence_score !== null
      ? `OCR read the plate with ${(flag.confidence_score * 100).toFixed(0)}% confidence. `
      : '';
    switch (flag.type) {
      case 'no_subscription':
        return conf + 'No active parking subscription was found for this vehicle. It appears to have never been registered.';
      case 'subscription_expired':
        return conf + 'This vehicle had a valid subscription for this lot, but it has since expired.';
      case 'car_in_wrong_parking':
        return conf + 'An active subscription exists, but it is for a different parking lot.';
      case 'subscription_close_to_expiration':
        return 'This vehicle\'s subscription expires within 5 days. Flagged as a preventive warning.';
      default:
        return conf + 'A violation was detected by the enforcement engine.';
    }
  }

  // ── AI card style: orange tint if review needed, red if no_sub, etc. ──
  aiCardStyle(flag: FlaggedCar): string {
    const needsReview = flag.requires_human_verification && !flag.verified_by_human;
    if (needsReview)
      return 'background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.22);border-radius:12px';
    if (flag.type === 'no_subscription' || flag.type === 'subscription_expired')
      return 'background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:12px';
    if (flag.type === 'subscription_close_to_expiration')
      return 'background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:12px';
    return 'background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.2);border-radius:12px';
  }

  // ── Confidence helpers ──
  confidenceColor(score: number): string {
    if (score >= 0.85) return '#34d399';
    if (score >= 0.5)  return '#fbbf24';
    return '#f87171';
  }

  confidenceFillClass(score: number): string {
    if (score >= 0.85) return 'fill-high';
    if (score >= 0.5)  return 'fill-mid';
    return 'fill-low';
  }

  confidenceLabel(score: number): string {
    if (score >= 0.85) return 'High confidence';
    if (score >= 0.5)  return 'Below optimal threshold';
    return 'Unreliable reading';
  }

  confidencePillStyle(score: number): string {
    if (score >= 0.85)
      return 'background:rgba(16,185,129,0.1);color:#6ee7b7;border:1px solid rgba(16,185,129,0.2)';
    if (score >= 0.5)
      return 'background:rgba(245,158,11,0.1);color:#fcd34d;border:1px solid rgba(245,158,11,0.22)';
    return 'background:rgba(239,68,68,0.1);color:#fca5a5;border:1px solid rgba(239,68,68,0.22)';
  }

  // ── Lightbox ──
  openLightbox() {
    this.lightboxOpen.set(true);
    this.zoomLevel.set(1); this.panX.set(0); this.panY.set(0);
  }
  closeLightbox() { this.lightboxOpen.set(false); this.isDragging.set(false); }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    const d = e.deltaY > 0 ? -0.12 : 0.12;
    this.zoomLevel.update(z => Math.min(6, Math.max(1, z + d)));
    if (this.zoomLevel() === 1) { this.panX.set(0); this.panY.set(0); }
  }
  onDragStart(e: MouseEvent) {
    if (this.zoomLevel() <= 1) return;
    this.isDragging.set(true);
    this._dragStartX = e.clientX - this.panX();
    this._dragStartY = e.clientY - this.panY();
  }
  onDrag(e: MouseEvent) {
    if (!this.isDragging()) return;
    this.panX.set(e.clientX - this._dragStartX);
    this.panY.set(e.clientY - this._dragStartY);
  }
  onDragEnd() { this.isDragging.set(false); }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.lightboxOpen()) this.closeLightbox(); }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const cached = this.flagsService.getFlag(id);
    if (cached) { this.flag.set(cached); this.loading.set(false); }
    else {
      this.flagsService.loadFlags().subscribe({
        next:  () => { this.flag.set(this.flagsService.getFlag(id)); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    }
  }

  submitVerification() {
    if (this.isValid() === null || !this.flag()) return;
    this.submitting.set(true); this.submitError.set('');
    this.flagsService.verifyFlag(this.flag()!.id, {
      is_valid_violation: this.isValid()!,
      notes: this.notes || undefined,
      corrected_plate: this.correctedPlate || undefined,
    }).subscribe({
      next: (updated) => {
        this.flag.set(updated); this.submitSuccess.set(true); this.submitting.set(false);
        this.isValid() ? this.toast.success('Violation confirmed.') : this.toast.info('Flag dismissed.');
      },
      error: () => {
        this.submitError.set('Submission failed. Please try again.');
        this.submitting.set(false); this.toast.error('Submission failed.');
      },
    });
  }
}
