from __future__ import annotations

from typing import Iterable

REQUIRED_SECTIONS: tuple[str, ...] = (
    "Concept:",
    "Why:",
    "Invariant:",
    "Stopping condition:",
    "Final interpretation:",
)

FINAL_STEP_TITLES = {
    "found",
    "not found",
    "done",
    "path found",
    "match",
    "invalid",
    "no-op",
}


def is_rubric_compliant(explanation: str) -> bool:
    return all(section in explanation for section in REQUIRED_SECTIONS)


def build_rubric_explanation(
    *,
    concept: str,
    why: str,
    invariant: str | None = None,
    stopping_condition: str | None = None,
    final_interpretation: str | None = None,
) -> str:
    normalized_concept = concept.strip() or "Track one operation"
    normalized_why = why.strip() or "This operation advances the algorithm by one clear step."
    normalized_invariant = (invariant or "Work completed so far stays valid while we continue.").strip()
    normalized_stop = (stopping_condition or "Stop when success or failure is certain.").strip()
    normalized_interpretation = (
        final_interpretation or "This step contributes evidence toward the final answer."
    ).strip()

    return "\n".join(
        [
            f"Concept: {normalized_concept}.",
            f"Why: {normalized_why}",
            f"Invariant: {normalized_invariant}",
            f"Stopping condition: {normalized_stop}",
            f"Final interpretation: {normalized_interpretation}",
        ]
    )


def rubricize_legacy_explanation(title: str, explanation: str) -> str:
    if is_rubric_compliant(explanation):
        return explanation

    title_lower = title.strip().lower()
    is_final_step = title_lower in FINAL_STEP_TITLES

    final_interpretation = (
        "This is a terminal step, so this statement is the final result."
        if is_final_step
        else "This is an intermediate step that narrows what the final result can be."
    )

    return build_rubric_explanation(
        concept=title,
        why=explanation,
        final_interpretation=final_interpretation,
    )


def missing_sections(explanation: str) -> list[str]:
    return [section for section in REQUIRED_SECTIONS if section not in explanation]


def validate_explanations(explanations: Iterable[str]) -> None:
    for explanation in explanations:
        missing = missing_sections(explanation)
        if missing:
            raise ValueError(f"Explanation is missing rubric sections: {', '.join(missing)}")
