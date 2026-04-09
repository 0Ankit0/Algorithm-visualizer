from __future__ import annotations

from .base import BaseAlgorithmVisualizer, VisualizationMetadata, make_step
from ..models import VisualizationStep


def bubble_sort_steps(numbers: list[int]) -> list[VisualizationStep]:
    arr = numbers.copy()
    if not arr:
        return [VisualizationStep(index=1, title="Empty input", state=[], highlighted_indices=[], explanation="No items to sort.")]
    steps: list[VisualizationStep] = []
    for i in range(len(arr)):
        swapped = False
        for j in range(0, len(arr) - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
                msg = "swap"
            else:
                msg = "no swap"
            make_step(steps, f"Pass {i+1}", arr.copy(), f"Compare indices {j},{j+1}: {msg}.", [j, j + 1])
        if not swapped:
            break
    return steps


def insertion_sort_steps(numbers: list[int]) -> list[VisualizationStep]:
    arr = numbers.copy()
    steps: list[VisualizationStep] = []
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        make_step(steps, "Pick key", arr.copy(), f"Pick key {key} at index {i}.", [i])
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            make_step(steps, "Shift right", arr.copy(), f"Shift {arr[j]} right to index {j+1}.", [j, j + 1])
            j -= 1
        arr[j + 1] = key
        make_step(steps, "Insert key", arr.copy(), f"Insert key {key} at index {j+1}.", [j + 1])
    return steps or [VisualizationStep(index=1, title="Done", state=arr, highlighted_indices=[], explanation="Array already sorted or empty.")]


def selection_sort_steps(numbers: list[int]) -> list[VisualizationStep]:
    arr = numbers.copy()
    steps: list[VisualizationStep] = []
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
            make_step(steps, "Scan minimum", arr.copy(), f"Current min index {min_idx} value {arr[min_idx]}.", [i, j, min_idx])
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
        make_step(steps, "Place minimum", arr.copy(), f"Swap index {i} with min index {min_idx}.", [i, min_idx])
    return steps or [VisualizationStep(index=1, title="Done", state=arr, highlighted_indices=[], explanation="Array empty.")]


def merge_sort_steps(numbers: list[int]) -> list[VisualizationStep]:
    arr = numbers.copy()
    steps: list[VisualizationStep] = []

    def merge_sort(l: int, r: int) -> None:
        if l >= r:
            return
        m = (l + r) // 2
        merge_sort(l, m)
        merge_sort(m + 1, r)
        left = arr[l : m + 1]
        right = arr[m + 1 : r + 1]
        i = j = 0
        k = l
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                arr[k] = left[i]
                i += 1
            else:
                arr[k] = right[j]
                j += 1
            make_step(steps, "Merge", arr.copy(), f"Merged position {k} for range [{l},{r}].", [k])
            k += 1
        while i < len(left):
            arr[k] = left[i]
            i += 1
            make_step(steps, "Merge left", arr.copy(), f"Copy left value into index {k}.", [k])
            k += 1
        while j < len(right):
            arr[k] = right[j]
            j += 1
            make_step(steps, "Merge right", arr.copy(), f"Copy right value into index {k}.", [k])
            k += 1

    if arr:
        merge_sort(0, len(arr) - 1)
    return steps or [VisualizationStep(index=1, title="Done", state=arr, highlighted_indices=[], explanation="Array empty.")]


def quick_sort_steps(numbers: list[int]) -> list[VisualizationStep]:
    arr = numbers.copy()
    steps: list[VisualizationStep] = []

    def quick(l: int, r: int) -> None:
        if l >= r:
            return
        pivot = arr[r]
        i = l
        for j in range(l, r):
            make_step(steps, "Partition compare", arr.copy(), f"Compare {arr[j]} with pivot {pivot}.", [j, r])
            if arr[j] <= pivot:
                arr[i], arr[j] = arr[j], arr[i]
                make_step(steps, "Swap for partition", arr.copy(), f"Move {arr[i]} before pivot zone.", [i, j])
                i += 1
        arr[i], arr[r] = arr[r], arr[i]
        make_step(steps, "Place pivot", arr.copy(), f"Pivot {pivot} placed at index {i}.", [i])
        quick(l, i - 1)
        quick(i + 1, r)

    if arr:
        quick(0, len(arr) - 1)
    return steps or [VisualizationStep(index=1, title="Done", state=arr, highlighted_indices=[], explanation="Array empty.")]


def heap_sort_steps(numbers: list[int]) -> list[VisualizationStep]:
    arr = numbers.copy()
    steps: list[VisualizationStep] = []

    def heapify(n: int, i: int) -> None:
        largest = i
        l = 2 * i + 1
        r = 2 * i + 2
        if l < n and arr[l] > arr[largest]:
            largest = l
        if r < n and arr[r] > arr[largest]:
            largest = r
        if largest != i:
            arr[i], arr[largest] = arr[largest], arr[i]
            make_step(steps, "Heapify swap", arr.copy(), f"Swap index {i} and {largest}.", [i, largest])
            heapify(n, largest)

    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):
        heapify(n, i)
    for i in range(n - 1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]
        make_step(steps, "Extract max", arr.copy(), f"Move max to sorted index {i}.", [0, i])
        heapify(i, 0)
    return steps or [VisualizationStep(index=1, title="Done", state=arr, highlighted_indices=[], explanation="Array empty.")]


