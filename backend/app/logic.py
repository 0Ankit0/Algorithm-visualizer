from __future__ import annotations

import math
from collections import deque
import heapq

from .algorithms import ALGORITHM_REGISTRY
from .explanation_rubric import rubricize_legacy_explanation
from .algorithms.search import binary_search_steps, interpolation_search_steps, jump_search_steps, linear_search_steps
from .algorithms.sort import bubble_sort_steps, heap_sort_steps, insertion_sort_steps, merge_sort_steps, quick_sort_steps, selection_sort_steps
from .models import StudyItem, VisualizationResponse, VisualizationStep


def _step(steps: list[VisualizationStep], title: str, state: list[int | str], explanation: str, highlighted: list[int] | None = None) -> None:
    steps.append(
        VisualizationStep(
            index=len(steps) + 1,
            title=title,
            state=state,
            highlighted_indices=highlighted or [],
            explanation=rubricize_legacy_explanation(title, explanation),
        )
    )


def _graph_state(nodes: list[str]) -> list[str]:
    return nodes


def _bfs_steps(nodes: list[str], edges: list[list[str]], start: str) -> list[VisualizationStep]:
    adj = {n: [] for n in nodes}
    for u, v in edges:
        adj.setdefault(u, []).append(v)
    seen = {start}
    q: deque[str] = deque([start])
    steps: list[VisualizationStep] = []
    while q:
        cur = q.popleft()
        idx = nodes.index(cur) if cur in nodes else 0
        _step(steps, "Visit", _graph_state(nodes), f"Visit {cur}. Queue: {list(q)}", [idx])
        for nb in adj.get(cur, []):
            if nb not in seen:
                seen.add(nb)
                q.append(nb)
                _step(steps, "Enqueue", _graph_state(nodes), f"Discovered {nb} from {cur}.", [nodes.index(nb)])
    return steps


def _dfs_steps(nodes: list[str], edges: list[list[str]], start: str) -> list[VisualizationStep]:
    adj = {n: [] for n in nodes}
    for u, v in edges:
        adj.setdefault(u, []).append(v)
    seen: set[str] = set()
    steps: list[VisualizationStep] = []

    def dfs(cur: str) -> None:
        seen.add(cur)
        _step(steps, "Visit", _graph_state(nodes), f"DFS enter {cur}.", [nodes.index(cur)])
        for nb in adj.get(cur, []):
            if nb not in seen:
                dfs(nb)
        _step(steps, "Backtrack", _graph_state(nodes), f"DFS leave {cur}.", [nodes.index(cur)])

    dfs(start)
    return steps


def _dijkstra_steps(nodes: list[str], edges: list[list[int | str]], start: str) -> list[VisualizationStep]:
    adj: dict[str, list[tuple[str, int]]] = {n: [] for n in nodes}
    for u, v, w in edges:
        adj[str(u)].append((str(v), int(w)))
    dist = {n: math.inf for n in nodes}
    dist[start] = 0
    pq: list[tuple[int, str]] = [(0, start)]
    steps: list[VisualizationStep] = []
    while pq:
        d, cur = heapq.heappop(pq)
        if d > dist[cur]:
            continue
        _step(steps, "Settle node", nodes, f"Pop {cur} with distance {d}.", [nodes.index(cur)])
        for nb, w in adj.get(cur, []):
            nd = d + w
            if nd < dist[nb]:
                dist[nb] = nd
                heapq.heappush(pq, (nd, nb))
                _step(steps, "Relax edge", nodes, f"Update dist[{nb}] to {nd} via {cur}.", [nodes.index(nb)])
    return steps


