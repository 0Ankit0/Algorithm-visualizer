from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, model_validator


AlgorithmType = Literal[
    "linear_search",
    "binary_search",
    "jump_search",
    "interpolation_search",
    "bubble_sort",
    "insertion_sort",
    "selection_sort",
    "merge_sort",
    "quick_sort",
    "heap_sort",
    "bfs",
    "dfs",
    "dijkstra",
    "a_star",
    "fibonacci_tabulation",
    "fibonacci_memoization",
    "knapsack_01",
    "lcs",
    "bst_operations",
    "heap_operations",
    "kmp",
    "rabin_karp",
]

SEARCH_SORT_ALGORITHMS: set[str] = {
    "linear_search",
    "binary_search",
    "jump_search",
    "interpolation_search",
    "bubble_sort",
    "insertion_sort",
    "selection_sort",
    "merge_sort",
    "quick_sort",
    "heap_sort",
}
GRAPH_ALGORITHMS: set[str] = {"bfs", "dfs", "dijkstra", "a_star"}
DP_TABLE_ALGORITHMS: set[str] = {"fibonacci_tabulation", "fibonacci_memoization", "knapsack_01", "lcs"}
STRING_ALGORITHMS: set[str] = {"kmp", "rabin_karp"}


class AlgorithmInputField(BaseModel):
    key: str = Field(..., min_length=1)
    label: str = Field(..., min_length=1)
    type: Literal["number_list", "number", "string", "string_list", "edge_list", "weighted_edge_list", "matrix"]
    required: bool = True
    placeholder: str | None = None
    example: str | None = None
    help_text: str | None = None


class AlgorithmPreset(BaseModel):
    name: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    payload: dict[str, Any] = Field(default_factory=dict)


class AlgorithmDescriptor(BaseModel):
    algorithm: AlgorithmType
    label: str = Field(..., min_length=1)
    category: Literal["search_sort", "graph", "dp_table", "string", "other"] = "other"
    fields: list[AlgorithmInputField] = Field(default_factory=list)
    sample_presets: list[AlgorithmPreset] = Field(default_factory=list)


class StepVariablesPanel(BaseModel):
    position: Literal["left", "right", "mid"] | None = None
    left: int | float | str | None = None
    right: int | float | str | None = None
    mid: int | float | str | None = None
    distance_map: dict[str, int | float] = Field(default_factory=dict)
    heap_size: int | None = None
    values: dict[str, Any] = Field(default_factory=dict)


class ArrayStatePayload(BaseModel):
    kind: Literal["array_state"]
    values: list[int | str]
    highlighted_indices: list[int] = Field(default_factory=list)
    variables: StepVariablesPanel | None = None


class GraphStatePayload(BaseModel):
    kind: Literal["graph_state"]
    nodes: list[str | int | dict[str, Any]]
    edges: list[list[Any] | dict[str, Any]]
    active_nodes: list[str | int] = Field(default_factory=list)
    active_edges: list[list[Any] | dict[str, Any] | str | int] = Field(default_factory=list)
    variables: StepVariablesPanel | None = None


class MatrixCellHighlight(BaseModel):
    row: int = Field(..., ge=0)
    col: int = Field(..., ge=0)


class MatrixStatePayload(BaseModel):
    kind: Literal["matrix_state"]
    cells: list[list[int | str]]
    highlighted_cells: list[MatrixCellHighlight] = Field(default_factory=list)
    variables: StepVariablesPanel | None = None


class TreeStatePayload(BaseModel):
    kind: Literal["tree_state"]
    nodes: list[dict[str, Any] | str | int]
    links: list[dict[str, Any] | list[Any]]
    active_path: list[str | int] = Field(default_factory=list)
    variables: StepVariablesPanel | None = None


StepStatePayload = Annotated[
    ArrayStatePayload | GraphStatePayload | MatrixStatePayload | TreeStatePayload,
    Field(discriminator="kind"),
]
LegacyArrayState = list[int | str]


class VisualizationStep(BaseModel):
    index: int = Field(..., description="Step number starting at 1", ge=1)
    title: str = Field(..., min_length=1)
    state: LegacyArrayState | StepStatePayload
    explanation: str = Field(..., min_length=1)
    highlighted_indices: list[int] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def migrate_state_payload(cls, values: Any) -> Any:
        if not isinstance(values, dict):
            return values

        state = values.get("state")
        highlighted = values.get("highlighted_indices")
        if isinstance(state, dict):
            if "kind" not in state and "values" in state:
                state = {"kind": "array_state", **state}
                values["state"] = state
            if state.get("kind") == "array_state" and highlighted is None:
                values["highlighted_indices"] = list(state.get("highlighted_indices", []))
        return values

    @model_validator(mode="after")
    def normalize_highlights(self) -> "VisualizationStep":
        state_len: int | None = None
        if isinstance(self.state, list):
            state_len = len(self.state)
        elif isinstance(self.state, ArrayStatePayload):
            state_len = len(self.state.values)
            merged_highlights = self.highlighted_indices or self.state.highlighted_indices
            self.highlighted_indices = merged_highlights
            if not self.state.highlighted_indices:
                self.state.highlighted_indices = merged_highlights

        if state_len is not None and any(i < 0 or i >= state_len for i in self.highlighted_indices):
            raise ValueError("Highlighted index must exist in the step state array.")

        return self


