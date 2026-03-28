export type AlgorithmType = 'linear_search' | 'binary_search' | 'bubble_sort';

export type VisualizationStep = {
  index: number;
  title: string;
  state: number[];
  explanation: string;
  highlighted_indices: number[];
};

export type StudyItem = {
  id: string;
  name: string;
  description: string;
  question: string;
  query: string;
  summary: string;
  algorithm: AlgorithmType;
  steps: VisualizationStep[];
};

export type VisualizationResponse = {
  algorithm: AlgorithmType;
  question: string;
  query: string;
  summary: string;
  steps: VisualizationStep[];
};

export type CustomVisualizer = {
  id: string;
  title: string;
  question: string;
  algorithm: AlgorithmType;
  query: string;
  summary: string;
  steps: VisualizationStep[];
  created_at: string;
  updated_at: string;
};

export type CreateCustomVisualizerRequest = {
  title: string;
  question: string;
  algorithm: AlgorithmType;
  query: string;
  summary: string;
  steps: VisualizationStep[];
};