def _a_star_steps(nodes: list[str], edges: list[list[int | str]], heuristic: dict[str, int], start: str, goal: str) -> list[VisualizationStep]:
    adj: dict[str, list[tuple[str, int]]] = {n: [] for n in nodes}
    for u, v, w in edges:
        adj[str(u)].append((str(v), int(w)))
    g = {n: math.inf for n in nodes}
    g[start] = 0
    open_heap: list[tuple[int, str]] = [(heuristic.get(start, 0), start)]
    came_from: dict[str, str] = {}
    steps: list[VisualizationStep] = []
    while open_heap:
        _, cur = heapq.heappop(open_heap)
        _step(steps, "Expand", nodes, f"Expand {cur}.", [nodes.index(cur)])
        if cur == goal:
            path = [goal]
            while path[-1] in came_from:
                path.append(came_from[path[-1]])
            path.reverse()
            _step(steps, "Path found", path, f"A* path: {' -> '.join(path)}.", list(range(len(path))))
            return steps
        for nb, w in adj.get(cur, []):
            tentative = g[cur] + w
            if tentative < g[nb]:
                came_from[nb] = cur
                g[nb] = tentative
                f = tentative + heuristic.get(nb, 0)
                heapq.heappush(open_heap, (f, nb))
                _step(steps, "Update neighbor", nodes, f"Update {nb}: g={tentative}, f={f}.", [nodes.index(nb)])
    return steps


def _fibonacci_steps(n: int, memoized: bool) -> list[VisualizationStep]:
    steps: list[VisualizationStep] = []
    if memoized:
        memo: dict[int, int] = {}

        def fib(x: int) -> int:
            if x in memo:
                _step(steps, "Memo hit", [f"f({k})={v}" for k, v in sorted(memo.items())], f"Reuse f({x})={memo[x]}.")
                return memo[x]
            if x < 2:
                memo[x] = x
            else:
                memo[x] = fib(x - 1) + fib(x - 2)
            _step(steps, "Memo write", [f"f({k})={v}" for k, v in sorted(memo.items())], f"Store f({x})={memo[x]}.")
            return memo[x]

        fib(n)
    else:
        table = [0] * (max(n, 1) + 1)
        if n >= 1:
            table[1] = 1
        for i in range(2, n + 1):
            table[i] = table[i - 1] + table[i - 2]
            _step(steps, "Tabulate", table[: i + 1], f"f({i})={table[i]}.", [i])
        if n < 2:
            _step(steps, "Base case", table[: n + 1], f"f({n})={table[n]}.", [n])
    return steps


def _knapsack_steps(weights: list[int], values: list[int], capacity: int) -> list[VisualizationStep]:
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    steps: list[VisualizationStep] = []
    for i in range(1, n + 1):
        for w in range(capacity + 1):
            if weights[i - 1] <= w:
                dp[i][w] = max(dp[i - 1][w], values[i - 1] + dp[i - 1][w - weights[i - 1]])
            else:
                dp[i][w] = dp[i - 1][w]
        _step(steps, f"Fill row {i}", [str(x) for x in dp[i]], f"Completed DP row for item {i}.")
    return steps


def _lcs_steps(s1: str, s2: str) -> list[VisualizationStep]:
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    steps: list[VisualizationStep] = []
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i - 1] == s2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
        _step(steps, f"Row {i}", [str(x) for x in dp[i]], f"Processed prefix s1[:{i}] = '{s1[:i]}'.")
    return steps


def _bst_operations_steps(initial_keys: list[int], operations: list[dict[str, int | str]]) -> list[VisualizationStep]:
    tree = sorted(initial_keys)
    steps: list[VisualizationStep] = []
    for op in operations:
        action = str(op.get("op", ""))
        key = int(op.get("key", 0))
        if action == "insert" and key not in tree:
            tree.append(key)
            tree.sort()
            _step(steps, "BST insert", tree.copy(), f"Insert key {key}.", [tree.index(key)])
        elif action == "search":
            found = key in tree
            idx = [tree.index(key)] if found else []
            _step(steps, "BST search", tree.copy(), f"Search key {key}: {'found' if found else 'not found'}.", idx)
        elif action == "delete":
            if key in tree:
                idx = tree.index(key)
                tree.remove(key)
                _step(steps, "BST delete", tree.copy(), f"Delete key {key} from index {idx}.")
            else:
                _step(steps, "BST delete", tree.copy(), f"Key {key} not found; no change.")
    return steps or [VisualizationStep(index=1, title="No-op", state=tree, highlighted_indices=[], explanation="No operations supplied.")]


