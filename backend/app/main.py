from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware

from .logic import build_custom_visualization, study_mode_items
from .models import (
    AlgorithmDescriptor,
    AlgorithmType,
    CreateCustomVisualizerRequest,
    CustomVisualizeRequest,
    CustomVisualizer,
    StudyItem,
    UpdateCustomVisualizerRequest,
    VisualizationResponse,
)
from .store import CustomVisualizerStore

app = FastAPI(title="Algorithm Query Visualiser API", version="0.2.0")
store = CustomVisualizerStore(Path(__file__).resolve().parent.parent / "data" / "custom_visualizers.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/algorithms", response_model=list[AlgorithmDescriptor])
def list_algorithms() -> list[AlgorithmDescriptor]:
    return [
        AlgorithmDescriptor(
            algorithm="linear_search",
            label="Linear Search",
            category="search_sort",
            fields=[
                {"key": "numbers", "label": "Array", "type": "number_list", "example": "3, 9, 1, 12, 7"},
                {"key": "target", "label": "Target", "type": "number", "example": "9"},
            ],
            sample_presets=[{"name": "Find in unsorted list", "question": "Where can I find 9?", "payload": {"numbers": [3, 9, 1, 12, 7], "target": 9}}],
        ),
        AlgorithmDescriptor(
            algorithm="binary_search",
            label="Binary Search",
            category="search_sort",
            fields=[
                {"key": "numbers", "label": "Sorted Array", "type": "number_list", "example": "1, 3, 5, 7, 9, 11"},
                {"key": "target", "label": "Target", "type": "number", "example": "7"},
            ],
            sample_presets=[{"name": "Middle hit", "question": "Find 7 in sorted values.", "payload": {"numbers": [1, 3, 5, 7, 9, 11], "target": 7}}],
        ),
        AlgorithmDescriptor(
            algorithm="jump_search",
            label="Jump Search",
            category="search_sort",
            fields=[{"key": "numbers", "label": "Sorted Array", "type": "number_list"}, {"key": "target", "label": "Target", "type": "number"}],
            sample_presets=[{"name": "Block jump", "question": "Locate 16 quickly.", "payload": {"numbers": [2, 4, 6, 8, 10, 12, 14, 16], "target": 16}}],
        ),
        AlgorithmDescriptor(
            algorithm="interpolation_search",
            label="Interpolation Search",
            category="search_sort",
            fields=[{"key": "numbers", "label": "Sorted Array", "type": "number_list"}, {"key": "target", "label": "Target", "type": "number"}],
            sample_presets=[{"name": "Estimated probe", "question": "Find 60 in this data.", "payload": {"numbers": [10, 20, 30, 40, 50, 60, 70], "target": 60}}],
        ),
        AlgorithmDescriptor(
            algorithm="bubble_sort",
            label="Bubble Sort",
            category="search_sort",
            fields=[{"key": "numbers", "label": "Array", "type": "number_list", "example": "5, 1, 4, 2, 8"}],
            sample_presets=[{"name": "Simple unsorted list", "question": "Sort this list.", "payload": {"numbers": [5, 1, 4, 2, 8]}}],
        ),
        AlgorithmDescriptor(algorithm="insertion_sort", label="Insertion Sort", category="search_sort", fields=[{"key": "numbers", "label": "Array", "type": "number_list"}], sample_presets=[{"name": "Nearly sorted", "question": "Sort this nearly sorted array.", "payload": {"numbers": [1, 2, 6, 4, 5]}}]),
        AlgorithmDescriptor(algorithm="selection_sort", label="Selection Sort", category="search_sort", fields=[{"key": "numbers", "label": "Array", "type": "number_list"}], sample_presets=[{"name": "Find minimum repeatedly", "question": "Sort this array by selection.", "payload": {"numbers": [29, 10, 14, 37, 13]}}]),
        AlgorithmDescriptor(algorithm="merge_sort", label="Merge Sort", category="search_sort", fields=[{"key": "numbers", "label": "Array", "type": "number_list"}], sample_presets=[{"name": "Divide and conquer", "question": "Sort this with merge sort.", "payload": {"numbers": [38, 27, 43, 3, 9, 82, 10]}}]),
        AlgorithmDescriptor(algorithm="quick_sort", label="Quick Sort", category="search_sort", fields=[{"key": "numbers", "label": "Array", "type": "number_list"}], sample_presets=[{"name": "Pivot partitioning", "question": "Sort this quickly.", "payload": {"numbers": [10, 7, 8, 9, 1, 5]}}]),
        AlgorithmDescriptor(algorithm="heap_sort", label="Heap Sort", category="search_sort", fields=[{"key": "numbers", "label": "Array", "type": "number_list"}], sample_presets=[{"name": "Heapify then extract", "question": "Sort this with heap sort.", "payload": {"numbers": [12, 11, 13, 5, 6, 7]}}]),
        AlgorithmDescriptor(
            algorithm="bfs",
            label="BFS",
            category="graph",
            fields=[
                {"key": "nodes", "label": "Nodes", "type": "string_list", "example": "A, B, C, D"},
                {"key": "edges", "label": "Edges (u-v)", "type": "edge_list", "example": "A-B, A-C, B-D"},
                {"key": "start", "label": "Start Node", "type": "string", "example": "A"},
            ],
            sample_presets=[{"name": "Layered traversal", "question": "Traverse from A.", "payload": {"nodes": ["A", "B", "C", "D"], "edges": [["A", "B"], ["A", "C"], ["B", "D"]], "start": "A"}}],
        ),
        AlgorithmDescriptor(
            algorithm="dfs",
            label="DFS",
            category="graph",
            fields=[
                {"key": "nodes", "label": "Nodes", "type": "string_list"},
                {"key": "edges", "label": "Edges (u-v)", "type": "edge_list", "example": "A-B, A-C, C-D"},
                {"key": "start", "label": "Start Node", "type": "string"},
            ],
            sample_presets=[{"name": "Depth-first path", "question": "Traverse deeply from A.", "payload": {"nodes": ["A", "B", "C", "D"], "edges": [["A", "B"], ["A", "C"], ["C", "D"]], "start": "A"}}],
        ),
        AlgorithmDescriptor(
            algorithm="dijkstra",
            label="Dijkstra",
            category="graph",
            fields=[
                {"key": "nodes", "label": "Nodes", "type": "string_list"},
                {"key": "edges", "label": "Weighted edges (u-v:w)", "type": "weighted_edge_list", "example": "A-B:4, A-C:2, C-B:1"},
                {"key": "start", "label": "Start Node", "type": "string"},
            ],
            sample_presets=[{"name": "Shortest paths", "question": "Find shortest paths from A.", "payload": {"nodes": ["A", "B", "C", "D"], "edges": [["A", "B", 4], ["A", "C", 2], ["C", "B", 1], ["B", "D", 5], ["C", "D", 8]], "start": "A"}}],
        ),
        AlgorithmDescriptor(
            algorithm="a_star",
            label="A*",
            category="graph",
            fields=[
                {"key": "nodes", "label": "Nodes", "type": "string_list"},
                {"key": "edges", "label": "Weighted edges (u-v:w)", "type": "weighted_edge_list"},
                {"key": "start", "label": "Start Node", "type": "string"},
                {"key": "goal", "label": "Goal Node", "type": "string"},
            ],
            sample_presets=[{"name": "Path to goal", "question": "Find a path from S to G.", "payload": {"nodes": ["S", "A", "B", "G"], "edges": [["S", "A", 1], ["S", "B", 4], ["A", "G", 5], ["B", "G", 1]], "start": "S", "goal": "G", "heuristic": {"S": 3, "A": 2, "B": 1, "G": 0}}}],
        ),
        AlgorithmDescriptor(algorithm="fibonacci_tabulation", label="Fibonacci (Tabulation)", category="dp_table", fields=[{"key": "n", "label": "N", "type": "number", "example": "8"}], sample_presets=[{"name": "Compute fib(8)", "question": "Compute Fibonacci for n=8.", "payload": {"n": 8}}]),
        AlgorithmDescriptor(algorithm="fibonacci_memoization", label="Fibonacci (Memoization)", category="dp_table", fields=[{"key": "n", "label": "N", "type": "number", "example": "8"}], sample_presets=[{"name": "Memoized fib(8)", "question": "Compute Fibonacci with memoization.", "payload": {"n": 8}}]),
        AlgorithmDescriptor(
            algorithm="knapsack_01",
            label="0/1 Knapsack",
            category="dp_table",
            fields=[
                {"key": "weights", "label": "Weights", "type": "number_list", "example": "2, 3, 4, 5"},
                {"key": "values", "label": "Values", "type": "number_list", "example": "3, 4, 5, 6"},
                {"key": "capacity", "label": "Capacity", "type": "number", "example": "5"},
            ],
            sample_presets=[{"name": "Classic bag", "question": "Best value with capacity 5?", "payload": {"weights": [2, 3, 4, 5], "values": [3, 4, 5, 6], "capacity": 5}}],
        ),
        AlgorithmDescriptor(
            algorithm="lcs",
            label="LCS",
            category="dp_table",
            fields=[
                {"key": "s1", "label": "First String", "type": "string", "example": "ABCBDAB"},
                {"key": "s2", "label": "Second String", "type": "string", "example": "BDCABA"},
            ],
            sample_presets=[{"name": "Two sequences", "question": "What is the longest common subsequence?", "payload": {"s1": "ABCBDAB", "s2": "BDCABA"}}],
        ),
        AlgorithmDescriptor(algorithm="bst_operations", label="BST Operations", category="other"),
        AlgorithmDescriptor(algorithm="heap_operations", label="Heap Operations", category="other"),
        AlgorithmDescriptor(
            algorithm="kmp",
            label="KMP",
            category="string",
            fields=[
                {"key": "text", "label": "Text", "type": "string", "example": "ABABDABACDABABCABAB"},
                {"key": "pattern", "label": "Pattern", "type": "string", "example": "ABABCABAB"},
            ],
            sample_presets=[{"name": "Find pattern", "question": "Find pattern occurrences in text.", "payload": {"text": "ABABDABACDABABCABAB", "pattern": "ABABCABAB"}}],
        ),
        AlgorithmDescriptor(
            algorithm="rabin_karp",
            label="Rabin-Karp",
            category="string",
            fields=[
                {"key": "text", "label": "Text", "type": "string"},
                {"key": "pattern", "label": "Pattern", "type": "string"},
            ],
            sample_presets=[{"name": "Rolling hash match", "question": "Find 'GEEK' inside text.", "payload": {"text": "GEEKS FOR GEEKS", "pattern": "GEEK"}}],
        ),
    ]


