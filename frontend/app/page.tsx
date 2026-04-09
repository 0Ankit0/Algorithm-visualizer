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
import {
  getStepHighlightedIndices,
  getStepValues,
  type AlgorithmDescriptor,
  type AlgorithmInputField,
  type AlgorithmType,
  type CreateCustomVisualizerRequest,
  type CustomVisualizer,
  type StudyItem,
  type VisualizationResponse,
  type VisualizationStep,
} from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

type MainMode = 'study' | 'generate' | 'saved';

type BuilderStep = {
  title: string;
  stateInput: string;
  highlightedInput: string;
  explanation: string;
};

const fallbackAlgorithmOptions: Array<{ label: string; value: AlgorithmType }> = [
  { label: 'Linear Search', value: 'linear_search' }, { label: 'Binary Search', value: 'binary_search' }, { label: 'Jump Search', value: 'jump_search' },
  { label: 'Interpolation Search', value: 'interpolation_search' }, { label: 'Bubble Sort', value: 'bubble_sort' }, { label: 'Insertion Sort', value: 'insertion_sort' },
  { label: 'Selection Sort', value: 'selection_sort' }, { label: 'Merge Sort', value: 'merge_sort' }, { label: 'Quick Sort', value: 'quick_sort' }, { label: 'Heap Sort', value: 'heap_sort' },
  { label: 'BFS', value: 'bfs' }, { label: 'DFS', value: 'dfs' }, { label: 'Dijkstra', value: 'dijkstra' }, { label: 'A*', value: 'a_star' },
  { label: 'Fibonacci (Tabulation)', value: 'fibonacci_tabulation' }, { label: 'Fibonacci (Memoization)', value: 'fibonacci_memoization' }, { label: '0/1 Knapsack', value: 'knapsack_01' },
  { label: 'LCS', value: 'lcs' }, { label: 'BST Operations', value: 'bst_operations' }, { label: 'Heap Operations', value: 'heap_operations' }, { label: 'KMP', value: 'kmp' }, { label: 'Rabin-Karp', value: 'rabin_karp' },
];

const fallbackAlgorithmDescriptors: AlgorithmDescriptor[] = fallbackAlgorithmOptions.map((item) => ({
  algorithm: item.value,
  label: item.label,
  category: 'other',
  fields: [],
  sample_presets: [],
}));

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

function stringifyPresetValue(value: unknown, type: AlgorithmInputField['type']): string {
  if (type === 'number_list' && Array.isArray(value)) return value.join(', ');
  if (type === 'string_list' && Array.isArray(value)) return value.map(String).join(', ');
  if (type === 'edge_list' && Array.isArray(value)) return value.map((edge) => (Array.isArray(edge) ? `${edge[0]}-${edge[1]}` : '')).filter(Boolean).join(', ');
  if (type === 'weighted_edge_list' && Array.isArray(value)) return value.map((edge) => (Array.isArray(edge) ? `${edge[0]}-${edge[1]}:${edge[2]}` : '')).filter(Boolean).join(', ');
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return '';
}

function parseFieldInput(type: AlgorithmInputField['type'], rawInput: string): unknown {
  const value = rawInput.trim();
  if (!value) return undefined;
  if (type === 'number') return Number(value);
  if (type === 'number_list') return parseCsvNumbers(value);
  if (type === 'string_list') return value.split(',').map((part) => part.trim()).filter(Boolean);
  if (type === 'edge_list') {
    return value.split(',').map((pair) => pair.trim()).filter(Boolean).map((pair) => pair.split('-').map((node) => node.trim()));
  }
  if (type === 'weighted_edge_list') {
    return value.split(',').map((part) => part.trim()).filter(Boolean).map((part) => {
      const [pair, weight] = part.split(':');
      const [from, to] = pair.split('-').map((node) => node.trim());
      return [from, to, Number(weight)];
    });
  }
  return value;
}

function validateFieldInput(field: AlgorithmInputField, rawInput: string): string | null {
  const value = rawInput.trim();
  if (!value) return field.required ? `Required. Example: ${field.example ?? 'see placeholder'}` : null;
  if (field.type === 'number' && Number.isNaN(Number(value))) return `Please enter a number. Example: ${field.example ?? '9'}`;
  if (field.type === 'number_list' && parseCsvNumbers(value).length === 0) return `Use comma-separated numbers. Example: ${field.example ?? '3, 9, 1'}`;
  if (field.type === 'edge_list') {
    const ok = value.split(',').every((part) => part.includes('-'));
    if (!ok) return `Use u-v pairs separated by commas. Example: ${field.example ?? 'A-B, A-C'}`;
  }
  if (field.type === 'weighted_edge_list') {
    const ok = value.split(',').every((part) => part.includes('-') && part.includes(':') && !Number.isNaN(Number(part.split(':')[1])));
    if (!ok) return `Use u-v:w format. Example: ${field.example ?? 'A-B:4, B-C:2'}`;
  }
  return null;
}