class StudyItem(BaseModel):
    class StudyLesson(BaseModel):
        problem_statement: str = Field(..., min_length=1)
        why_this_algorithm: str = Field(..., min_length=1)
        step_by_step_trace: str = Field(..., min_length=1)
        final_result: str = Field(..., min_length=1)
        complexity_takeaway: str = Field(..., min_length=1)
        common_mistakes: str = Field(..., min_length=1)
        concept_intro: str = Field(..., min_length=1)
        key_invariants: list[str] = Field(..., min_length=1)
        complexity_card: str = Field(..., min_length=1)
        when_to_use: str = Field(..., min_length=1)
        when_to_avoid: str = Field(..., min_length=1)
        scenario_example: str = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_study_lesson(self) -> "StudyItem":
        scenario = self.lesson.scenario_example.lower()
        has_found_pair = "found" in scenario and "not-found" in scenario
        has_best_worst = "best-case" in scenario and "worst-case" in scenario
        if not has_found_pair and not has_best_worst:
            raise ValueError("lesson.scenario_example must include found/not-found or best-case/worst-case.")
        return self

    id: str
    name: str
    description: str
    question: str
    query: str
    summary: str
    algorithm: AlgorithmType
    steps: list[VisualizationStep]
    lesson: StudyLesson


class CustomVisualizeRequest(BaseModel):
    algorithm: AlgorithmType
    question: str = Field(..., min_length=1)
    numbers: list[int] = Field(default_factory=list)
    target: int | None = None
    payload: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_payload_by_algorithm(self) -> "CustomVisualizeRequest":
        payload = self.payload or {}
        algorithm = self.algorithm

        if algorithm in SEARCH_SORT_ALGORITHMS:
            if len(self.numbers) == 0 and not isinstance(payload.get("numbers"), list):
                raise ValueError("Search/sort algorithms require a numbers array. Example: [3, 9, 1, 12]")
            if "search" in algorithm and self.target is None and payload.get("target") is None:
                raise ValueError("Search algorithms require a target value. Example: 9")

        if algorithm in GRAPH_ALGORITHMS:
            nodes = payload.get("nodes")
            edges = payload.get("edges")
            if not isinstance(nodes, list) or len(nodes) == 0:
                raise ValueError("Graph algorithms require payload.nodes as a non-empty list. Example: [\"A\", \"B\", \"C\"]")
            if not isinstance(edges, list) or len(edges) == 0:
                raise ValueError("Graph algorithms require payload.edges as a non-empty list.")
            has_weights = algorithm in {"dijkstra", "a_star"}
            for edge in edges:
                if not isinstance(edge, list):
                    raise ValueError("Each graph edge must be a list. Example: [\"A\", \"B\"]")
                if has_weights and len(edge) != 3:
                    raise ValueError("Weighted graph algorithms require edges in [from, to, weight] format.")
                if not has_weights and len(edge) < 2:
                    raise ValueError("Unweighted graph algorithms require edges in [from, to] format.")

        if algorithm in DP_TABLE_ALGORITHMS:
            if algorithm.startswith("fibonacci"):
                n = payload.get("n")
                if not isinstance(n, int) or n < 0:
                    raise ValueError("Fibonacci requires payload.n as a non-negative integer. Example: 8")
            elif algorithm == "knapsack_01":
                weights = payload.get("weights")
                values = payload.get("values")
                capacity = payload.get("capacity")
                if not isinstance(weights, list) or not all(isinstance(item, int) for item in weights):
                    raise ValueError("Knapsack requires payload.weights as an integer list. Example: [2, 3, 4]")
                if not isinstance(values, list) or not all(isinstance(item, int) for item in values):
                    raise ValueError("Knapsack requires payload.values as an integer list. Example: [4, 5, 10]")
                if len(weights) != len(values):
                    raise ValueError("Knapsack payload.weights and payload.values must have equal lengths.")
                if not isinstance(capacity, int) or capacity < 0:
                    raise ValueError("Knapsack requires payload.capacity as a non-negative integer.")
            elif algorithm == "lcs":
                s1 = payload.get("s1")
                s2 = payload.get("s2")
                if not isinstance(s1, str) or not isinstance(s2, str) or not s1 or not s2:
                    raise ValueError("LCS requires payload.s1 and payload.s2 as non-empty strings.")

        if algorithm in STRING_ALGORITHMS:
            text = payload.get("text")
            pattern = payload.get("pattern")
            if not isinstance(text, str) or not text:
                raise ValueError("String algorithms require payload.text as a non-empty string.")
            if not isinstance(pattern, str) or not pattern:
                raise ValueError("String algorithms require payload.pattern as a non-empty string.")

        return self


class VisualizationResponse(BaseModel):
    algorithm: AlgorithmType
    question: str
    query: str
    summary: str
    steps: list[VisualizationStep]


class CustomVisualizerBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    question: str = Field(..., min_length=1)
    algorithm: AlgorithmType
    query: str = Field(..., min_length=1)
    summary: str = Field(..., min_length=1)
    steps: list[VisualizationStep] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_steps(self) -> "CustomVisualizerBase":
        expected_idx = 1
        for step in self.steps:
            if step.index != expected_idx:
                raise ValueError("Steps must be sequential and start at index 1.")
            expected_idx += 1
        return self


class CreateCustomVisualizerRequest(CustomVisualizerBase):
    pass


class UpdateCustomVisualizerRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    question: str | None = Field(default=None, min_length=1)
    algorithm: AlgorithmType | None = None
    query: str | None = Field(default=None, min_length=1)
    summary: str | None = Field(default=None, min_length=1)
    steps: list[VisualizationStep] | None = None


class CustomVisualizer(CustomVisualizerBase):
    id: str
    created_at: str
    updated_at: str
