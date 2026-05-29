import type { AlgorithmDescriptor, AlgorithmType } from '@/lib/types';

export const fallbackAlgorithmOptions: Array<{ label: string; value: AlgorithmType }> = [
  { label: 'Linear Search', value: 'linear_search' },
  { label: 'Binary Search', value: 'binary_search' },
  { label: 'Jump Search', value: 'jump_search' },
  { label: 'Interpolation Search', value: 'interpolation_search' },
  { label: 'Bubble Sort', value: 'bubble_sort' },
  { label: 'Insertion Sort', value: 'insertion_sort' },
  { label: 'Selection Sort', value: 'selection_sort' },
  { label: 'Merge Sort', value: 'merge_sort' },
  { label: 'Quick Sort', value: 'quick_sort' },
  { label: 'Heap Sort', value: 'heap_sort' },
  { label: 'BFS', value: 'bfs' },
  { label: 'DFS', value: 'dfs' },
  { label: 'Dijkstra', value: 'dijkstra' },
  { label: 'A*', value: 'a_star' },
  { label: 'Fibonacci (Tabulation)', value: 'fibonacci_tabulation' },
  { label: 'Fibonacci (Memoization)', value: 'fibonacci_memoization' },
  { label: '0/1 Knapsack', value: 'knapsack_01' },
  { label: 'LCS', value: 'lcs' },
  { label: 'BST Operations', value: 'bst_operations' },
  { label: 'Heap Operations', value: 'heap_operations' },
  { label: 'KMP', value: 'kmp' },
  { label: 'Rabin-Karp', value: 'rabin_karp' },
];

export const fallbackAlgorithmDescriptors: AlgorithmDescriptor[] = fallbackAlgorithmOptions.map((item) => ({
  algorithm: item.value,
  label: item.label,
  category: 'other',
  fields: [],
  sample_presets: [],
}));
