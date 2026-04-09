# Algorithms Roadmap & Inventory

This document defines a structured inventory for algorithms that can be visualized in the project. Each algorithm includes:
- **Prerequisites**
- **Input constraints**
- **Visual grammar**
- **Complexity tags** (best/average/worst)
- **Study Mode** canonical example
- **Custom Mode** user input schema

---

## Searching

### 1) Linear Search
- **Prerequisites**: Arrays/lists, iteration, equality comparison.
- **Input constraints**:
  - Array length `n >= 1`
  - Comparable element type (number or string)
  - Target value of same type
- **Visual grammar**:
  - **Array bars/cells** laid out left-to-right.
  - **Current pointer** highlights index `i`.
  - **Found marker** (success color) when `arr[i] == target`.
- **Complexity tags**: Best `O(1)`, Avg `O(n)`, Worst `O(n)`.
- **Study Mode (canonical input)**:
  - `array = [7, 2, 9, 4, 1, 8]`
  - `target = 4`
- **Custom Mode (input schema)**:
```json
{
  "array": ["number"],
  "target": "number"
}
```

### 2) Binary Search
- **Prerequisites**: Sorted arrays, midpoint computation, comparison operators.
- **Input constraints**:
  - Array must be sorted ascending
  - `n >= 1`
  - Target same type as array elements
- **Visual grammar**:
  - **Array bars/cells** with sorted order implied.
  - **Low/High pointers** (`l`, `r`) and **Mid pointer** (`m`).
  - Region outside `[l, r]` faded to show elimination.
- **Complexity tags**: Best `O(1)`, Avg `O(log n)`, Worst `O(log n)`.
- **Study Mode (canonical input)**:
  - `array = [1, 3, 5, 7, 9, 11, 13]`
  - `target = 9`
- **Custom Mode (input schema)**:
```json
{
  "array": ["number(sorted_asc)"],
  "target": "number"
}
```

### 3) Jump Search
- **Prerequisites**: Sorted arrays, block/jump stepping, linear scan in block.
- **Input constraints**:
  - Sorted ascending numeric array
  - `n >= 1`
  - Jump size `k` optional (`default = floor(sqrt(n))`)
- **Visual grammar**:
  - **Array bars/cells**.
  - **Jump pointer** moving block-to-block.
  - **Block window highlight** then **in-block linear pointer**.
- **Complexity tags**: Best `O(1)`, Avg `O(√n)`, Worst `O(√n)`.
- **Study Mode (canonical input)**:
  - `array = [1, 3, 6, 8, 11, 14, 18, 21, 25, 30]`
  - `target = 18`
- **Custom Mode (input schema)**:
```json
{
  "array": ["number(sorted_asc)"],
  "target": "number",
  "jump_size": "number(optional, >=1)"
}
```

### 4) Interpolation Search
- **Prerequisites**: Sorted numeric arrays, interpolation formula, index bounds.
- **Input constraints**:
  - Sorted ascending numeric array with roughly uniform distribution preferred
  - `n >= 1`
  - Requires `arr[low] != arr[high]` for interpolation step (or guarded handling)
- **Visual grammar**:
  - **Array bars/cells**.
  - **Low/High pointers** and computed **Probe pointer**.
  - Probe updates based on value ratio position.
- **Complexity tags**: Best `O(1)`, Avg `O(log log n)` (uniform), Worst `O(n)`.
- **Study Mode (canonical input)**:
  - `array = [10, 20, 30, 40, 50, 60, 70, 80]`
  - `target = 60`
- **Custom Mode (input schema)**:
```json
{
  "array": ["number(sorted_asc)"],
  "target": "number"
}
```

---

## Sorting

### 1) Bubble Sort
- **Prerequisites**: Adjacent comparison, swap operation, passes over array.
- **Input constraints**: Numeric array, `n >= 0`.
- **Visual grammar**:
  - **Array bars** (height = value).
  - **Compared pair pointers** (`j`, `j+1`).
  - **Swap animation** and **sorted suffix highlight**.
- **Complexity tags**: Best `O(n)` (optimized), Avg `O(n²)`, Worst `O(n²)`.
- **Study Mode**: `array = [5, 1, 4, 2, 8]`
- **Custom Mode schema**:
```json
{ "array": ["number"] }
```

