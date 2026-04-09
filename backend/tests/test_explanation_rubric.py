from app.explanation_rubric import missing_sections
from app.logic import build_custom_visualization, study_mode_items
from app.models import AlgorithmType


SAMPLE_INPUTS: dict[AlgorithmType, dict] = {
    "linear_search": {"numbers": [3, 1, 9], "target": 9, "payload": {}},
    "binary_search": {"numbers": [1, 3, 5, 9, 10], "target": 9, "payload": {}},
    "jump_search": {"numbers": [1, 3, 5, 7, 9], "target": 7, "payload": {}},
    "interpolation_search": {"numbers": [10, 20, 30, 40, 50], "target": 40, "payload": {}},
    "bubble_sort": {"numbers": [5, 1, 4], "target": None, "payload": {}},
    "insertion_sort": {"numbers": [5, 1, 4], "target": None, "payload": {}},
    "selection_sort": {"numbers": [5, 1, 4], "target": None, "payload": {}},
    "merge_sort": {"numbers": [5, 1, 4], "target": None, "payload": {}},
    "quick_sort": {"numbers": [5, 1, 4], "target": None, "payload": {}},
    "heap_sort": {"numbers": [5, 1, 4], "target": None, "payload": {}},
    "bfs": {
        "numbers": [],
        "target": None,
        "payload": {"nodes": ["A", "B", "C"], "edges": [["A", "B"], ["B", "C"]], "start": "A"},
    },
    "dfs": {
        "numbers": [],
        "target": None,
        "payload": {"nodes": ["A", "B", "C"], "edges": [["A", "B"], ["B", "C"]], "start": "A"},
    },
    "dijkstra": {
        "numbers": [],
        "target": None,
        "payload": {"nodes": ["A", "B", "C"], "edges": [["A", "B", 1], ["B", "C", 2]], "start": "A"},
    },
    "a_star": {
        "numbers": [],
        "target": None,
        "payload": {
            "nodes": ["S", "A", "G"],
            "edges": [["S", "A", 1], ["A", "G", 2]],
            "heuristic": {"S": 2, "A": 1, "G": 0},
            "start": "S",
            "goal": "G",
        },
    },
    "fibonacci_tabulation": {"numbers": [], "target": None, "payload": {"n": 6}},
    "fibonacci_memoization": {"numbers": [], "target": None, "payload": {"n": 6}},
    "knapsack_01": {"numbers": [], "target": None, "payload": {"weights": [1, 2], "values": [2, 3], "capacity": 3}},
    "lcs": {"numbers": [], "target": None, "payload": {"s1": "ABC", "s2": "AC"}},
    "bst_operations": {
        "numbers": [],
        "target": None,
        "payload": {"initial_keys": [10, 5], "operations": [{"op": "search", "key": 5}]},
    },
    "heap_operations": {
        "numbers": [],
        "target": None,
        "payload": {"heap_type": "max", "initial_array": [3, 1, 2], "operations": [{"op": "peek"}]},
    },
    "kmp": {"numbers": [], "target": None, "payload": {"text": "ABABAB", "pattern": "AB"}},
    "rabin_karp": {"numbers": [], "target": None, "payload": {"text": "ABABAB", "pattern": "AB"}},
}


def _assert_step_explanations(tag: str, steps) -> None:
    assert steps, f"{tag} returned no steps"
    for step in steps:
        missing = missing_sections(step.explanation)
        assert not missing, f"{tag} step {step.index} missing sections: {missing}"


def test_study_mode_items_are_rubric_compliant() -> None:
    for item in study_mode_items():
        _assert_step_explanations(f"study::{item.algorithm}", item.steps)


def test_custom_visualization_all_algorithms_are_rubric_compliant() -> None:
    for algorithm, params in SAMPLE_INPUTS.items():
        response = build_custom_visualization(
            algorithm=algorithm,
            question=f"Rubric check for {algorithm}",
            numbers=params["numbers"],
            target=params["target"],
            payload=params["payload"],
        )
        _assert_step_explanations(f"custom::{algorithm}", response.steps)
