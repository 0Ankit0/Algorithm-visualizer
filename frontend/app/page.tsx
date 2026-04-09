'use client';

import { useEffect, useMemo, useState } from 'react';

import { ModeTabs } from '@/components/ModeTabs';
import { StepViewer } from '@/components/StepViewer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  { label: 'Jump Search', value: 'jump_search' },
  { label: 'Interpolation Search', value: 'interpolation_search' },
  { label: 'Bubble Sort', value: 'bubble_sort' },
  { label: 'Insertion Sort', value: 'insertion_sort' },
  { label: 'Selection Sort', value: 'selection_sort' },
  { label: 'Merge Sort', value: 'merge_sort' },
  { label: 'Quick Sort', value: 'quick_sort' },
  { label: 'Heap Sort', value: 'heap_sort' },
  { label: 'BFS', value: 'bfs' },
  { label: 'DFS', value: 'dfs' },
  { label: 'Dijkstra', value: 'dijkstra' },
  { label: 'A*', value: 'a_star' },
  { label: 'Fibonacci (Tabulation)', value: 'fibonacci_tabulation' },
  { label: 'Fibonacci (Memoization)', value: 'fibonacci_memoization' },
  { label: '0/1 Knapsack', value: 'knapsack_01' },
  { label: 'LCS', value: 'lcs' },
  { label: 'BST Operations', value: 'bst_operations' },
  { label: 'Heap Operations', value: 'heap_operations' },
  { label: 'KMP', value: 'kmp' },
  { label: 'Rabin-Karp', value: 'rabin_karp' },
];

function parseCsvNumbers(input: string): number[] {
  return input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
}

function parseCsvValues(input: string): Array<number | string> {
  return input
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => {
      const maybeNumber = Number(value);
      return Number.isFinite(maybeNumber) ? maybeNumber : value;
    });
}