@app.get("/api/study-mode", response_model=list[StudyItem])
def get_study_mode() -> list[StudyItem]:
    return study_mode_items()


@app.get("/api/study-mode/{study_id}", response_model=StudyItem)
def get_study_mode_item(study_id: str) -> StudyItem:
    item = next((entry for entry in study_mode_items() if entry.id == study_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Study visualizer not found.")
    return item


@app.post("/api/custom-visualize", response_model=VisualizationResponse)
def custom_visualize(payload: CustomVisualizeRequest) -> VisualizationResponse:
    try:
        return build_custom_visualization(
            algorithm=payload.algorithm,
            question=payload.question,
            numbers=payload.numbers,
            target=payload.target,
            payload=payload.payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/custom-visualizers", response_model=list[CustomVisualizer])
def list_custom_visualizers(algorithm: AlgorithmType | None = Query(default=None)) -> list[CustomVisualizer]:
    items = store.list()
    if algorithm is None:
        return items
    return [item for item in items if item.algorithm == algorithm]


@app.post("/api/custom-visualizers", response_model=CustomVisualizer, status_code=status.HTTP_201_CREATED)
def create_custom_visualizer(payload: CreateCustomVisualizerRequest) -> CustomVisualizer:
    return store.create(payload)


@app.get("/api/custom-visualizers/{visualizer_id}", response_model=CustomVisualizer)
def get_custom_visualizer(visualizer_id: str) -> CustomVisualizer:
    visualizer = store.get(visualizer_id)
    if visualizer is None:
        raise HTTPException(status_code=404, detail="Custom visualizer not found.")
    return visualizer


@app.put("/api/custom-visualizers/{visualizer_id}", response_model=CustomVisualizer)
def update_custom_visualizer(visualizer_id: str, payload: UpdateCustomVisualizerRequest) -> CustomVisualizer:
    existing = store.get(visualizer_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Custom visualizer not found.")

    try:
        updated = store.update(visualizer_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if updated is None:
        raise HTTPException(status_code=404, detail="Custom visualizer not found.")
    return updated


@app.delete("/api/custom-visualizers/{visualizer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_visualizer(visualizer_id: str) -> Response:
    if not store.delete(visualizer_id):
        raise HTTPException(status_code=404, detail="Custom visualizer not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/custom-visualizers/{visualizer_id}/run", response_model=VisualizationResponse)
def run_saved_custom_visualizer(visualizer_id: str) -> VisualizationResponse:
    visualizer = store.get(visualizer_id)
    if visualizer is None:
        raise HTTPException(status_code=404, detail="Custom visualizer not found.")

    return VisualizationResponse(
        algorithm=visualizer.algorithm,
        question=visualizer.question,
        query=visualizer.query,
        summary=visualizer.summary,
        steps=visualizer.steps,
    )