### 2) Insertion Sort
- **Prerequisites**: Partition into sorted/unsorted, shifting elements.
- **Input constraints**: Numeric array, `n >= 0`.
- **Visual grammar**:
  - **Array bars/cells**.
  - **Key pointer** and backward scan pointer.
  - Sorted prefix highlighted after each insertion.
- **Complexity tags**: Best `O(n)`, Avg `O(n²)`, Worst `O(n²)`.
- **Study Mode**: `array = [9, 5, 1, 4, 3]`
- **Custom Mode schema**:
```json
{ "array": ["number"] }
```

### 3) Selection Sort
- **Prerequisites**: Min-element selection, index swapping.
- **Input constraints**: Numeric array, `n >= 0`.
- **Visual grammar**:
  - **Current index pointer** `i`.
  - **Scan pointer** `j` and **min pointer** `minIdx`.
  - Sorted prefix locked after each pass.
- **Complexity tags**: Best `O(n²)`, Avg `O(n²)`, Worst `O(n²)`.
- **Study Mode**: `array = [64, 25, 12, 22, 11]`
- **Custom Mode schema**:
```json
{ "array": ["number"] }
```

### 4) Merge Sort
- **Prerequisites**: Divide-and-conquer, recursion, merge procedure.
- **Input constraints**: Numeric array, `n >= 0`.
- **Visual grammar**:
  - **Split tree** or layered subarray blocks.
  - **Two-pointer merge view** for left/right halves.
  - Merged output section highlighted.
- **Complexity tags**: Best `O(n log n)`, Avg `O(n log n)`, Worst `O(n log n)`.
- **Study Mode**: `array = [38, 27, 43, 3, 9, 82, 10]`
- **Custom Mode schema**:
```json
{ "array": ["number"] }
```

### 5) Quick Sort
- **Prerequisites**: Partitioning, recursion/stack, pivot strategy.
- **Input constraints**: Numeric array, `n >= 0`.
- **Visual grammar**:
  - **Pivot marker**.
  - **Partition pointers** (`i`, `j`).
  - Recursive subranges boxed/highlighted.
- **Complexity tags**: Best `O(n log n)`, Avg `O(n log n)`, Worst `O(n²)`.
- **Study Mode**: `array = [10, 7, 8, 9, 1, 5]`
- **Custom Mode schema**:
```json
{
  "array": ["number"],
  "pivot_strategy": "string(optional: last|first|median3|random)"
}
```

### 6) Heap Sort
- **Prerequisites**: Binary heap properties, heapify/down-heap operation.
- **Input constraints**: Numeric array, `n >= 0`.
- **Visual grammar**:
  - **Array view** and optional **binary tree heap view**.
  - **Root/swap highlight** during extract-max.
  - Heap boundary index shrinking over time.
- **Complexity tags**: Best `O(n log n)`, Avg `O(n log n)`, Worst `O(n log n)`.
- **Study Mode**: `array = [12, 11, 13, 5, 6, 7]`
- **Custom Mode schema**:
```json
{ "array": ["number"] }
```

---

## Graph

### 1) Breadth-First Search (BFS)
- **Prerequisites**: Graph representation (adjacency list/matrix), queue, visited set.
- **Input constraints**:
  - Graph may be directed/undirected
  - Node IDs unique
  - Start node required
- **Visual grammar**:
  - **Graph nodes/edges**.
  - **Queue panel** and **visited state colors**.
  - Frontier level/ring highlight.
- **Complexity tags**: Best `O(V+E)`, Avg `O(V+E)`, Worst `O(V+E)`.
- **Study Mode**:
  - `nodes = ["A","B","C","D","E"]`
  - `edges = [["A","B"],["A","C"],["B","D"],["C","E"]]`
  - `start = "A"`
- **Custom Mode schema**:
```json
{
  "nodes": ["string"],
  "edges": [["string","string"]],
  "start": "string",
  "directed": "boolean(optional, default=false)"
}
```

### 2) Depth-First Search (DFS)
- **Prerequisites**: Stack or recursion, visited set, graph traversal order.
- **Input constraints**: Same as BFS.
- **Visual grammar**:
  - **Graph nodes/edges**.
  - **Call stack/explicit stack panel**.
  - Active path highlighted from root to current node.
- **Complexity tags**: Best `O(V+E)`, Avg `O(V+E)`, Worst `O(V+E)`.
- **Study Mode**:
  - `nodes = ["A","B","C","D","E"]`
  - `edges = [["A","B"],["A","C"],["B","D"],["C","E"]]`
  - `start = "A"`