def _heap_operations_steps(heap_type: str, initial_array: list[int], operations: list[dict[str, int | str]]) -> list[VisualizationStep]:
    sign = -1 if heap_type == "max" else 1
    heap = [sign * x for x in initial_array]
    heapq.heapify(heap)
    steps: list[VisualizationStep] = []
    _step(steps, "Build heap", [sign * x for x in heap], f"Built {heap_type} heap from initial array.")
    for op in operations:
        action = str(op.get("op", ""))
        if action == "insert":
            value = int(op.get("value", 0))
            heapq.heappush(heap, sign * value)
            _step(steps, "Heap insert", [sign * x for x in heap], f"Inserted {value}.")
        elif action == "peek" and heap:
            root = sign * heap[0]
            _step(steps, "Heap peek", [sign * x for x in heap], f"Root is {root}.", [0])
        elif action == "extract_root" and heap:
            root = sign * heapq.heappop(heap)
            _step(steps, "Heap extract", [sign * x for x in heap], f"Extracted root {root}.")
    return steps


def _kmp_steps(text: str, pattern: str) -> list[VisualizationStep]:
    if not pattern:
        return [
            VisualizationStep(
                index=1,
                title="Invalid",
                state=[text],
                highlighted_indices=[],
                explanation=rubricize_legacy_explanation("Invalid", "Pattern must be non-empty."),
            )
        ]
    lps = [0] * len(pattern)
    length, i = 0, 1
    steps: list[VisualizationStep] = []
    while i < len(pattern):
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length != 0:
            length = lps[length - 1]
        else:
            lps[i] = 0
            i += 1
    _step(steps, "Build LPS", [str(x) for x in lps], f"LPS for pattern '{pattern}'.")
    ti = pj = 0
    while ti < len(text):
        _step(steps, "Compare", [text, pattern], f"Compare text[{ti}] and pattern[{pj}].", [0, 1])
        if text[ti] == pattern[pj]:
            ti += 1
            pj += 1
            if pj == len(pattern):
                _step(steps, "Match", [text, pattern], f"Pattern found ending at text index {ti-1}.", [0])
                pj = lps[pj - 1]
        elif pj != 0:
            pj = lps[pj - 1]
        else:
            ti += 1
    return steps


def _rabin_karp_steps(text: str, pattern: str, base: int = 256, mod: int = 101) -> list[VisualizationStep]:
    m, n = len(pattern), len(text)
    if m == 0 or m > n:
        return [
            VisualizationStep(
                index=1,
                title="Invalid",
                state=[text, pattern],
                highlighted_indices=[],
                explanation=rubricize_legacy_explanation(
                    "Invalid", "Pattern must be non-empty and not longer than text."
                ),
            )
        ]
    h = pow(base, m - 1, mod)
    p_hash = 0
    t_hash = 0
    steps: list[VisualizationStep] = []
    for i in range(m):
        p_hash = (base * p_hash + ord(pattern[i])) % mod
        t_hash = (base * t_hash + ord(text[i])) % mod
    for i in range(n - m + 1):
        window = text[i : i + m]
        _step(steps, "Window hash", [window, pattern], f"Window '{window}' hash={t_hash}, pattern hash={p_hash}.", [0])
        if p_hash == t_hash and window == pattern:
            _step(steps, "Match", [window, pattern], f"Pattern found at index {i}.", [0])
        if i < n - m:
            t_hash = (base * (t_hash - ord(text[i]) * h) + ord(text[i + m])) % mod
            if t_hash < 0:
                t_hash += mod
    return steps


