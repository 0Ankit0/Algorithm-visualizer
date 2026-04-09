from __future__ import annotations

from typing import Any, Literal

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


class VisualizationStep(BaseModel):
    index: int = Field(..., description="Step number starting at 1", ge=1)
    title: str = Field(..., min_length=1)
    state: list[int | str]
    explanation: str = Field(..., min_length=1)
    highlighted_indices: list[int] = Field(default_factory=list)


class StudyItem(BaseModel):
    id: str
    name: str
    description: str
    question: str
    query: str
    summary: str
    algorithm: AlgorithmType
    steps: list[VisualizationStep]


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
            if any(i < 0 or i >= len(step.state) for i in step.highlighted_indices):
                raise ValueError("Highlighted index must exist in the step state array.")
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
