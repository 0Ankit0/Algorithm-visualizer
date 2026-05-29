import type { AlgorithmDescriptor, AlgorithmType, StudyItem, VisualizationResponse } from '@/lib/types';
import { fallbackAlgorithmDescriptors, fallbackAlgorithmOptions } from '@/src/constants/algorithms';

export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

export async function fetchAlgorithms(): Promise<AlgorithmDescriptor[]> {
  const response = await fetch(`${API_BASE}/api/algorithms`);
  const data = (await response.json()) as Array<AlgorithmDescriptor | AlgorithmType>;

  if (Array.isArray(data) && data.length > 0 && typeof data[0] !== 'string') {
    return data as AlgorithmDescriptor[];
  }

  if (Array.isArray(data) && data.length > 0) {
    return (data as AlgorithmType[]).map((algorithm) => ({
      algorithm,
      label: fallbackAlgorithmOptions.find((option) => option.value === algorithm)?.label ?? algorithm,
      category: 'other',
      fields: [],
      sample_presets: [],
    }));
  }

  return fallbackAlgorithmDescriptors;
}

export async function fetchStudyMode(): Promise<StudyItem[]> {
  const response = await fetch(`${API_BASE}/api/study-mode`);
  return (await response.json()) as StudyItem[];
}

export async function generateVisualization(requestBody: Record<string, unknown>): Promise<VisualizationResponse> {
  const response = await fetch(`${API_BASE}/api/custom-visualize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const data = (await response.json()) as VisualizationResponse | { detail?: string };
  if (!response.ok) {
    throw new Error((data as { detail?: string }).detail ?? 'Failed to generate visualization.');
  }

  return data as VisualizationResponse;
}