def build_custom_visualization(algorithm: str, question: str, numbers: list[int], target: int | None, payload: dict | None = None) -> VisualizationResponse:
    payload = payload or {}
    visualizer = ALGORITHM_REGISTRY.get(algorithm)
    if visualizer is not None:
        result = visualizer.visualize(numbers=numbers, target=target, payload=payload)
        return VisualizationResponse(
            algorithm=algorithm,
            question=question,
            query=result.metadata.query,
            summary=result.metadata.summary,
            steps=result.steps,
        )

    if algorithm == "bfs":
        nodes = payload.get("nodes", [])
        edges = payload.get("edges", [])
        start = payload.get("start")
        if not nodes or not edges or not start:
            raise ValueError("BFS requires payload.nodes, payload.edges, and payload.start.")
        steps = _bfs_steps(nodes, edges, start)
        query = f"BFS from {start}"
        summary = "BFS explores graph layer by layer using a queue."
    elif algorithm == "dfs":
        nodes, edges, start = payload.get("nodes", []), payload.get("edges", []), payload.get("start")
        if not nodes or not edges or not start:
            raise ValueError("DFS requires payload.nodes, payload.edges, and payload.start.")
        steps = _dfs_steps(nodes, edges, start)
        query = f"DFS from {start}"
        summary = "DFS explores as deep as possible before backtracking."
    elif algorithm == "dijkstra":
        nodes, edges, start = payload.get("nodes", []), payload.get("edges", []), payload.get("start")
        if not nodes or not edges or not start:
            raise ValueError("Dijkstra requires payload.nodes, payload.edges, and payload.start.")
        steps = _dijkstra_steps(nodes, edges, start)
        query = f"Dijkstra shortest paths from {start}"
        summary = "Dijkstra relaxes shortest paths with a priority queue."
    elif algorithm == "a_star":
        nodes = payload.get("nodes", [])
        edges = payload.get("edges", [])
        heuristic = payload.get("heuristic", {})
        start = payload.get("start")
        goal = payload.get("goal")
        if not nodes or not edges or start is None or goal is None:
            raise ValueError("A* requires payload.nodes, payload.edges, payload.start, and payload.goal.")
        steps = _a_star_steps(nodes, edges, heuristic, start, goal)
        query = f"A* from {start} to {goal}"
        summary = "A* uses g+h scoring to prioritize promising nodes."
    elif algorithm == "fibonacci_tabulation":
        n = int(payload.get("n", 0))
        steps = _fibonacci_steps(n, memoized=False)
        query = f"Fibonacci tabulation n={n}"
        summary = "Bottom-up Fibonacci builds values iteratively in a table."
    elif algorithm == "fibonacci_memoization":
        n = int(payload.get("n", 0))
        steps = _fibonacci_steps(n, memoized=True)
        query = f"Fibonacci memoization n={n}"
        summary = "Top-down Fibonacci caches recursive results."
    elif algorithm == "knapsack_01":
        weights = payload.get("weights", [])
        values = payload.get("values", [])
        capacity = int(payload.get("capacity", 0))
        if len(weights) != len(values):
            raise ValueError("knapsack_01 requires equal-length payload.weights and payload.values.")
        steps = _knapsack_steps(weights, values, capacity)
        query = f"0/1 knapsack with capacity {capacity}"
        summary = "0/1 knapsack DP decides include/exclude per item and capacity."
    elif algorithm == "lcs":
        s1 = str(payload.get("s1", ""))
        s2 = str(payload.get("s2", ""))
        steps = _lcs_steps(s1, s2)
        query = f"LCS between '{s1}' and '{s2}'"
        summary = "LCS DP computes longest shared subsequence across two strings."
    elif algorithm == "bst_operations":
        initial = payload.get("initial_keys", [])
        operations = payload.get("operations", [])
        steps = _bst_operations_steps(initial, operations)
        query = "BST operations"
        summary = "BST operation walkthrough for insert/search/delete."
    elif algorithm == "heap_operations":
        heap_type = str(payload.get("heap_type", "max"))
        initial = payload.get("initial_array", [])
        operations = payload.get("operations", [])
        steps = _heap_operations_steps(heap_type, initial, operations)
        query = f"{heap_type} heap operations"
        summary = "Heap operations walkthrough for build/peek/insert/extract."
    elif algorithm == "kmp":
        text = str(payload.get("text", ""))
        pattern = str(payload.get("pattern", ""))
        steps = _kmp_steps(text, pattern)
        query = f"KMP pattern '{pattern}' in text"
        summary = "KMP uses LPS to skip redundant comparisons."
    elif algorithm == "rabin_karp":
        text = str(payload.get("text", ""))
        pattern = str(payload.get("pattern", ""))
        base = int(payload.get("base", 256))
        mod = int(payload.get("mod", 101))
        steps = _rabin_karp_steps(text, pattern, base, mod)
        query = f"Rabin-Karp pattern '{pattern}' in text"
        summary = "Rabin-Karp compares rolling hashes before verification."
    else:
        raise ValueError("Unsupported algorithm.")

    return VisualizationResponse(algorithm=algorithm, question=question, query=query, summary=summary, steps=steps)