- **Custom Mode schema**:
```json
{
  "nodes": ["string"],
  "edges": [["string","string"]],
  "start": "string",
  "directed": "boolean(optional, default=false)"
}
```

### 3) Dijkstra’s Shortest Path
- **Prerequisites**: Weighted graphs, priority queue/min-heap, relaxation.
- **Input constraints**:
  - Non-negative edge weights
  - Start node required
- **Visual grammar**:
  - **Graph nodes/weighted edges**.
  - **Distance table** and **priority queue panel**.
  - Edge relaxation animation and settled-node styling.
- **Complexity tags**: Best `O((V+E) log V)`, Avg `O((V+E) log V)`, Worst `O((V+E) log V)`.
- **Study Mode**:
  - `nodes = ["A","B","C","D"]`
  - `edges = [["A","B",1],["A","C",4],["B","C",2],["B","D",5],["C","D",1]]`
  - `start = "A"`
- **Custom Mode schema**:
```json
{
  "nodes": ["string"],
  "edges": [["string","string","number(weight>=0)"]],
  "start": "string",
  "directed": "boolean(optional, default=false)"
}
```

### 4) A* Search
- **Prerequisites**: Weighted graph/grid, heuristic function, open/closed sets.
- **Input constraints**:
  - Non-negative edge costs
  - Heuristic should be admissible/consistent for optimality
  - Start and goal required
- **Visual grammar**:
  - **Nodes with f/g/h labels** or grid cells.
  - **Open set / closed set** panels.
  - Path reconstruction highlight from goal back to start.
- **Complexity tags**: Best `O(E)` (ideal heuristic), Avg `~O(E) to O(E log V)`, Worst `O(E log V)` / exponential in pathological spaces.
- **Study Mode**:
  - `nodes = ["S","A","B","G"]`
  - `edges = [["S","A",1],["S","B",4],["A","B",2],["A","G",5],["B","G",1]]`
  - `heuristic = {"S":3,"A":2,"B":1,"G":0}`
  - `start = "S", goal = "G"`
- **Custom Mode schema**:
```json
{
  "nodes": ["string"],
  "edges": [["string","string","number(weight>=0)"]],
  "heuristic": {"nodeId": "number(>=0)"},
  "start": "string",
  "goal": "string",
  "directed": "boolean(optional, default=false)"
}
```

---

## Dynamic Programming

### 1) Fibonacci (Tabulation / Memoization)
- **Prerequisites**: Recurrence relation, base cases, table/cache.
- **Input constraints**:
  - `n` integer, `n >= 0`
  - Optional cap (e.g., `n <= 92` for 64-bit integer safety)
- **Visual grammar**:
  - **Table cells** for bottom-up values.
  - **Recursion tree + memo cache hits** for top-down.
- **Complexity tags**:
  - Tabulation: Best/Avg/Worst `O(n)` time, `O(n)` space
  - Memoization: Best/Avg/Worst `O(n)` time, `O(n)` space
- **Study Mode**: `n = 10`
- **Custom Mode schema**:
```json
{
  "n": "integer(>=0)",
  "mode": "string(tabulation|memoization)"
}
```

### 2) 0/1 Knapsack
- **Prerequisites**: DP state definition, 2D table transitions.
- **Input constraints**:
  - `weights.length == values.length == n`
  - Integer capacity `W >= 0`
  - Non-negative weights/values
- **Visual grammar**:
  - **2D table cells** (`i`, `w`) with transition arrows.
  - Optional include/exclude decision breadcrumbs.
- **Complexity tags**: Best/Avg/Worst `O(nW)` time, `O(nW)` space (or `O(W)` optimized space).
- **Study Mode**:
  - `weights = [1, 3, 4, 5]`
  - `values = [1, 4, 5, 7]`
  - `capacity = 7`
- **Custom Mode schema**:
```json
{
  "weights": ["integer(>=0)"],
  "values": ["integer(>=0)"],
  "capacity": "integer(>=0)"
}
```

### 3) Longest Common Subsequence (LCS)
- **Prerequisites**: String indexing, 2D DP table, backtracking.
- **Input constraints**:
  - Two strings `s1`, `s2`
  - Length limits for visualization readability (e.g., each <= 30)
- **Visual grammar**:
  - **2D table cells** indexed by string prefixes.
  - Match/mismatch color coding and backtrack path arrows.