export default function HomePage() {
  const [activeMode, setActiveMode] = useState<MainMode>('study');

  const [studyItems, setStudyItems] = useState<StudyItem[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState<string>('');
  const [studyLoading, setStudyLoading] = useState(false);

  const [generateAlgorithm, setGenerateAlgorithm] = useState<AlgorithmType>('linear_search');
  const [generateQuestion, setGenerateQuestion] = useState('Where can I find 9?');
  const [algorithmDescriptors, setAlgorithmDescriptors] = useState<AlgorithmDescriptor[]>(fallbackAlgorithmDescriptors);
  const [generateFieldInputs, setGenerateFieldInputs] = useState<Record<string, string>>({});
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
    void fetchAlgorithms();
    void fetchStudyMode();
    void fetchSavedVisualizers();
  }, []);

  async function fetchAlgorithms() {
    const response = await fetch(`${API_BASE}/api/algorithms`);
    const data = (await response.json()) as Array<AlgorithmDescriptor | AlgorithmType>;
    if (Array.isArray(data) && data.length > 0 && typeof data[0] !== 'string') {
      setAlgorithmDescriptors(data as AlgorithmDescriptor[]);
      const first = (data[0] as AlgorithmDescriptor).algorithm;
      setGenerateAlgorithm(first);
      return;
    }
    setAlgorithmDescriptors(
      (data as AlgorithmType[]).map((algorithm) => ({
        algorithm,
        label: fallbackAlgorithmOptions.find((option) => option.value === algorithm)?.label ?? algorithm,
        category: 'other',
        fields: [],
        sample_presets: [],
      })),
    );
  }

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
  const algorithmOptions = useMemo(
    () => algorithmDescriptors.map((item) => ({ value: item.algorithm, label: item.label })),
    [algorithmDescriptors],
  );
  const selectedAlgorithmDescriptor = useMemo(
    () => algorithmDescriptors.find((item) => item.algorithm === generateAlgorithm) ?? null,
    [algorithmDescriptors, generateAlgorithm],
  );
  const generateFieldErrors = useMemo(() => {
    const descriptor = selectedAlgorithmDescriptor;
    if (!descriptor) return {};
    return Object.fromEntries(
      descriptor.fields.map((field) => [field.key, validateFieldInput(field, generateFieldInputs[field.key] ?? '')]),
    );
  }, [selectedAlgorithmDescriptor, generateFieldInputs]);
  const hasGenerateValidationErrors = useMemo(() => Object.values(generateFieldErrors).some((value) => value), [generateFieldErrors]);
  const selectedSaved = useMemo(
    () => savedVisualizers.find((item) => item.id === selectedSavedId) ?? null,
    [savedVisualizers, selectedSavedId],
  );

  useEffect(() => {
    if (!selectedAlgorithmDescriptor) return;
    const firstPreset = selectedAlgorithmDescriptor.sample_presets[0];
    if (firstPreset) {
      const nextInputs: Record<string, string> = {};
      for (const field of selectedAlgorithmDescriptor.fields) {
        nextInputs[field.key] = stringifyPresetValue(firstPreset.payload[field.key], field.type);
      }
      setGenerateFieldInputs(nextInputs);
      setGenerateQuestion(firstPreset.question);
      return;
    }
    setGenerateFieldInputs({});
  }, [selectedAlgorithmDescriptor]);

  async function handleGenerateVisualization() {
    setGenerateError(null);
    const descriptor = selectedAlgorithmDescriptor;
    const parsedPayload: Record<string, unknown> = {};
    if (descriptor) {
      for (const field of descriptor.fields) {
        const rawValue = generateFieldInputs[field.key] ?? '';
        const validationError = validateFieldInput(field, rawValue);
        if (validationError) {
          setGenerateError(`${field.label}: ${validationError}`);
          return;
        }
        const parsed = parseFieldInput(field.type, rawValue);
        if (parsed !== undefined) {
          parsedPayload[field.key] = parsed;
        }
      }
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
        stateInput: getStepValues(step.state).join(', '),
        highlightedInput: getStepHighlightedIndices(step).join(', '),
        explanation: step.explanation,
      })),
    );
  }

  function applyPreset(presetPayload: Record<string, unknown>, question: string) {
    setGenerateQuestion(question);
    const descriptor = selectedAlgorithmDescriptor;
    if (!descriptor) return;
    const nextInputs: Record<string, string> = {};
    for (const field of descriptor.fields) {
      nextInputs[field.key] = stringifyPresetValue(presetPayload[field.key], field.type);
    }
    setGenerateFieldInputs(nextInputs);
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

    if (steps.some((step) => !step.title.trim() || !step.explanation.trim() || getStepValues(step.state).length === 0)) {
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

          {selectedStudy ? (
            <div className="space-y-4">
              <Card>
                <h3 className="text-lg font-semibold">Study Guide</h3>
                <p className="mt-2 text-sm text-zinc-300">{selectedStudy.lesson.concept_intro}</p>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
                    <h4 className="text-sm font-semibold text-zinc-100">Problem statement</h4>
                    <p className="mt-1 text-sm text-zinc-300">{selectedStudy.lesson.problem_statement}</p>
                  </div>
                  <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
                    <h4 className="text-sm font-semibold text-zinc-100">Why this algorithm</h4>
                    <p className="mt-1 text-sm text-zinc-300">{selectedStudy.lesson.why_this_algorithm}</p>
                  </div>
                  <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
                    <h4 className="text-sm font-semibold text-zinc-100">Step-by-step trace</h4>
                    <p className="mt-1 text-sm text-zinc-300">{selectedStudy.lesson.step_by_step_trace}</p>
                  </div>
                  <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
                    <h4 className="text-sm font-semibold text-zinc-100">Final result</h4>
                    <p className="mt-1 text-sm text-zinc-300">{selectedStudy.lesson.final_result}</p>
                  </div>
                  <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
                    <h4 className="text-sm font-semibold text-zinc-100">Complexity takeaway</h4>
                    <p className="mt-1 text-sm text-zinc-300">{selectedStudy.lesson.complexity_takeaway}</p>
                  </div>
                  <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
                    <h4 className="text-sm font-semibold text-zinc-100">Common mistakes</h4>
                    <p className="mt-1 text-sm text-zinc-300">{selectedStudy.lesson.common_mistakes}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-blue-900/60 bg-blue-950/30 p-3">
                  <h4 className="text-sm font-semibold text-blue-100">Key invariants</h4>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-blue-100/90">
                    {selectedStudy.lesson.key_invariants.map((invariant, idx) => (
                      <li key={`${selectedStudy.id}-invariant-${idx}`}>{invariant}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 rounded-md border border-emerald-900/60 bg-emerald-950/20 p-3">
                  <h4 className="text-sm font-semibold text-emerald-100">Complexity card</h4>
                  <p className="mt-1 text-sm text-emerald-100/90">{selectedStudy.lesson.complexity_card}</p>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
                    <h4 className="text-sm font-semibold text-zinc-100">When to use</h4>
                    <p className="mt-1 text-sm text-zinc-300">{selectedStudy.lesson.when_to_use}</p>
                  </div>
                  <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
                    <h4 className="text-sm font-semibold text-zinc-100">When to avoid</h4>
                    <p className="mt-1 text-sm text-zinc-300">{selectedStudy.lesson.when_to_avoid}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-md border border-amber-900/60 bg-amber-950/20 p-3">
                  <h4 className="text-sm font-semibold text-amber-100">Scenario</h4>
                  <p className="mt-1 text-sm text-amber-100/90">{selectedStudy.lesson.scenario_example}</p>
                </div>
              </Card>
              <StepViewer title={selectedStudy.name} query={selectedStudy.query} steps={selectedStudy.steps} />
            </div>
          ) : null}
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

              {selectedAlgorithmDescriptor?.fields.length ? (
                <div className="space-y-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
                  <h4 className="text-sm font-semibold text-zinc-200">Algorithm Inputs</h4>
                  {selectedAlgorithmDescriptor.fields.map((field) => (
                    <Label key={field.key}>
                      {field.label}
                      <Input
                        value={generateFieldInputs[field.key] ?? ''}
                        placeholder={field.placeholder ?? field.example ?? ''}
                        onChange={(event) =>
                          setGenerateFieldInputs((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          }))
                        }
                      />
                      <span className="mt-1 block text-xs text-zinc-400">Example: {field.example ?? 'See algorithm docs.'}</span>
                      {generateFieldErrors[field.key] ? <span className="mt-1 block text-xs text-red-400">{generateFieldErrors[field.key]}</span> : null}
                    </Label>
                  ))}
                  {selectedAlgorithmDescriptor.sample_presets.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedAlgorithmDescriptor.sample_presets.map((preset) => (
                        <Button key={`${selectedAlgorithmDescriptor.algorithm}-${preset.name}`} type="button" variant="outline" onClick={() => applyPreset(preset.payload, preset.question)}>
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <Button onClick={handleGenerateVisualization} disabled={hasGenerateValidationErrors}>
                Generate Visualization
              </Button>
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
