from __future__ import annotations

from .models import StudyItem, VisualizationResponse, VisualizationStep


def _linear_search_steps(numbers: list[int], target: int) -> list[VisualizationStep]:
    steps: list[VisualizationStep] = []

    for i, value in enumerate(numbers):
        found = value == target
        steps.append(
            VisualizationStep(
                index=len(steps) + 1,
                title=f"Check index {i}",
                state=numbers.copy(),
                highlighted_indices=[i],
                explanation=(
                    f"Compare value {value} with target {target}. "
                    + ("Match found. Stop searching." if found else "No match. Move to the next index.")
                ),
            )
        )
        if found:
            break

    if not numbers:
        return [
            VisualizationStep(
                index=1,
                title="Empty input",
                state=[],
                highlighted_indices=[],
                explanation="No items to search.",
            )
        ]

    if all(value != target for value in numbers):
        steps.append(
            VisualizationStep(
                index=len(steps) + 1,
                title="Target not found",
                state=numbers.copy(),
                highlighted_indices=[],
                explanation=f"Reached the end of the list. Target {target} does not exist in the input.",
            )
        )

    return steps


def _binary_search_steps(numbers: list[int], target: int) -> list[VisualizationStep]:
    sorted_numbers = sorted(numbers)
    steps: list[VisualizationStep] = []

    left = 0
    right = len(sorted_numbers) - 1

    while left <= right:
        mid = (left + right) // 2
        value = sorted_numbers[mid]

        if value == target:
            explanation = f"Middle value is {value}, which matches target {target}."
        elif value < target:
            explanation = f"Middle value {value} is smaller than {target}. Search right half."
        else:
            explanation = f"Middle value {value} is greater than {target}. Search left half."

        steps.append(
            VisualizationStep(
                index=len(steps) + 1,
                title=f"Window [{left}, {right}]",
                state=sorted_numbers.copy(),
                highlighted_indices=[mid],
                explanation=explanation,
            )
        )

        if value == target:
            return steps
        if value < target:
            left = mid + 1
        else:
            right = mid - 1

    if not sorted_numbers:
        return [
            VisualizationStep(
                index=1,
                title="Empty input",
                state=[],
                highlighted_indices=[],
                explanation="No items to search.",
            )
        ]

    steps.append(
        VisualizationStep(
            index=len(steps) + 1,
            title="Target not found",
            state=sorted_numbers.copy(),
            highlighted_indices=[],
            explanation=f"Search window collapsed. Target {target} does not exist in the input.",
        )
    )
    return steps


def _bubble_sort_steps(numbers: list[int]) -> list[VisualizationStep]:
    arr = numbers.copy()
    steps: list[VisualizationStep] = []

    if not arr:
        return [
            VisualizationStep(
                index=1,
                title="Empty input",
                state=[],
                highlighted_indices=[],
                explanation="No items to sort.",
            )
        ]

    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            explanation = f"Compare {arr[j]} and {arr[j + 1]}."
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
                explanation += " Left value was larger, so swap them."
            else:
                explanation += " Order is correct, so no swap."

            steps.append(
                VisualizationStep(
                    index=len(steps) + 1,
                    title=f"Pass {i + 1}, comparison {j + 1}",
                    state=arr.copy(),
                    highlighted_indices=[j, j + 1],
                    explanation=explanation,
                )
            )

        if not swapped:
            steps.append(
                VisualizationStep(
                    index=len(steps) + 1,
                    title="Early completion",
                    state=arr.copy(),
                    highlighted_indices=[],
                    explanation="No swaps in this pass, so the list is already sorted.",
                )
            )
            break

    return steps


def build_custom_visualization(algorithm: str, question: str, numbers: list[int], target: int | None) -> VisualizationResponse:
    if algorithm == "linear_search":
        if target is None:
            raise ValueError("Target is required for linear search.")
        steps = _linear_search_steps(numbers=numbers, target=target)
        query = f"Linear search for {target} in {numbers}"
        summary = "Linear search checks each element one-by-one from left to right."
    elif algorithm == "binary_search":
        if target is None:
            raise ValueError("Target is required for binary search.")
        steps = _binary_search_steps(numbers=numbers, target=target)
        query = f"Binary search for {target} in sorted({numbers})"
        summary = "Binary search repeatedly halves the search space in a sorted array."
    elif algorithm == "bubble_sort":
        steps = _bubble_sort_steps(numbers=numbers)
        query = f"Bubble sort for {numbers}"
        summary = "Bubble sort repeatedly compares adjacent values and swaps out-of-order pairs."
    else:
        raise ValueError("Unsupported algorithm.")

    return VisualizationResponse(
        algorithm=algorithm,
        question=question,
        query=query,
        summary=summary,
        steps=steps,
    )


def study_mode_items() -> list[StudyItem]:
    return [
        StudyItem(
            id="study-linear-search",
            name="Linear Search",
            description="See how each index is checked until the target is found.",
            question="Where is 7 in the list?",
            query="Linear search for 7 in [3, 9, 1, 7, 12]",
            summary="Linear search moves from left to right and stops on first match.",
            algorithm="linear_search",
            steps=_linear_search_steps([3, 9, 1, 7, 12], 7),
        ),
        StudyItem(
            id="study-binary-search",
            name="Binary Search",
            description="Observe how the search window shrinks at every step.",
            question="Can we find 19?",
            query="Binary search for 19 in [2, 5, 8, 12, 19, 21, 33]",
            summary="Binary search divides the sorted search space in half each step.",
            algorithm="binary_search",
            steps=_binary_search_steps([2, 5, 8, 12, 19, 21, 33], 19),
        ),
        StudyItem(
            id="study-bubble-sort",
            name="Bubble Sort",
            description="Watch pair-wise comparisons and swaps move larger values rightward.",
            question="How does bubble sort order this list?",
            query="Bubble sort on [8, 3, 5, 1]",
            summary="Bubble sort repeatedly compares adjacent pairs and swaps if needed.",
            algorithm="bubble_sort",
            steps=_bubble_sort_steps([8, 3, 5, 1]),
        ),
    ]