- **Complexity tags**: Best/Avg/Worst `O(mn)` time, `O(mn)` space.
- **Study Mode**:
  - `s1 = "ABCBDAB"`
  - `s2 = "BDCABA"`
- **Custom Mode schema**:
```json
{
  "s1": "string",
  "s2": "string"
}
```

---

## Trees / Heaps

### 1) BST Insert / Search / Delete
- **Prerequisites**: Binary Search Tree invariant, recursion/iteration, parent-child links.
- **Input constraints**:
  - Keys must be comparable
  - Duplicate policy must be explicit (ignore, count, or directional insert)
- **Visual grammar**:
  - **Tree nodes/edges** in hierarchical layout.
  - Active traversal path highlighted.
  - Delete cases (leaf, one child, two children with successor) animated.
- **Complexity tags**:
  - Best `O(log n)`, Avg `O(log n)`, Worst `O(n)` (unbalanced)
- **Study Mode**:
  - Initial keys: `[50, 30, 70, 20, 40, 60, 80]`
  - Operation sequence: `search 40`, `insert 65`, `delete 30`
- **Custom Mode schema**:
```json
{
  "initial_keys": ["number"],
  "operations": [
    { "op": "insert|search|delete", "key": "number" }
  ],
  "duplicate_policy": "string(optional: ignore|count|right)"
}
```

### 2) Heap Operations (Min/Max Heap)
- **Prerequisites**: Complete binary tree as array, sift-up, sift-down.
- **Input constraints**:
  - Numeric keys
  - Heap type required (`min` or `max`)
- **Visual grammar**:
  - **Array representation** + optional **tree representation**.
  - Highlighted swap path during heapify operations.
- **Complexity tags**:
  - `insert`: Best `O(1)`, Avg/Worst `O(log n)`
  - `peek`: Best/Avg/Worst `O(1)`
  - `extract-root`: Best/Avg/Worst `O(log n)`
  - `build-heap`: Best/Avg/Worst `O(n)`
- **Study Mode**:
  - Start array: `[3, 1, 6, 5, 2, 4]`, type `max`
  - Operations: `build`, `insert 7`, `extract-root`
- **Custom Mode schema**:
```json
{
  "heap_type": "string(min|max)",
  "initial_array": ["number"],
  "operations": [
    { "op": "build|insert|peek|extract_root", "value": "number(optional)" }
  ]
}
```

---

## Strings

### 1) KMP (Knuth–Morris–Pratt)
- **Prerequisites**: Prefix-function/LPS array, pattern matching loop.
- **Input constraints**:
  - Non-empty pattern
  - Text and pattern strings (ASCII/Unicode policy should be explicit)
- **Visual grammar**:
  - **Text and pattern strips** with alignment pointer.
  - **LPS table cells** and fallback pointer jumps.
- **Complexity tags**: Best/Avg/Worst `O(n + m)`.
- **Study Mode**:
  - `text = "ABABDABACDABABCABAB"`
  - `pattern = "ABABCABAB"`
- **Custom Mode schema**:
```json
{
  "text": "string",
  "pattern": "string(non_empty)"
}
```

### 2) Rabin–Karp
- **Prerequisites**: Rolling hash, modular arithmetic, collision check.
- **Input constraints**:
  - Non-empty pattern
  - Hash base/modulus configurable or defaulted
- **Visual grammar**:
  - **Sliding window over text**.
  - Window hash vs pattern hash display.
  - Collision verification highlight for character-by-character check.
- **Complexity tags**: Best/Avg `O(n + m)`, Worst `O(nm)` (many collisions).
- **Study Mode**:
  - `text = "GEEKS FOR GEEKS"`
  - `pattern = "GEEK"`
- **Custom Mode schema**:
```json
{
  "text": "string",
  "pattern": "string(non_empty)",
  "base": "integer(optional)",
  "mod": "integer(optional, >0)"
}
```

---

## Notes for Implementation Consistency
- Use a shared visualization metadata shape for all algorithms:
```json
{
  "algorithm": "string",
  "category": "string",
  "prerequisites": ["string"],
  "input_constraints": ["string"],
  "visual_grammar": ["string"],
  "complexity": {
    "best": "string",
    "average": "string",
    "worst": "string"
  },
  "study_mode": "object",
  "custom_mode_schema": "object"
}
```
- Keep **Study Mode** deterministic for reproducible step-by-step playback.
- Validate **Custom Mode** input before execution and return user-friendly errors.
