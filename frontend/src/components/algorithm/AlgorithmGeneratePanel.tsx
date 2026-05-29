import { useEffect, useMemo, useState } from 'react';

import type { PlaybackMode } from '@/components/StepViewer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StepViewer } from '@/components/StepViewer';
import type { AlgorithmDescriptor, VisualizationResponse } from '@/lib/types';
import { generateVisualization } from '@/src/api/visualizerApi';
import { AlgorithmControlBar } from '@/src/components/algorithm/AlgorithmControlBar';
import { parseFieldInput, stringifyPresetValue, validateFieldInput } from '@/src/utils/algorithmInput';

type AlgorithmGeneratePanelProps = {
  descriptor: AlgorithmDescriptor;
};

export function AlgorithmGeneratePanel({ descriptor }: AlgorithmGeneratePanelProps) {
  const [question, setQuestion] = useState('How does this algorithm run on the given input?');
  const [fieldInputs, setFieldInputs] = useState<Record<string, string>>({});
  const [generatedVisualization, setGeneratedVisualization] = useState<VisualizationResponse | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [arraySize, setArraySize] = useState(8);
  const [runMode, setRunMode] = useState<PlaybackMode>('once');

  const primaryArrayField = useMemo(
    () => descriptor.fields.find((field) => field.type === 'number_list' && ['numbers', 'array', 'values'].includes(field.key)),
    [descriptor.fields],
  );
  const targetField = useMemo(
    () => descriptor.fields.find((field) => field.type === 'number' && field.key === 'target'),
    [descriptor.fields],
  );

  const fieldErrors = useMemo(
    () => Object.fromEntries(descriptor.fields.map((field) => [field.key, validateFieldInput(field, fieldInputs[field.key] ?? '')])),
    [descriptor.fields, fieldInputs],
  );

  const hasValidationErrors = useMemo(() => Object.values(fieldErrors).some(Boolean), [fieldErrors]);

  function applyFirstPreset() {
    const firstPreset = descriptor.sample_presets[0];
    if (firstPreset) {
      setQuestion(firstPreset.question);
      const nextInputs: Record<string, string> = {};
      descriptor.fields.forEach((field) => {
        nextInputs[field.key] = stringifyPresetValue(firstPreset.payload[field.key], field.type);
      });
      setFieldInputs(nextInputs);
      setGeneratedVisualization(null);
      setGenerateError(null);
      return;
    }

    setFieldInputs({});
    setGeneratedVisualization(null);
    setGenerateError(null);
  }

  function randomizeInputs() {
    if (!primaryArrayField) {
      return;
    }

    const requiresSortedInput =
      descriptor.algorithm === 'binary_search' ||
      /sorted/i.test(primaryArrayField.label) ||
      /sorted/i.test(primaryArrayField.placeholder ?? '');

    const randomNumbers = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 90) + 10);
    const normalizedNumbers = requiresSortedInput ? [...randomNumbers].sort((a, b) => a - b) : randomNumbers;

    setFieldInputs((prev) => {
      const next = {
        ...prev,
        [primaryArrayField.key]: normalizedNumbers.join(', '),
      };

      if (targetField) {
        const target = normalizedNumbers[Math.floor(Math.random() * normalizedNumbers.length)];
        next[targetField.key] = String(target);
      }

      if (descriptor.algorithm === 'knapsack_01') {
        const randomWeights = randomNumbers.map((n) => Math.max(1, Math.floor(n / 10)));
        const randomValues = randomNumbers.map((n) => n + Math.floor(Math.random() * 20));
        next.weights = randomWeights.join(', ');
        next.values = randomValues.join(', ');
        next.capacity = String(Math.max(5, Math.floor(randomWeights.reduce((sum, cur) => sum + cur, 0) * 0.45)));
      }

      return next;
    });

    setGeneratedVisualization(null);
    setGenerateError(null);
  }

  useEffect(() => {
    applyFirstPreset();
  }, [descriptor.algorithm]);

  async function handleGenerate() {
    setGenerateError(null);

    const payload: Record<string, unknown> = {};
    for (const field of descriptor.fields) {
      const rawValue = fieldInputs[field.key] ?? '';
      const error = validateFieldInput(field, rawValue);
      if (error) {
        setGenerateError(`${field.label}: ${error}`);
        return;
      }
      const parsed = parseFieldInput(field.type, rawValue);
      if (parsed !== undefined) {
        payload[field.key] = parsed;
      }
    }

    try {
      const response = await generateVisualization({
        algorithm: descriptor.algorithm,
        question,
        numbers: Array.isArray(payload.numbers) ? payload.numbers : [],
        target: typeof payload.target === 'number' ? payload.target : undefined,
        payload,
      });
      setGeneratedVisualization(response);
    } catch (error) {
      setGeneratedVisualization(null);
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate visualization.');
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-semibold">Run With Your Input</h2>
        <p className="mb-4 mt-1 text-sm text-zinc-400">Fill inputs and the visualization auto-plays step-by-step.</p>

        <AlgorithmControlBar
          runMode={runMode}
          onRunModeChange={setRunMode}
          arraySize={arraySize}
          onArraySizeChange={setArraySize}
          canRandomize={Boolean(primaryArrayField)}
          onRandomize={randomizeInputs}
          onResetInputs={applyFirstPreset}
        />

        <div className="grid gap-3">
          <Label>
            Question
            <Textarea value={question} rows={2} onChange={(event) => setQuestion(event.target.value)} />
          </Label>

          {descriptor.fields.length ? (
            <div className="space-y-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
              <h4 className="text-sm font-semibold text-zinc-200">Algorithm Inputs</h4>
              {descriptor.fields.map((field) => (
                <Label key={field.key}>
                  {field.label}
                  <Input
                    value={fieldInputs[field.key] ?? ''}
                    placeholder={field.placeholder ?? field.example ?? ''}
                    onChange={(event) =>
                      setFieldInputs((prev) => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                  <span className="mt-1 block text-xs text-zinc-400">Example: {field.example ?? 'See algorithm docs.'}</span>
                  {fieldErrors[field.key] ? <span className="mt-1 block text-xs text-red-400">{fieldErrors[field.key]}</span> : null}
                </Label>
              ))}

              {descriptor.sample_presets.length > 0 ? (
                <Button type="button" variant="outline" onClick={applyFirstPreset}>
                  Use Sample Input
                </Button>
              ) : null}
            </div>
          ) : null}

          <Button onClick={handleGenerate} disabled={hasValidationErrors}>
            Visualize This Algorithm
          </Button>
          {generateError ? <p className="mb-0 text-sm text-red-400">{generateError}</p> : null}
        </div>
      </Card>

      {generatedVisualization ? (
        <StepViewer title={descriptor.label} query={generatedVisualization.query} steps={generatedVisualization.steps} runMode={runMode} />
      ) : (
        <Card>
          <h3 className="text-lg font-semibold">No visualization yet</h3>
          <p className="mt-2 text-sm text-zinc-400">Run the algorithm once to start the animation timeline.</p>
        </Card>
      )}
    </section>
  );
}
