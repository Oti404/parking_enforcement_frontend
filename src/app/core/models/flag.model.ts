export type FlagType =
  | 'subscription_close_to_expiration'
  | 'subscription_expired'
  | 'car_in_wrong_parking'
  | 'no_subscription';

export interface FlaggedCar {
  id: number;
  type: FlagType;
  car_registration_no: string;
  parking_id: number;
  detected_at: string;
  confidence_score: number | null;
  evidence_image_url: string | null;
  requires_human_verification: boolean;
  verified_by_human: boolean;
  verification_notes: string | null;
}

export interface FlagVerificationUpdate {
  is_valid_violation: boolean;
  notes?: string;
  corrected_plate?: string;
}

export const FLAG_TYPE_LABELS: Record<FlagType, string> = {
  no_subscription: 'No Subscription',
  subscription_expired: 'Expired',
  car_in_wrong_parking: 'Wrong Parking',
  subscription_close_to_expiration: 'Expiring Soon',
};

export const FLAG_TYPE_COLORS: Record<FlagType, string> = {
  no_subscription: 'bg-red-500/20 text-red-400 border border-red-500/30',
  subscription_expired: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  car_in_wrong_parking: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  subscription_close_to_expiration: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
};
