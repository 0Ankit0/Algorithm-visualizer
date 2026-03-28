'use client';

import { useEffect, useMemo, useState } from 'react';

import { ModeTabs } from '@/components/ModeTabs';
import { StepViewer } from '@/components/StepViewer';
import type {
  AlgorithmType,
  CreateCustomVisualizerRequest,
  CustomVisualizer,
  StudyItem,
  VisualizationResponse,
  VisualizationStep,
} from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

type MainMode = 'study' | 'generate' | 'saved';

type BuilderStep = {
  title: string;
  stateInput: string;
  highlightedInput: string;
  explanation: string;
};

const algorithmOptions: Array<{ label: string; value: AlgorithmType }> = [
  { label: 'Linear Search', value: 'linear_search' },
  { label: 'Binary Search', value: 'binary_search' },
  { label: 'Bubble Sort', value: 'bubble_sort' },
];

function parseCsvNumbers(input: string): number[] {
  return input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
}

function toVisualizationSteps(builderSteps: BuilderStep[]): VisualizationStep[] {
  return builderSteps.map((step, idx) => ({
    index: idx + 1,
    title: step.title,
    state: parseCsvNumbers(step.stateInput),
    explanation: step.explanation,
    highlighted_indices: parseCsvNumbers(step.highlightedInput),
  }));
}

