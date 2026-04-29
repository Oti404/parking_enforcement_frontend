import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ParkingLot, RawDetectionCreate, RawDetectionResponse } from '../models/capture.model';

@Injectable({ providedIn: 'root' })
export class CaptureService {
  private readonly http = inject(HttpClient);

  loadParkings() {
    return this.http.get<ParkingLot[]>(`${environment.apiUrl}/api/v1/parkings`);
  }

  submitCapture(payload: RawDetectionCreate) {
    return this.http.post<RawDetectionResponse>(`${environment.apiUrl}/api/v1/captures`, payload);
  }
}
