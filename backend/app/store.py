from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from .models import CustomVisualizer, CreateCustomVisualizerRequest, UpdateCustomVisualizerRequest


class CustomVisualizerStore:
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self.file_path.write_text("[]", encoding="utf-8")

    def _migrate_step(self, step: dict[str, Any]) -> tuple[dict[str, Any], bool]:
        migrated = dict(step)
        changed = False

        state = migrated.get("state")
        highlighted = migrated.get("highlighted_indices")

        if isinstance(state, list):
            migrated["state"] = {
                "kind": "array_state",
                "values": state,
                "highlighted_indices": highlighted if isinstance(highlighted, list) else [],
            }
            migrated.setdefault("highlighted_indices", highlighted if isinstance(highlighted, list) else [])
            changed = True
        elif isinstance(state, dict) and "values" in state and "kind" not in state:
            migrated["state"] = {"kind": "array_state", **state}
            changed = True

        state = migrated.get("state")
        if isinstance(state, dict) and state.get("kind") == "array_state":
            if "highlighted_indices" not in state:
                state["highlighted_indices"] = migrated.get("highlighted_indices", [])
                changed = True
            if "highlighted_indices" not in migrated:
                migrated["highlighted_indices"] = state.get("highlighted_indices", [])
                changed = True

        return migrated, changed

    def _migrate_item(self, item: dict[str, Any]) -> tuple[dict[str, Any], bool]:
        migrated = dict(item)
        changed = False
        steps = migrated.get("steps")
        if not isinstance(steps, list):
            return migrated, False

        new_steps: list[Any] = []
        for step in steps:
            if isinstance(step, dict):
                migrated_step, migrated_changed = self._migrate_step(step)
                new_steps.append(migrated_step)
                changed = changed or migrated_changed
            else:
                new_steps.append(step)

        if changed:
            migrated["steps"] = new_steps
        return migrated, changed

    def _read(self) -> list[dict[str, Any]]:
        data = json.loads(self.file_path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            return []

        changed = False
        migrated_data: list[dict[str, Any]] = []
        for item in data:
            if isinstance(item, dict):
                migrated_item, item_changed = self._migrate_item(item)
                migrated_data.append(migrated_item)
                changed = changed or item_changed
            else:
                migrated_data.append(item)

        if changed:
            self._write(migrated_data)

        return migrated_data

    def _write(self, payload: list[dict[str, Any]]) -> None:
        self.file_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def list(self) -> list[CustomVisualizer]:
        return [CustomVisualizer.model_validate(item) for item in self._read()]

    def get(self, visualizer_id: str) -> CustomVisualizer | None:
        for item in self._read():
            if item.get("id") == visualizer_id:
                return CustomVisualizer.model_validate(item)
        return None

    def create(self, payload: CreateCustomVisualizerRequest) -> CustomVisualizer:
        now = datetime.now(UTC).isoformat()
        visualizer = CustomVisualizer(
            id=f"custom-{uuid4().hex}",
            created_at=now,
            updated_at=now,
            **payload.model_dump(),
        )

        all_items = self._read()
        all_items.append(visualizer.model_dump())
        self._write(all_items)
        return visualizer

    def update(self, visualizer_id: str, payload: UpdateCustomVisualizerRequest) -> CustomVisualizer | None:
        all_items = self._read()

        for idx, existing in enumerate(all_items):
            if existing.get("id") != visualizer_id:
                continue

            merged = {**existing, **payload.model_dump(exclude_none=True)}
            merged["updated_at"] = datetime.now(UTC).isoformat()
            model = CustomVisualizer.model_validate(merged)
            all_items[idx] = model.model_dump()
            self._write(all_items)
            return model

        return None

    def delete(self, visualizer_id: str) -> bool:
        all_items = self._read()
        filtered = [item for item in all_items if item.get("id") != visualizer_id]
        if len(filtered) == len(all_items):
            return False
        self._write(filtered)
        return True
