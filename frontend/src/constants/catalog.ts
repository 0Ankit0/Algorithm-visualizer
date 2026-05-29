import type { AlgorithmType } from '@/lib/types';

type CatalogItem = {
  label: string;
  algorithm: AlgorithmType;
  description: string;
};

export type CatalogSection = {
  id: string;
  title: string;
  subtitle: string;
  items: CatalogItem[];
};

export const catalogSections: CatalogSection[] = [
  {
    id: 'searching',
    title: 'Searching',
    subtitle: 'Find target values efficiently',
    items: [
      { label: 'Linear Search', algorithm: 'linear_search', description: 'Scan elements one by one.' },
      { label: 'Binary Search', algorithm: 'binary_search', description: 'Divide sorted range repeatedly.' },
      { label: 'Jump Search', algorithm: 'jump_search', description: 'Jump blocks, then linear scan.' },
      { label: 'Interpolation Search', algorithm: 'interpolation_search', description: 'Probe by estimated position.' },
    ],
  },
  {
    id: 'sorting',
    title: 'Sorting',
    subtitle: 'Reorder values into sorted order',
    items: [
      { label: 'Bubble Sort', algorithm: 'bubble_sort', description: 'Swap adjacent out-of-order values.' },
      { label: 'Insertion Sort', algorithm: 'insertion_sort', description: 'Grow a sorted prefix.' },
      { label: 'Selection Sort', algorithm: 'selection_sort', description: 'Select minimum each pass.' },
      { label: 'Merge Sort', algorithm: 'merge_sort', description: 'Divide and merge recursively.' },
      { label: 'Quick Sort', algorithm: 'quick_sort', description: 'Partition around pivots.' },
      { label: 'Heap Sort', algorithm: 'heap_sort', description: 'Heapify then extract maximums.' },
    ],
  },
  {
    id: 'graphs',
    title: 'Graph Algorithms',
    subtitle: 'Traverse and optimize paths',
    items: [
      { label: 'BFS', algorithm: 'bfs', description: 'Visit nodes level by level.' },
      { label: 'DFS', algorithm: 'dfs', description: 'Visit nodes depth first.' },
      { label: 'Dijkstra', algorithm: 'dijkstra', description: 'Shortest path with nonnegative weights.' },
      { label: 'A*', algorithm: 'a_star', description: 'Heuristic-guided shortest path.' },
    ],
  },
  {
    id: 'dynamic-programming',
    title: 'Dynamic Programming',
    subtitle: 'Build solutions from subproblems',
    items: [
      { label: 'Fibonacci (Tabulation)', algorithm: 'fibonacci_tabulation', description: 'Bottom-up Fibonacci table.' },
      { label: 'Fibonacci (Memoization)', algorithm: 'fibonacci_memoization', description: 'Top-down cached recursion.' },
      { label: '0/1 Knapsack', algorithm: 'knapsack_01', description: 'Max value under capacity constraint.' },
      { label: 'LCS', algorithm: 'lcs', description: 'Longest common subsequence.' },
    ],
  },
  {
    id: 'tree-heap',
    title: 'Tree and Heap',
    subtitle: 'Hierarchical and priority structures',
    items: [
      { label: 'BST Operations', algorithm: 'bst_operations', description: 'Insert/search/delete in BST.' },
      { label: 'Heap Operations', algorithm: 'heap_operations', description: 'Build, insert, and extract.' },
    ],
  },
  {
    id: 'string',
    title: 'String Algorithms',
    subtitle: 'Pattern matching and hashing',
    items: [
      { label: 'KMP', algorithm: 'kmp', description: 'Prefix-function based pattern matching.' },
      { label: 'Rabin-Karp', algorithm: 'rabin_karp', description: 'Rolling hash pattern matching.' },
    ],
  },
];
