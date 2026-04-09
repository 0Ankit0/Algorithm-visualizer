from .base import AlgorithmVisualizer
from .search import SEARCH_ALGORITHM_REGISTRY
from .sort import SORT_ALGORITHM_REGISTRY

ALGORITHM_REGISTRY: dict[str, AlgorithmVisualizer] = {
    **SEARCH_ALGORITHM_REGISTRY,
    **SORT_ALGORITHM_REGISTRY,
}
