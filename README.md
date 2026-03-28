# Algorithm Query Visualiser

A full-stack starter app for visualising algorithm/query execution in two modes:

1. **Study Mode**: prebuilt algorithm walkthroughs with detailed explanations.
2. **Custom Mode**: user-configured visualisations by selecting an algorithm, adding a question, and either auto-generating or saving step-by-step walkthroughs.

## Tech stack

- **Backend**: FastAPI
- **Frontend**: Next.js (App Router + TypeScript)

## Project structure

- `backend/` — FastAPI service, visualisation logic, and JSON persistence for saved custom visualisers
- `frontend/` — Next.js UI

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## API endpoints

### Core

- `GET /health`
- `GET /api/algorithms`

### Study mode

- `GET /api/study-mode`
- `GET /api/study-mode/{study_id}`

### Auto-generated custom visualisation

- `POST /api/custom-visualize`

### Saved custom visualisers

- `GET /api/custom-visualizers`
- `POST /api/custom-visualizers`
- `GET /api/custom-visualizers/{visualizer_id}`
- `PUT /api/custom-visualizers/{visualizer_id}`
- `DELETE /api/custom-visualizers/{visualizer_id}`
- `POST /api/custom-visualizers/{visualizer_id}/run`