export default function HomePage() {
  const [activeMode, setActiveMode] = useState<MainMode>('study');

  const [studyItems, setStudyItems] = useState<StudyItem[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState<string>('');
  const [studyLoading, setStudyLoading] = useState(false);

  const [generateAlgorithm, setGenerateAlgorithm] = useState<AlgorithmType>('linear_search');
  const [generateQuestion, setGenerateQuestion] = useState('Where can I find 9?');
  const [generateNumbersInput, setGenerateNumbersInput] = useState('3, 9, 1, 12, 7');
  const [generateTargetInput, setGenerateTargetInput] = useState('9');
  const [generatedVisualization, setGeneratedVisualization] = useState<VisualizationResponse | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [savedVisualizers, setSavedVisualizers] = useState<CustomVisualizer[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [selectedSavedId, setSelectedSavedId] = useState<string>('');
  const [savedRunResult, setSavedRunResult] = useState<VisualizationResponse | null>(null);
  const [savedError, setSavedError] = useState<string | null>(null);

  const [builderTitle, setBuilderTitle] = useState('My custom visualizer');
  const [builderAlgorithm, setBuilderAlgorithm] = useState<AlgorithmType>('linear_search');
  const [builderQuestion, setBuilderQuestion] = useState('What is happening in this query?');
  const [builderQuery, setBuilderQuery] = useState('Custom walkthrough query');
  const [builderSummary, setBuilderSummary] = useState('Step-by-step explanation for this custom query.');
  const [builderSteps, setBuilderSteps] = useState<BuilderStep[]>([
    {
      title: 'Step 1',
      stateInput: '3, 9, 1, 12',
      highlightedInput: '1',
      explanation: 'Start by checking the value at index 1.',
    },
  ]);
  const [builderMessage, setBuilderMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchStudyMode();
    void fetchSavedVisualizers();
  }, []);

  async function fetchStudyMode() {
    setStudyLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/study-mode`);
      const data = (await response.json()) as StudyItem[];
      setStudyItems(data);
      if (data.length > 0 && !selectedStudyId) {
        setSelectedStudyId(data[0].id);
      }
    } finally {
      setStudyLoading(false);
    }
  }

  async function fetchSavedVisualizers() {
    setSavedLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/custom-visualizers`);
      const data = (await response.json()) as CustomVisualizer[];
      setSavedVisualizers(data);
      if (data.length > 0 && !selectedSavedId) {
        setSelectedSavedId(data[0].id);
      }
    } finally {
      setSavedLoading(false);
    }
  }

  const selectedStudy = useMemo(() => studyItems.find((item) => item.id === selectedStudyId) ?? null, [studyItems, selectedStudyId]);
  const selectedSaved = useMemo(
    () => savedVisualizers.find((item) => item.id === selectedSavedId) ?? null,
    [savedVisualizers, selectedSavedId],
  );

  async function handleGenerateVisualization() {
    setGenerateError(null);

    const numbers = parseCsvNumbers(generateNumbersInput);
    if (numbers.length === 0) {
      setGenerateError('Please provide at least one valid number.');
      return;
    }

    const payload: {
      algorithm: AlgorithmType;
      question: string;
      numbers: number[];
      target?: number;
    } = {
      algorithm: generateAlgorithm,
      question: generateQuestion,
      numbers,
    };

    if (generateAlgorithm !== 'bubble_sort') {
      const target = Number(generateTargetInput);
      if (!Number.isFinite(target)) {
        setGenerateError('Target is required for search algorithms.');
        return;
      }
      payload.target = target;
    }

    const response = await fetch(`${API_BASE}/api/custom-visualize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as VisualizationResponse | { detail?: string };
    if (!response.ok) {
      setGeneratedVisualization(null);
      setGenerateError((data as { detail?: string }).detail ?? 'Failed to generate visualization.');
      return;
    }

    setGeneratedVisualization(data as VisualizationResponse);
    setBuilderAlgorithm((data as VisualizationResponse).algorithm);
    setBuilderQuestion((data as VisualizationResponse).question);
    setBuilderQuery((data as VisualizationResponse).query);
    setBuilderSummary((data as VisualizationResponse).summary);
    setBuilderSteps(
      (data as VisualizationResponse).steps.map((step) => ({
        title: step.title,
        stateInput: step.state.join(', '),
        highlightedInput: step.highlighted_indices.join(', '),
        explanation: step.explanation,
      })),
    );
  }

  function updateBuilderStep(idx: number, key: keyof BuilderStep, value: string) {
    setBuilderSteps((prev) => prev.map((step, stepIdx) => (stepIdx === idx ? { ...step, [key]: value } : step)));
  }

  function addBuilderStep() {
    setBuilderSteps((prev) => [
      ...prev,
      {
        title: `Step ${prev.length + 1}`,
        stateInput: '',
        highlightedInput: '',
        explanation: '',
      },
    ]);
  }

  function removeBuilderStep(idx: number) {
    setBuilderSteps((prev) => prev.filter((_, stepIdx) => stepIdx !== idx));
  }

  async function saveCustomVisualizer() {
    setBuilderMessage(null);

    if (!builderTitle.trim() || !builderQuestion.trim() || !builderQuery.trim() || !builderSummary.trim()) {
      setBuilderMessage('Please fill in title, question, query, and summary.');
      return;
    }

    const steps = toVisualizationSteps(builderSteps);
    if (steps.length === 0) {
      setBuilderMessage('Please add at least one step.');
      return;
    }

    if (steps.some((step) => !step.title.trim() || !step.explanation.trim() || step.state.length === 0)) {
      setBuilderMessage('Each step needs a title, explanation, and at least one state value.');
      return;
    }

    const request: CreateCustomVisualizerRequest = {
      title: builderTitle,
      algorithm: builderAlgorithm,
      question: builderQuestion,
      query: builderQuery,
      summary: builderSummary,
      steps,
    };

    const response = await fetch(`${API_BASE}/api/custom-visualizers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const data = (await response.json()) as CustomVisualizer | { detail?: string };
    if (!response.ok) {
      setBuilderMessage((data as { detail?: string }).detail ?? 'Could not save custom visualizer.');
      return;
    }

    const created = data as CustomVisualizer;
    setSavedVisualizers((prev) => [created, ...prev]);
    setSelectedSavedId(created.id);
    setActiveMode('saved');
    setBuilderMessage('Custom visualizer saved successfully.');
  }

  async function runSavedVisualizer() {
    setSavedError(null);
    if (!selectedSavedId) {
      setSavedError('Select a saved visualizer first.');
      return;
    }

    const response = await fetch(`${API_BASE}/api/custom-visualizers/${selectedSavedId}/run`, { method: 'POST' });
    const data = (await response.json()) as VisualizationResponse | { detail?: string };
    if (!response.ok) {
      setSavedRunResult(null);
      setSavedError((data as { detail?: string }).detail ?? 'Could not run saved visualizer.');
      return;
    }

    setSavedRunResult(data as VisualizationResponse);
  }

  async function deleteSavedVisualizer() {
    setSavedError(null);
    if (!selectedSavedId) {
      setSavedError('Select a saved visualizer first.');
      return;
    }

    const response = await fetch(`${API_BASE}/api/custom-visualizers/${selectedSavedId}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = (await response.json()) as { detail?: string };
      setSavedError(data.detail ?? 'Could not delete visualizer.');
      return;
    }

    const remaining = savedVisualizers.filter((item) => item.id !== selectedSavedId);
    setSavedVisualizers(remaining);
    setSelectedSavedId(remaining[0]?.id ?? '');
    setSavedRunResult(null);
  }

  return (
    <main>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Algorithm Query Visualiser</h1>
      <p style={{ color: '#a1a1aa', marginTop: 0 }}>
        Learn from prebuilt walkthroughs, generate fresh traces from input numbers, and save your own step-by-step algorithm/query visualisers.
      </p>

      <ModeTabs
        activeMode={activeMode}
        setActiveMode={(mode) => setActiveMode(mode as MainMode)}
        tabs={[
          { key: 'study', label: 'Study Mode' },
          { key: 'generate', label: 'Generate + Build' },
          { key: 'saved', label: 'Saved Visualizers' },
        ]}
      />

      {activeMode === 'study' ? (
        <section className="grid two">
          <div className="card">
            <h2>Study Mode</h2>
            <p style={{ color: '#a1a1aa' }}>Pre-built visualisers with detailed explanations.</p>
            {studyLoading ? <p>Loading...</p> : null}

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {studyItems.map((item) => (
                <button key={item.id} className={item.id === selectedStudyId ? 'primary' : ''} onClick={() => setSelectedStudyId(item.id)}>
                  <strong>{item.name}</strong>
                  <br />
                  <span style={{ color: '#d4d4d8' }}>{item.description}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedStudy ? <StepViewer title={selectedStudy.name} query={selectedStudy.query} steps={selectedStudy.steps} /> : null}
        </section>
      ) : null}

      {activeMode === 'generate' ? (
        <section className="grid two">
          <div className="card">
            <h2>Generate + Build</h2>
            <p style={{ color: '#a1a1aa' }}>
              Auto-generate steps from algorithm input, then customize/edit the steps and save as your own visualizer.
            </p>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <label>
                Algorithm
                <select value={generateAlgorithm} onChange={(event) => setGenerateAlgorithm(event.target.value as AlgorithmType)}>
                  {algorithmOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Question
                <textarea value={generateQuestion} rows={2} onChange={(event) => setGenerateQuestion(event.target.value)} />
              </label>

              <label>
                Numbers (comma separated)
                <input value={generateNumbersInput} onChange={(event) => setGenerateNumbersInput(event.target.value)} />
              </label>

              {generateAlgorithm !== 'bubble_sort' ? (
                <label>
                  Target
                  <input value={generateTargetInput} onChange={(event) => setGenerateTargetInput(event.target.value)} />
                </label>
              ) : null}

              <button className="primary" onClick={handleGenerateVisualization}>
                Generate Visualization
              </button>
              {generateError ? <p style={{ color: '#f87171', marginBottom: 0 }}>{generateError}</p> : null}
            </div>
          </div>

          {generatedVisualization ? (
            <StepViewer title="Generated Visualization" query={generatedVisualization.query} steps={generatedVisualization.steps} />
          ) : (
            <div className="card">
              <h3>No generated output yet</h3>
              <p style={{ color: '#a1a1aa' }}>Generate a visualization first, then refine and save it below.</p>
            </div>
          )}

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3>Custom Visualizer Builder</h3>
            <p style={{ color: '#a1a1aa' }}>Edit metadata and steps, then save to the backend.</p>

            <div className="grid two">
              <label>
                Title
                <input value={builderTitle} onChange={(event) => setBuilderTitle(event.target.value)} />
              </label>

              <label>
                Algorithm
                <select value={builderAlgorithm} onChange={(event) => setBuilderAlgorithm(event.target.value as AlgorithmType)}>
                  {algorithmOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Question
              <textarea value={builderQuestion} rows={2} onChange={(event) => setBuilderQuestion(event.target.value)} />
            </label>
            <label>
              Query
              <input value={builderQuery} onChange={(event) => setBuilderQuery(event.target.value)} />
            </label>
            <label>
              Summary
              <textarea value={builderSummary} rows={2} onChange={(event) => setBuilderSummary(event.target.value)} />
            </label>

            <h4>Steps</h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {builderSteps.map((step, idx) => (
                <div className="card" key={`builder-step-${idx}`}>
                  <div className="grid two">
                    <label>
                      Step title
                      <input value={step.title} onChange={(event) => updateBuilderStep(idx, 'title', event.target.value)} />
                    </label>
                    <label>
                      State values (comma separated)
                      <input value={step.stateInput} onChange={(event) => updateBuilderStep(idx, 'stateInput', event.target.value)} />
                    </label>
                  </div>

                  <label>
                    Highlighted indices (comma separated)
                    <input
                      value={step.highlightedInput}
                      onChange={(event) => updateBuilderStep(idx, 'highlightedInput', event.target.value)}
                    />
                  </label>

                  <label>
                    Explanation
                    <textarea value={step.explanation} rows={2} onChange={(event) => updateBuilderStep(idx, 'explanation', event.target.value)} />
                  </label>

                  <button onClick={() => removeBuilderStep(idx)}>Remove step</button>
                </div>
              ))}
            </div>

            <div className="controls">
              <button onClick={addBuilderStep}>Add Step</button>
              <button className="primary" onClick={saveCustomVisualizer}>
                Save Custom Visualizer
              </button>
            </div>
            {builderMessage ? <p style={{ color: '#86efac' }}>{builderMessage}</p> : null}
          </div>
        </section>
      ) : null}

      {activeMode === 'saved' ? (
        <section className="grid two">
          <div className="card">
            <h2>Saved Visualizers</h2>
            <p style={{ color: '#a1a1aa' }}>Run or delete previously saved custom visualizers.</p>
            {savedLoading ? <p>Loading...</p> : null}

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {savedVisualizers.map((item) => (
                <button key={item.id} className={item.id === selectedSavedId ? 'primary' : ''} onClick={() => setSelectedSavedId(item.id)}>
                  <strong>{item.title}</strong>
                  <br />
                  <span style={{ color: '#d4d4d8' }}>{item.question}</span>
                </button>
              ))}
            </div>

            <div className="controls">
              <button className="primary" onClick={runSavedVisualizer}>
                Run Selected
              </button>
              <button onClick={deleteSavedVisualizer}>Delete Selected</button>
            </div>
            {savedError ? <p style={{ color: '#f87171' }}>{savedError}</p> : null}
          </div>

          {savedRunResult ? (
            <StepViewer title={selectedSaved?.title ?? 'Saved Visualization'} query={savedRunResult.query} steps={savedRunResult.steps} />
          ) : (
            <div className="card">
              <h3>Run a saved visualizer</h3>
              <p style={{ color: '#a1a1aa' }}>Pick one from the list and click Run Selected.</p>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
