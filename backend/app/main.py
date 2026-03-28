from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware

from .logic import build_custom_visualization, study_mode_items
from .models import (
    AlgorithmType,
    CreateCustomVisualizerRequest,
    CustomVisualizeRequest,
    CustomVisualizer,
    StudyItem,
    UpdateCustomVisualizerRequest,
    VisualizationResponse,
)
from .store import CustomVisualizerStore

app = FastAPI(title="Algorithm Query Visualiser API", version="0.2.0")
store = CustomVisualizerStore(Path(__file__).resolve().parent.parent / "data" / "custom_visualizers.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/algorithms", response_model=list[AlgorithmType])
def list_algorithms() -> list[AlgorithmType]:
    return ["linear_search", "binary_search", "bubble_sort"]


@app.get("/api/study-mode", response_model=list[StudyItem])
def get_study_mode() -> list[StudyItem]:
    return study_mode_items()


@app.get("/api/study-mode/{study_id}", response_model=StudyItem)
def get_study_mode_item(study_id: str) -> StudyItem:
    item = next((entry for entry in study_mode_items() if entry.id == study_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Study visualizer not found.")
    return item


@app.post("/api/custom-visualize", response_model=VisualizationResponse)
def custom_visualize(payload: CustomVisualizeRequest) -> VisualizationResponse:
    try:
        return build_custom_visualization(
            algorithm=payload.algorithm,
            question=payload.question,
            numbers=payload.numbers,
            target=payload.target,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/custom-visualizers", response_model=list[CustomVisualizer])
def list_custom_visualizers(algorithm: AlgorithmType | None = Query(default=None)) -> list[CustomVisualizer]:
    items = store.list()
    if algorithm is None:
        return items
    return [item for item in items if item.algorithm == algorithm]


@app.post("/api/custom-visualizers", response_model=CustomVisualizer, status_code=status.HTTP_201_CREATED)
def create_custom_visualizer(payload: CreateCustomVisualizerRequest) -> CustomVisualizer:
    return store.create(payload)


@app.get("/api/custom-visualizers/{visualizer_id}", response_model=CustomVisualizer)
def get_custom_visualizer(visualizer_id: str) -> CustomVisualizer:
    visualizer = store.get(visualizer_id)
    if visualizer is None:
        raise HTTPException(status_code=404, detail="Custom visualizer not found.")
    return visualizer


@app.put("/api/custom-visualizers/{visualizer_id}", response_model=CustomVisualizer)
def update_custom_visualizer(visualizer_id: str, payload: UpdateCustomVisualizerRequest) -> CustomVisualizer:
    existing = store.get(visualizer_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Custom visualizer not found.")

    try:
        updated = store.update(visualizer_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if updated is None:
        raise HTTPException(status_code=404, detail="Custom visualizer not found.")
    return updated


@app.delete("/api/custom-visualizers/{visualizer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_visualizer(visualizer_id: str) -> Response:
    if not store.delete(visualizer_id):
        raise HTTPException(status_code=404, detail="Custom visualizer not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/custom-visualizers/{visualizer_id}/run", response_model=VisualizationResponse)
def run_saved_custom_visualizer(visualizer_id: str) -> VisualizationResponse:
    visualizer = store.get(visualizer_id)
    if visualizer is None:
        raise HTTPException(status_code=404, detail="Custom visualizer not found.")

    return VisualizationResponse(
        algorithm=visualizer.algorithm,
        question=visualizer.question,
        query=visualizer.query,
        summary=visualizer.summary,
        steps=visualizer.steps,
    )
