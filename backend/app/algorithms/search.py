from __future__ import annotations

import math

from .base import BaseAlgorithmVisualizer, VisualizationMetadata, array_or_empty, make_step
from ..models import VisualizationStep


def linear_search_steps(numbers: list[int], target: int) -> list[VisualizationStep]:
    empty = array_or_empty(numbers, "No items to search.")
    if empty:
        return empty
    steps: list[VisualizationStep] = []
    for i, value in enumerate(numbers):
        make_step(steps, f"Check index {i}", numbers.copy(), f"Compare {value} with target {target}.", [i])
        if value == target:
            make_step(steps, "Found", numbers.copy(), f"Target {target} found at index {i}.", [i])
            return steps
    make_step(steps, "Not found", numbers.copy(), f"Target {target} does not exist in the array.")
    return steps


def binary_search_steps(numbers: list[int], target: int) -> list[VisualizationStep]:
    arr = sorted(numbers)
    empty = array_or_empty(arr, "No items to search.")
    if empty:
        return empty
    steps: list[VisualizationStep] = []
    l, r = 0, len(arr) - 1
    while l <= r:
        m = (l + r) // 2
        make_step(steps, f"Window [{l}, {r}]", arr.copy(), f"mid={m}, value={arr[m]}.", [l, m, r])
        if arr[m] == target:
            make_step(steps, "Found", arr.copy(), f"Target {target} found at index {m}.", [m])
            return steps
        if arr[m] < target:
            l = m + 1
        else:
            r = m - 1
    make_step(steps, "Not found", arr.copy(), f"Target {target} does not exist in the array.")
    return steps


def jump_search_steps(numbers: list[int], target: int) -> list[VisualizationStep]:
    arr = sorted(numbers)
    empty = array_or_empty(arr, "No items to search.")
    if empty:
        return empty
    steps: list[VisualizationStep] = []
    n = len(arr)
    jump = int(math.sqrt(n)) or 1
    prev = 0
    cur = jump
    while prev < n and arr[min(cur, n) - 1] < target:
        make_step(steps, "Jump", arr.copy(), f"Jump block ending at {min(cur, n)-1} with value {arr[min(cur, n)-1]}.", [min(cur, n) - 1])
        prev = cur
        cur += jump
        if prev >= n:
            make_step(steps, "Not found", arr.copy(), f"Target {target} is outside scanned blocks.")
            return steps
    for i in range(prev, min(cur, n)):
        make_step(steps, "Linear scan in block", arr.copy(), f"Check index {i} value {arr[i]}.", [i])
        if arr[i] == target:
            make_step(steps, "Found", arr.copy(), f"Target {target} found at index {i}.", [i])
            return steps
    make_step(steps, "Not found", arr.copy(), f"Target {target} not in target block.")
    return steps


def interpolation_search_steps(numbers: list[int], target: int) -> list[VisualizationStep]:
    arr = sorted(numbers)
    empty = array_or_empty(arr, "No items to search.")
    if empty:
        return empty
    steps: list[VisualizationStep] = []
    lo, hi = 0, len(arr) - 1
    while lo <= hi and arr[lo] <= target <= arr[hi]:
        if arr[lo] == arr[hi]:
            pos = lo
        else:
            pos = lo + int(((target - arr[lo]) * (hi - lo)) / (arr[hi] - arr[lo]))
        pos = max(lo, min(pos, hi))
        make_step(steps, "Probe", arr.copy(), f"Probe index {pos} value {arr[pos]} between lo={lo}, hi={hi}.", [lo, pos, hi])
        if arr[pos] == target:
            make_step(steps, "Found", arr.copy(), f"Target {target} found at index {pos}.", [pos])
            return steps
        if arr[pos] < target:
            lo = pos + 1
        else:
            hi = pos - 1
    make_step(steps, "Not found", arr.copy(), f"Target {target} does not exist in the array.")
    return steps


class _TargetSearchVisualizer(BaseAlgorithmVisualizer):
    requirement_message: str = "Target is required."

    def validate_inputs(self, numbers: list[int], target: int | None, payload: dict) -> list[str]:
        if target is None:
            raise ValueError(self.requirement_message)
        return ["numbers: list[int]", "target: int"]


class LinearSearchVisualizer(_TargetSearchVisualizer):
    algorithm = "linear_search"
    requirement_message = "Target is required for linear search."

    def get_metadata(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationMetadata:
        return VisualizationMetadata(
            query=f"Linear search for {target} in {numbers}",
            summary="Linear search checks each element left to right.",
        )

    def build_steps(self, numbers: list[int], target: int | None, payload: dict) -> list[VisualizationStep]:
        return linear_search_steps(numbers, int(target))


class BinarySearchVisualizer(_TargetSearchVisualizer):
    algorithm = "binary_search"
    requirement_message = "Target is required for binary search."

    def get_metadata(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationMetadata:
        return VisualizationMetadata(
            query=f"Binary search for {target} in sorted({numbers})",
            summary="Binary search halves the sorted search space.",
        )

    def build_steps(self, numbers: list[int], target: int | None, payload: dict) -> list[VisualizationStep]:
        return binary_search_steps(numbers, int(target))


class JumpSearchVisualizer(_TargetSearchVisualizer):
    algorithm = "jump_search"
    requirement_message = "Target is required for jump search."

    def get_metadata(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationMetadata:
        return VisualizationMetadata(
            query=f"Jump search for {target} in sorted({numbers})",
            summary="Jump search leaps blocks then linearly scans inside a block.",
        )

    def build_steps(self, numbers: list[int], target: int | None, payload: dict) -> list[VisualizationStep]:
        return jump_search_steps(numbers, int(target))


class InterpolationSearchVisualizer(_TargetSearchVisualizer):
    algorithm = "interpolation_search"
    requirement_message = "Target is required for interpolation search."

    def get_metadata(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationMetadata:
        return VisualizationMetadata(
            query=f"Interpolation search for {target} in sorted({numbers})",
            summary="Interpolation search probes estimated positions in sorted data.",
        )

    def build_steps(self, numbers: list[int], target: int | None, payload: dict) -> list[VisualizationStep]:
        return interpolation_search_steps(numbers, int(target))


SEARCH_ALGORITHM_REGISTRY = {
    "linear_search": LinearSearchVisualizer(),
    "binary_search": BinarySearchVisualizer(),
    "jump_search": JumpSearchVisualizer(),
    "interpolation_search": InterpolationSearchVisualizer(),
}