def study_mode_items() -> list[StudyItem]:
    def build_lesson(name: str, description: str, question: str, summary: str, algorithm: str, steps: list[VisualizationStep]) -> StudyItem.StudyLesson:
        if "search" in algorithm or algorithm in {"kmp", "rabin_karp", "bst_operations"}:
            scenario = "Found/not-found scenario: one run hits the target early, another scans/probes until exhausted."
        else:
            scenario = "Best-case/worst-case scenario: favorable structure minimizes work, while adversarial inputs trigger full work."

        return StudyItem.StudyLesson(
            problem_statement=question,
            why_this_algorithm=f"Use {name} when {description.lower()}",
            step_by_step_trace=f"The trace has {len(steps)} steps showing state transitions and decisions in order.",
            final_result=steps[-1].explanation if steps else "No result.",
            complexity_takeaway=summary,
            common_mistakes=f"Common pitfall: violating {name} prerequisites (like sorted input, valid graph assumptions, or update order).",
            concept_intro=f"{name}: {summary}",
            key_invariants=[
                "State changes are deterministic for the same input.",
                "Each step preserves the algorithm's core invariant.",
            ],
            complexity_card=summary,
            when_to_use=f"Use when the query matches {name}'s assumptions and you need explainable step progression.",
            when_to_avoid="Avoid when prerequisites are not met or when another algorithm provides better guarantees.",
            scenario_example=scenario,
        )

    catalog: list[StudyItem] = [
        StudyItem(id="study-linear-search", name="Linear Search", description="Check each element until target match.", question="Where is 7?", query="Linear search", summary="Sequential scan.", algorithm="linear_search", steps=linear_search_steps([7, 2, 9, 4, 1, 8], 4), lesson=build_lesson("Linear Search", "Check each element until target match.", "Where is 7?", "Time O(n), Space O(1).", "linear_search", linear_search_steps([7, 2, 9, 4, 1, 8], 4))),
        StudyItem(id="study-binary-search", name="Binary Search", description="Repeatedly halve sorted search range.", question="Can we find 9?", query="Binary search", summary="Halving strategy.", algorithm="binary_search", steps=binary_search_steps([1, 3, 5, 7, 9, 11, 13], 9), lesson=build_lesson("Binary Search", "Repeatedly halve sorted search range.", "Can we find 9?", "Time O(log n), Space O(1).", "binary_search", binary_search_steps([1, 3, 5, 7, 9, 11, 13], 9))),
        StudyItem(id="study-jump-search", name="Jump Search", description="Jump blocks then linear scan.", question="Can we find 18?", query="Jump search", summary="Block jumping strategy.", algorithm="jump_search", steps=jump_search_steps([1, 3, 6, 8, 11, 14, 18, 21, 25, 30], 18), lesson=build_lesson("Jump Search", "Jump blocks then linear scan.", "Can we find 18?", "Time O(√n), Space O(1).", "jump_search", jump_search_steps([1, 3, 6, 8, 11, 14, 18, 21, 25, 30], 18))),
        StudyItem(id="study-interpolation-search", name="Interpolation Search", description="Probe estimated index in sorted data.", question="Can we find 60?", query="Interpolation search", summary="Estimate target position.", algorithm="interpolation_search", steps=interpolation_search_steps([10, 20, 30, 40, 50, 60, 70, 80], 60), lesson=build_lesson("Interpolation Search", "Probe estimated index in sorted data.", "Can we find 60?", "Average O(log log n), worst O(n), Space O(1).", "interpolation_search", interpolation_search_steps([10, 20, 30, 40, 50, 60, 70, 80], 60))),
        StudyItem(id="study-bubble-sort", name="Bubble Sort", description="Adjacent compares and swaps.", question="Sort this array.", query="Bubble sort", summary="Repeated adjacent swapping.", algorithm="bubble_sort", steps=bubble_sort_steps([5, 1, 4, 2, 8]), lesson=build_lesson("Bubble Sort", "Adjacent compares and swaps.", "Sort this array.", "Best O(n), worst O(n²), Space O(1).", "bubble_sort", bubble_sort_steps([5, 1, 4, 2, 8]))),
        StudyItem(id="study-insertion-sort", name="Insertion Sort", description="Grow sorted prefix.", question="Sort this array.", query="Insertion sort", summary="Insert keys into sorted prefix.", algorithm="insertion_sort", steps=insertion_sort_steps([9, 5, 1, 4, 3]), lesson=build_lesson("Insertion Sort", "Grow sorted prefix.", "Sort this array.", "Best O(n), worst O(n²), Space O(1).", "insertion_sort", insertion_sort_steps([9, 5, 1, 4, 3]))),
        StudyItem(id="study-selection-sort", name="Selection Sort", description="Select min each pass.", question="Sort this array.", query="Selection sort", summary="Repeated minimum placement.", algorithm="selection_sort", steps=selection_sort_steps([64, 25, 12, 22, 11]), lesson=build_lesson("Selection Sort", "Select min each pass.", "Sort this array.", "Time O(n²), Space O(1).", "selection_sort", selection_sort_steps([64, 25, 12, 22, 11]))),
        StudyItem(id="study-merge-sort", name="Merge Sort", description="Divide then merge.", question="Sort this array.", query="Merge sort", summary="Divide-and-conquer merge.", algorithm="merge_sort", steps=merge_sort_steps([38, 27, 43, 3, 9, 82, 10]), lesson=build_lesson("Merge Sort", "Divide then merge.", "Sort this array.", "Time O(n log n), Space O(n).", "merge_sort", merge_sort_steps([38, 27, 43, 3, 9, 82, 10]))),
        StudyItem(id="study-quick-sort", name="Quick Sort", description="Partition around pivots.", question="Sort this array.", query="Quick sort", summary="Partition recursively.", algorithm="quick_sort", steps=quick_sort_steps([10, 7, 8, 9, 1, 5]), lesson=build_lesson("Quick Sort", "Partition around pivots.", "Sort this array.", "Best O(n log n), worst O(n²), Space O(log n).", "quick_sort", quick_sort_steps([10, 7, 8, 9, 1, 5]))),
        StudyItem(id="study-heap-sort", name="Heap Sort", description="Heapify then extract.", question="Sort this array.", query="Heap sort", summary="Heap-based sorting.", algorithm="heap_sort", steps=heap_sort_steps([12, 11, 13, 5, 6, 7]), lesson=build_lesson("Heap Sort", "Heapify then extract.", "Sort this array.", "Time O(n log n), Space O(1).", "heap_sort", heap_sort_steps([12, 11, 13, 5, 6, 7]))),
        StudyItem(id="study-bfs", name="BFS", description="Traverse by frontier level.", question="Traverse from A.", query="BFS", summary="Queue-based graph traversal.", algorithm="bfs", steps=_bfs_steps(["A", "B", "C", "D", "E"], [["A", "B"], ["A", "C"], ["B", "D"], ["C", "E"]], "A"), lesson=build_lesson("BFS", "Traverse by frontier level.", "Traverse from A.", "Time O(V+E), Space O(V).", "bfs", _bfs_steps(["A", "B", "C", "D", "E"], [["A", "B"], ["A", "C"], ["B", "D"], ["C", "E"]], "A"))),
        StudyItem(id="study-dfs", name="DFS", description="Depth-first traversal.", question="Traverse from A.", query="DFS", summary="Stack/recursion traversal.", algorithm="dfs", steps=_dfs_steps(["A", "B", "C", "D", "E"], [["A", "B"], ["A", "C"], ["B", "D"], ["C", "E"]], "A"), lesson=build_lesson("DFS", "Depth-first traversal.", "Traverse from A.", "Time O(V+E), Space O(V).", "dfs", _dfs_steps(["A", "B", "C", "D", "E"], [["A", "B"], ["A", "C"], ["B", "D"], ["C", "E"]], "A"))),
        StudyItem(id="study-dijkstra", name="Dijkstra", description="Shortest paths with non-negative weights.", question="Distances from A.", query="Dijkstra", summary="Relaxation with min-heap.", algorithm="dijkstra", steps=_dijkstra_steps(["A", "B", "C", "D"], [["A", "B", 1], ["A", "C", 4], ["B", "C", 2], ["B", "D", 5], ["C", "D", 1]], "A"), lesson=build_lesson("Dijkstra", "Shortest paths with non-negative weights.", "Distances from A.", "Time O((V+E) log V), Space O(V).", "dijkstra", _dijkstra_steps(["A", "B", "C", "D"], [["A", "B", 1], ["A", "C", 4], ["B", "C", 2], ["B", "D", 5], ["C", "D", 1]], "A"))),
        StudyItem(id="study-a-star", name="A*", description="Heuristic-guided shortest path.", question="Path S to G.", query="A*", summary="Uses f=g+h.", algorithm="a_star", steps=_a_star_steps(["S", "A", "B", "G"], [["S", "A", 1], ["S", "B", 4], ["A", "B", 2], ["A", "G", 5], ["B", "G", 1]], {"S": 3, "A": 2, "B": 1, "G": 0}, "S", "G"), lesson=build_lesson("A*", "Heuristic-guided shortest path.", "Path S to G.", "Best can be near O(E), worst similar to Dijkstra; Space O(V).", "a_star", _a_star_steps(["S", "A", "B", "G"], [["S", "A", 1], ["S", "B", 4], ["A", "B", 2], ["A", "G", 5], ["B", "G", 1]], {"S": 3, "A": 2, "B": 1, "G": 0}, "S", "G"))),
        StudyItem(id="study-fib-tab", name="Fibonacci Tabulation", description="Bottom-up fibonacci table.", question="Find f(10).", query="Fib tab", summary="Iterative DP.", algorithm="fibonacci_tabulation", steps=_fibonacci_steps(10, memoized=False), lesson=build_lesson("Fibonacci Tabulation", "Bottom-up fibonacci table.", "Find f(10).", "Time O(n), Space O(n).", "fibonacci_tabulation", _fibonacci_steps(10, memoized=False))),
        StudyItem(id="study-fib-memo", name="Fibonacci Memoization", description="Top-down memoized recursion.", question="Find f(10).", query="Fib memo", summary="Memoized recursion.", algorithm="fibonacci_memoization", steps=_fibonacci_steps(10, memoized=True), lesson=build_lesson("Fibonacci Memoization", "Top-down memoized recursion.", "Find f(10).", "Time O(n), Space O(n).", "fibonacci_memoization", _fibonacci_steps(10, memoized=True))),
        StudyItem(id="study-knapsack", name="0/1 Knapsack", description="Capacity-constrained value optimization.", question="Max value at capacity 7.", query="Knapsack", summary="2D DP table.", algorithm="knapsack_01", steps=_knapsack_steps([1, 3, 4, 5], [1, 4, 5, 7], 7), lesson=build_lesson("0/1 Knapsack", "Capacity-constrained value optimization.", "Max value at capacity 7.", "Time O(nW), Space O(nW).", "knapsack_01", _knapsack_steps([1, 3, 4, 5], [1, 4, 5, 7], 7))),
        StudyItem(id="study-lcs", name="LCS", description="Longest common subsequence DP.", question="LCS of sample strings.", query="LCS", summary="2D DP matching.", algorithm="lcs", steps=_lcs_steps("ABCBDAB", "BDCABA"), lesson=build_lesson("LCS", "Longest common subsequence DP.", "LCS of sample strings.", "Time O(mn), Space O(mn).", "lcs", _lcs_steps("ABCBDAB", "BDCABA"))),
        StudyItem(id="study-bst", name="BST Operations", description="Insert/search/delete walkthrough.", question="Run operation sequence.", query="BST ops", summary="BST invariant operations.", algorithm="bst_operations", steps=_bst_operations_steps([50, 30, 70, 20, 40, 60, 80], [{"op": "search", "key": 40}, {"op": "insert", "key": 65}, {"op": "delete", "key": 30}]), lesson=build_lesson("BST Operations", "Insert/search/delete walkthrough.", "Run operation sequence.", "Average O(log n), worst O(n), Space O(h).", "bst_operations", _bst_operations_steps([50, 30, 70, 20, 40, 60, 80], [{"op": "search", "key": 40}, {"op": "insert", "key": 65}, {"op": "delete", "key": 30}]))),
        StudyItem(id="study-heap-ops", name="Heap Operations", description="Build/insert/peek/extract steps.", question="Run heap ops.", query="Heap ops", summary="Min/max heap operations.", algorithm="heap_operations", steps=_heap_operations_steps("max", [3, 1, 6, 5, 2, 4], [{"op": "insert", "value": 7}, {"op": "peek"}, {"op": "extract_root"}]), lesson=build_lesson("Heap Operations", "Build/insert/peek/extract steps.", "Run heap ops.", "Build O(n), insert/extract O(log n), peek O(1).", "heap_operations", _heap_operations_steps("max", [3, 1, 6, 5, 2, 4], [{"op": "insert", "value": 7}, {"op": "peek"}, {"op": "extract_root"}]))),
        StudyItem(id="study-kmp", name="KMP", description="Pattern search using LPS table.", question="Find ABABCABAB.", query="KMP", summary="Linear-time string matching.", algorithm="kmp", steps=_kmp_steps("ABABDABACDABABCABAB", "ABABCABAB"), lesson=build_lesson("KMP", "Pattern search using LPS table.", "Find ABABCABAB.", "Time O(n+m), Space O(m).", "kmp", _kmp_steps("ABABDABACDABABCABAB", "ABABCABAB"))),
        StudyItem(id="study-rabin-karp", name="Rabin-Karp", description="Rolling hash pattern search.", question="Find GEEK.", query="Rabin-Karp", summary="Hash-based string matching.", algorithm="rabin_karp", steps=_rabin_karp_steps("GEEKS FOR GEEKS", "GEEK"), lesson=build_lesson("Rabin-Karp", "Rolling hash pattern search.", "Find GEEK.", "Average O(n+m), worst O(nm), Space O(1).", "rabin_karp", _rabin_karp_steps("GEEKS FOR GEEKS", "GEEK"))),
    ]
    return catalog
