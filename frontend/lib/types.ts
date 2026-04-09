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

export type VariablesPanel = {
  position?: 'left' | 'right' | 'mid';
  left?: number | string;
  right?: number | string;
  mid?: number | string;
  distance_map?: Record<string, number>;
  heap_size?: number;
  values?: Record<string, unknown>;
};

export type ArrayStatePayload = {
  kind: 'array_state';
  values: Array<number | string>;
  highlighted_indices: number[];
  variables?: VariablesPanel;
};

export type GraphStatePayload = {
  kind: 'graph_state';
  nodes: Array<string | number | Record<string, unknown>>;
  edges: Array<Array<unknown> | Record<string, unknown>>;
  active_nodes: Array<string | number>;
  active_edges: Array<Array<unknown> | Record<string, unknown> | string | number>;
  variables?: VariablesPanel;
};

export type MatrixStatePayload = {
  kind: 'matrix_state';
  cells: Array<Array<number | string>>;
  highlighted_cells: Array<{ row: number; col: number }>;
  variables?: VariablesPanel;
};

export type TreeStatePayload = {
  kind: 'tree_state';
  nodes: Array<string | number | Record<string, unknown>>;
  links: Array<Array<unknown> | Record<string, unknown>>;
  active_path: Array<string | number>;
  variables?: VariablesPanel;
};

export type StepStatePayload = ArrayStatePayload | GraphStatePayload | MatrixStatePayload | TreeStatePayload;

export type VisualizationStep = {
  index: number;
  title: string;
  state: Array<number | string> | StepStatePayload;
  explanation: string;
  highlighted_indices: number[];
};

export function getStepValues(state: VisualizationStep['state']): Array<number | string> {
  if (Array.isArray(state)) {
    return state;
  }
  if (state.kind === 'array_state') {
    return state.values;
  }
  return [];
}

export function getStepHighlightedIndices(step: VisualizationStep): number[] {
  if (!Array.isArray(step.state) && step.state.kind === 'array_state' && step.state.highlighted_indices.length > 0) {
    return step.state.highlighted_indices;
  }
  return step.highlighted_indices;
}

export type StudyItem = {
  id: string;
  name: string;
  description: string;
  question: string;
  query: string;
  summary: string;
  algorithm: AlgorithmType;
  steps: VisualizationStep[];
  lesson: {
    problem_statement: string;
    why_this_algorithm: string;
    step_by_step_trace: string;
    final_result: string;
    complexity_takeaway: string;
    common_mistakes: string;
    concept_intro: string;
    key_invariants: string[];
    complexity_card: string;
    when_to_use: string;
    when_to_avoid: string;
    scenario_example: string;
  };
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
