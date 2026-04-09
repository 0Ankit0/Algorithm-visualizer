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
