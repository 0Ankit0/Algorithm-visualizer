from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from ..explanation_rubric import rubricize_legacy_explanation
from ..models import VisualizationStep


@dataclass(frozen=True)
class VisualizationMetadata:
    query: str
    summary: str


@dataclass(frozen=True)
class VisualizationResult:
    metadata: VisualizationMetadata
    input_requirements: list[str]
    steps: list[VisualizationStep]


class AlgorithmVisualizer(Protocol):
    algorithm: str

    def get_metadata(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationMetadata:
        ...

    def validate_inputs(self, numbers: list[int], target: int | None, payload: dict) -> list[str]:
        ...

    def build_steps(self, numbers: list[int], target: int | None, payload: dict) -> list[VisualizationStep]:
        ...

    def visualize(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationResult:
        ...


class BaseAlgorithmVisualizer:
    algorithm: str

    def visualize(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationResult:
        normalized_payload = payload or {}
        requirements = self.validate_inputs(numbers, target, normalized_payload)
        metadata = self.get_metadata(numbers, target, normalized_payload)
        steps = self.build_steps(numbers, target, normalized_payload)
        return VisualizationResult(metadata=metadata, input_requirements=requirements, steps=steps)


def make_step(
    steps: list[VisualizationStep],
    title: str,
    state: list[int | str],
    explanation: str,
    highlighted: list[int] | None = None,
) -> None:
    steps.append(
        VisualizationStep(
            index=len(steps) + 1,
            title=title,
            state=state,
            highlighted_indices=highlighted or [],
            explanation=rubricize_legacy_explanation(title, explanation),
        )
    )


def array_or_empty(numbers: list[int], msg: str) -> list[VisualizationStep] | None:
    if numbers:
        return None
    return [
        VisualizationStep(
            index=1,
            title="Empty input",
            state=[],
            highlighted_indices=[],
            explanation=rubricize_legacy_explanation("Empty input", msg),
        )
    ]