function toVisualizationSteps(builderSteps: BuilderStep[]): VisualizationStep[] {
  return builderSteps.map((step, idx) => ({
    index: idx + 1,
    title: step.title,
    state: parseCsvValues(step.stateInput),
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
  const [generatePayloadInput, setGeneratePayloadInput] = useState('{\n  "numbers": [3, 9, 1, 12, 7],\n  "target": 9\n}');
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

    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = generatePayloadInput.trim() ? (JSON.parse(generatePayloadInput) as Record<string, unknown>) : {};
    } catch {
      setGenerateError('Payload must be valid JSON.');
      return;
    }

    const requestBody = {
      algorithm: generateAlgorithm,
      question: generateQuestion,
      numbers: Array.isArray(parsedPayload.numbers) ? (parsedPayload.numbers as number[]) : [],
      target: typeof parsedPayload.target === 'number' ? parsedPayload.target : undefined,
      payload: parsedPayload,
    };

    const response = await fetch(`${API_BASE}/api/custom-visualize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
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
    <main className="mx-auto max-w-6xl space-y-4 px-4 pb-16 pt-8">
      <h1 className="text-3xl font-bold">Algorithm Query Visualiser</h1>
      <p className="max-w-4xl text-zinc-400">
        Learn from prebuilt walkthroughs, generate fresh traces from input numbers, and save your own step-by-step algorithm/query
        visualisers.
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
        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold">Study Mode</h2>
            <p className="mb-4 mt-1 text-sm text-zinc-400">Pre-built visualisers with detailed explanations.</p>
            {studyLoading ? <p className="mb-3 text-sm text-zinc-300">Loading...</p> : null}

            <div className="grid gap-2">
              {studyItems.map((item) => (
                <Button key={item.id} variant={item.id === selectedStudyId ? 'default' : 'outline'} onClick={() => setSelectedStudyId(item.id)}>
                  <span className="text-left">
                    <strong className="block">{item.name}</strong>
                    <span className="text-xs text-zinc-300">{item.description}</span>
                  </span>
                </Button>
              ))}
            </div>
          </Card>

          {selectedStudy ? <StepViewer title={selectedStudy.name} query={selectedStudy.query} steps={selectedStudy.steps} /> : null}
        </section>
      ) : null}

      {activeMode === 'generate' ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold">Generate + Build</h2>
            <p className="mb-4 mt-1 text-sm text-zinc-400">
              Auto-generate steps from algorithm input, then customize/edit the steps and save as your own visualizer.
            </p>

            <div className="grid gap-3">
              <Label>
                Algorithm
                <Select value={generateAlgorithm} onChange={(event) => setGenerateAlgorithm(event.target.value as AlgorithmType)}>
                  {algorithmOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Label>

              <Label>
                Question
                <Textarea value={generateQuestion} rows={2} onChange={(event) => setGenerateQuestion(event.target.value)} />
              </Label>

              <Label>
                Algorithm Payload (JSON)
                <Textarea value={generatePayloadInput} rows={8} onChange={(event) => setGeneratePayloadInput(event.target.value)} />
              </Label>

              <Button onClick={handleGenerateVisualization}>Generate Visualization</Button>
              {generateError ? <p className="mb-0 text-sm text-red-400">{generateError}</p> : null}
            </div>
          </Card>

          {generatedVisualization ? (
            <StepViewer title="Generated Visualization" query={generatedVisualization.query} steps={generatedVisualization.steps} />
          ) : (
            <Card>
              <h3 className="text-lg font-semibold">No generated output yet</h3>
              <p className="mt-2 text-sm text-zinc-400">Generate a visualization first, then refine and save it below.</p>
            </Card>
          )}

          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold">Custom Visualizer Builder</h3>
            <p className="mb-4 mt-1 text-sm text-zinc-400">Edit metadata and steps, then save to the backend.</p>

            <div className="grid gap-3 lg:grid-cols-2">
              <Label>
                Title
                <Input value={builderTitle} onChange={(event) => setBuilderTitle(event.target.value)} />
              </Label>

              <Label>
                Algorithm
                <Select value={builderAlgorithm} onChange={(event) => setBuilderAlgorithm(event.target.value as AlgorithmType)}>
                  {algorithmOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Label>
            </div>

            <Label className="mt-3">
              Question
              <Textarea value={builderQuestion} rows={2} onChange={(event) => setBuilderQuestion(event.target.value)} />
            </Label>
            <Label className="mt-3">
              Query
              <Input value={builderQuery} onChange={(event) => setBuilderQuery(event.target.value)} />
            </Label>
            <Label className="mt-3">
              Summary
              <Textarea value={builderSummary} rows={2} onChange={(event) => setBuilderSummary(event.target.value)} />
            </Label>

            <h4 className="mb-3 mt-4 font-semibold">Steps</h4>
            <div className="grid gap-3">
              {builderSteps.map((step, idx) => (
                <Card key={`builder-step-${idx}`}>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <Label>
                      Step title
                      <Input value={step.title} onChange={(event) => updateBuilderStep(idx, 'title', event.target.value)} />
                    </Label>
                    <Label>
                      State values (comma separated)
                      <Input value={step.stateInput} onChange={(event) => updateBuilderStep(idx, 'stateInput', event.target.value)} />
                    </Label>
                  </div>

                  <Label className="mt-3">
                    Highlighted indices (comma separated)
                    <Input
                      value={step.highlightedInput}
                      onChange={(event) => updateBuilderStep(idx, 'highlightedInput', event.target.value)}
                    />
                  </Label>

                  <Label className="mt-3">
                    Explanation
                    <Textarea value={step.explanation} rows={2} onChange={(event) => updateBuilderStep(idx, 'explanation', event.target.value)} />
                  </Label>

                  <Button className="mt-3" variant="outline" onClick={() => removeBuilderStep(idx)}>
                    Remove step
                  </Button>
                </Card>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={addBuilderStep}>
                Add Step
              </Button>
              <Button onClick={saveCustomVisualizer}>Save Custom Visualizer</Button>
            </div>
            {builderMessage ? <p className="mt-2 text-sm text-emerald-300">{builderMessage}</p> : null}
          </Card>
        </section>
      ) : null}

      {activeMode === 'saved' ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold">Saved Visualizers</h2>
            <p className="mb-4 mt-1 text-sm text-zinc-400">Run or delete previously saved custom visualizers.</p>
            {savedLoading ? <p className="mb-3 text-sm text-zinc-300">Loading...</p> : null}

            <div className="grid gap-2">
              {savedVisualizers.map((item) => (
                <Button key={item.id} variant={item.id === selectedSavedId ? 'default' : 'outline'} onClick={() => setSelectedSavedId(item.id)}>
                  <span className="text-left">
                    <strong className="block">{item.title}</strong>
                    <span className="text-xs text-zinc-300">{item.question}</span>
                  </span>
                </Button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={runSavedVisualizer}>Run Selected</Button>
              <Button variant="outline" onClick={deleteSavedVisualizer}>
                Delete Selected
              </Button>
            </div>
            {savedError ? <p className="mt-2 text-sm text-red-400">{savedError}</p> : null}
          </Card>

          {savedRunResult ? (
            <StepViewer title={selectedSaved?.title ?? 'Saved Visualization'} query={savedRunResult.query} steps={savedRunResult.steps} />
          ) : (
            <Card>
              <h3 className="text-lg font-semibold">Run a saved visualizer</h3>
              <p className="mt-2 text-sm text-zinc-400">Pick one from the list and click Run Selected.</p>
            </Card>
          )}
        </section>
      ) : null}
    </main>
  );
}
