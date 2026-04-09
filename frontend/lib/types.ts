export type AlgorithmType =
  | 'linear_search'
  | 'binary_search'
  | 'jump_search'
  | 'interpolation_search'
  | 'bubble_sort'
  | 'insertion_sort'
  | 'selection_sort'
  | 'merge_sort'
  | 'quick_sort'
  | 'heap_sort'
  | 'bfs'
  | 'dfs'
  | 'dijkstra'
  | 'a_star'
  | 'fibonacci_tabulation'
  | 'fibonacci_memoization'
  | 'knapsack_01'
  | 'lcs'
  | 'bst_operations'
  | 'heap_operations'
  | 'kmp'
  | 'rabin_karp';

export type VisualizationStep = {
  index: number;
  title: string;
  state: Array<number | string>;
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
