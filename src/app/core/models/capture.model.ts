export interface ParkingLot {
  id: number;
  name: string;
  location: string;
  capacity: number;
}

export interface RawDetectionCreate {
  image_base64: string;
  parking_id: number;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  officer_id?: string;
  device_id?: string;
}

export type CaptureStatus = 'flagged' | 'ignored';

export interface RawDetectionResponse {
  status: CaptureStatus;
  flag_id?: number;
  type?: string;
  message?: string;
  request_id: string;
  timestamp: string;
  parking_id: number;
  detected_plate: string;
  confidence_score: number;
  requires_human_verification: boolean;
  plate_obscured: boolean;
  vehicle_color?: string | null;
  vehicle_type?: string | null;
  evidence_image_url: string;
  analysis_notes: string;
  model_version: string;
}
