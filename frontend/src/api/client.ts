import type { Assessment, CreateAssessmentPayload } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

export async function fetchAssessments(): Promise<Assessment[]> {
  const response = await fetch(`${API_BASE_URL}/assessments`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch assessments');
  }
  return response.json();
}

export async function fetchAssessmentById(id: string): Promise<Assessment> {
  const response = await fetch(`${API_BASE_URL}/assessments/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch assessment ${id}`);
  }
  return response.json();
}

export async function createAssessment(payload: CreateAssessmentPayload): Promise<Assessment> {
  const response = await fetch(`${API_BASE_URL}/assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create location assessment');
  }

  return response.json();
}
