export interface Factor {
  id: string;
  assessment_id: string;
  factor_name: string;
  raw_value: string | null;
  points: number | null;
  max_points: number;
  source: string;
  status: 'available' | 'unavailable';
  reason: string | null;
  created_at: string;
}

export interface Assessment {
  id: string;
  label: string;
  address: string | null;
  latitude: number;
  longitude: number;
  total_score: number | null;
  created_at: string;
  factors: Factor[];
}

export interface CreateAssessmentPayload {
  label: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}