class _SortVisualizer(BaseAlgorithmVisualizer):
    def validate_inputs(self, numbers: list[int], target: int | None, payload: dict) -> list[str]:
        return ["numbers: list[int]"]


class BubbleSortVisualizer(_SortVisualizer):
    algorithm = "bubble_sort"

    def get_metadata(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationMetadata:
        return VisualizationMetadata(query=f"Bubble sort for {numbers}", summary="Bubble sort swaps out-of-order adjacent pairs.")

    def build_steps(self, numbers: list[int], target: int | None, payload: dict) -> list[VisualizationStep]:
        return bubble_sort_steps(numbers)


class InsertionSortVisualizer(_SortVisualizer):
    algorithm = "insertion_sort"

    def get_metadata(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationMetadata:
        return VisualizationMetadata(query=f"Insertion sort for {numbers}", summary="Insertion sort grows a sorted prefix by inserting keys.")

    def build_steps(self, numbers: list[int], target: int | None, payload: dict) -> list[VisualizationStep]:
        return insertion_sort_steps(numbers)


class SelectionSortVisualizer(_SortVisualizer):
    algorithm = "selection_sort"

    def get_metadata(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationMetadata:
        return VisualizationMetadata(query=f"Selection sort for {numbers}", summary="Selection sort repeatedly chooses the next minimum.")

    def build_steps(self, numbers: list[int], target: int | None, payload: dict) -> list[VisualizationStep]:
        return selection_sort_steps(numbers)


class MergeSortVisualizer(_SortVisualizer):
    algorithm = "merge_sort"

    def get_metadata(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationMetadata:
        return VisualizationMetadata(query=f"Merge sort for {numbers}", summary="Merge sort recursively splits and merges subarrays.")

    def build_steps(self, numbers: list[int], target: int | None, payload: dict) -> list[VisualizationStep]:
        return merge_sort_steps(numbers)


class QuickSortVisualizer(_SortVisualizer):
    algorithm = "quick_sort"

    def get_metadata(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationMetadata:
        return VisualizationMetadata(query=f"Quick sort for {numbers}", summary="Quick sort partitions around pivots recursively.")

    def build_steps(self, numbers: list[int], target: int | None, payload: dict) -> list[VisualizationStep]:
        return quick_sort_steps(numbers)


class HeapSortVisualizer(_SortVisualizer):
    algorithm = "heap_sort"

    def get_metadata(self, numbers: list[int], target: int | None, payload: dict) -> VisualizationMetadata:
        return VisualizationMetadata(query=f"Heap sort for {numbers}", summary="Heap sort uses heapify plus repeated root extraction.")

    def build_steps(self, numbers: list[int], target: int | None, payload: dict) -> list[VisualizationStep]:
        return heap_sort_steps(numbers)


SORT_ALGORITHM_REGISTRY = {
    "bubble_sort": BubbleSortVisualizer(),
    "insertion_sort": InsertionSortVisualizer(),
    "selection_sort": SelectionSortVisualizer(),
    "merge_sort": MergeSortVisualizer(),
    "quick_sort": QuickSortVisualizer(),
    "heap_sort": HeapSortVisualizer(),
}
