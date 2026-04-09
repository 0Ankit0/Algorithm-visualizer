'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getStepHighlightedIndices,
  getStepValues,
  type ArrayStatePayload,
  type GraphStatePayload,
  type MatrixStatePayload,
  type TreeStatePayload,
  type VariablesPanel,
  type VisualizationStep,
} from '@/lib/types';
import { cn } from '@/lib/utils';

type StepViewerProps = {
  title: string;
  query: string;
  steps: VisualizationStep[];
};

type RendererProps = {
  step: VisualizationStep;
  previousStep?: VisualizationStep;
  stepIndex: number;
  totalSteps: number;
};

type VariableEntry = {
  key: string;
  value: string;
};

type PseudocodeData = {
  lines: string[];
  currentLine: number | null;
};

function formatValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => formatValue(entry)).join(', ');
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return '—';
}

function collectVariableEntries(variables?: VariablesPanel): VariableEntry[] {
  if (!variables) {
    return [];
  }

  const entries: VariableEntry[] = [];
  const baseKeys: Array<keyof VariablesPanel> = ['position', 'left', 'right', 'mid', 'heap_size'];

  baseKeys.forEach((key) => {
    const value = variables[key];
    if (value !== undefined && value !== null) {
      entries.push({ key, value: formatValue(value) });
    }
  });

  if (variables.distance_map) {
    Object.entries(variables.distance_map).forEach(([node, distance]) => {
      entries.push({ key: `distance[${node}]`, value: formatValue(distance) });
    });
  }

  if (variables.values) {
    Object.entries(variables.values).forEach(([key, value]) => {
      if (['pseudocode', 'current_line', 'pseudocode_line', 'line', 'complexity'].includes(key)) {
        return;
      }
      entries.push({ key, value: formatValue(value) });
    });
  }

  return entries;
}

function getVariables(step: VisualizationStep): VariablesPanel | undefined {
  if (!Array.isArray(step.state) && 'variables' in step.state) {
    return step.state.variables;
  }
  return undefined;
}

function getComplexityLabel(step: VisualizationStep): string {
  const variables = getVariables(step);
  const raw = variables?.values?.complexity;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw;
  }
  const time = variables?.values?.time_complexity;
  const space = variables?.values?.space_complexity;
  if (typeof time === 'string' || typeof space === 'string') {
    const timeLabel = typeof time === 'string' ? time : '—';
    const spaceLabel = typeof space === 'string' ? space : '—';
    return `Time ${timeLabel} • Space ${spaceLabel}`;
  }
  return 'Complexity unknown';
}

function getPseudocodeData(step: VisualizationStep): PseudocodeData | null {
  const variables = getVariables(step);
  const source = variables?.values?.pseudocode;
  let lines: string[] = [];
  if (Array.isArray(source)) {
    lines = source.filter((line): line is string => typeof line === 'string');
  } else if (typeof source === 'string') {
    lines = source
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);
  }

  if (!lines.length) {
    return null;
  }

  const rawLine = variables?.values?.current_line ?? variables?.values?.pseudocode_line ?? variables?.values?.line;
  const currentLine = typeof rawLine === 'number' ? rawLine : null;

  return {
    lines,
    currentLine,
  };
}

function summarizeStepDiff(previousStep: VisualizationStep | undefined, step: VisualizationStep): string[] {
  if (!previousStep) {
    return ['Initial step state established.'];
  }

  const currentState = step.state;
  const previousState = previousStep.state;

  if (Array.isArray(currentState) || Array.isArray(previousState)) {
    const prevValues = getStepValues(previousStep.state);
    const nextValues = getStepValues(step.state);
    const changedIndices = nextValues
      .map((value, idx) => (prevValues[idx] !== value ? idx : -1))
      .filter((idx) => idx >= 0);
    if (changedIndices.length === 0) {
      return ['Array values unchanged; focus moved to a different pointer or explanation context.'];
    }
    return [`Array updates at indices: ${changedIndices.join(', ')}.`];
  }

  if (currentState.kind === 'array_state' && previousState.kind === 'array_state') {
    const changedIndices = currentState.values
      .map((value, idx) => (previousState.values[idx] !== value ? idx : -1))
      .filter((idx) => idx >= 0);
    if (changedIndices.length === 0) {
      return ['Array values unchanged; highlighted indices or variables changed.'];
    }
    return [`Array updates at indices: ${changedIndices.join(', ')}.`];
  }

  if (currentState.kind === 'graph_state' && previousState.kind === 'graph_state') {
    const addedNodes = currentState.active_nodes.filter((node) => !previousState.active_nodes.includes(node));
    const removedNodes = previousState.active_nodes.filter((node) => !currentState.active_nodes.includes(node));
    const messages: string[] = [];
    if (addedNodes.length) {
      messages.push(`Active nodes added: ${addedNodes.join(', ')}.`);
    }
    if (removedNodes.length) {
      messages.push(`Active nodes removed: ${removedNodes.join(', ')}.`);
    }
    if (!messages.length) {
      messages.push('Graph topology unchanged; traversal focus remained steady.');
    }
    return messages;
  }

  if (currentState.kind === 'matrix_state' && previousState.kind === 'matrix_state') {
    const changedCells: string[] = [];
    currentState.cells.forEach((row, rowIdx) => {
      row.forEach((value, colIdx) => {
        if (previousState.cells[rowIdx]?.[colIdx] !== value) {
          changedCells.push(`(${rowIdx},${colIdx})`);
        }
      });
    });
    if (!changedCells.length) {
      return ['Matrix values unchanged; highlighted cells or variables changed.'];
    }
    return [`Matrix updates at cells: ${changedCells.join(', ')}.`];
  }

  if (currentState.kind === 'tree_state' && previousState.kind === 'tree_state') {
    const enteredNodes = currentState.active_path.filter((node) => !previousState.active_path.includes(node));
    if (enteredNodes.length) {
      return [`Traversal path extended with: ${enteredNodes.join(' → ')}.`];
    }
    return ['Tree structure unchanged; active path shifted or remained the same depth.'];
  }

  return ['State changed, but a detailed diff is unavailable for this step type transition.'];
}

function TeachingElements({ step, previousStep, stepIndex, totalSteps }: RendererProps) {
  const variables = getVariables(step);
  const variableEntries = collectVariableEntries(variables);
  const pseudocode = getPseudocodeData(step);
  const diffSummary = summarizeStepDiff(previousStep, step);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Progress {(Math.round(((stepIndex + 1) / totalSteps) * 100))}%</Badge>
        <Badge variant="secondary">{getComplexityLabel(step)}</Badge>
      </div>

      <section>
        <h4 className="text-sm font-semibold text-zinc-100">What changed this step?</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          {diffSummary.map((line, idx) => (
            <li key={`${step.index}-diff-${idx}`}>{line}</li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-zinc-100">Variables</h4>
        {variableEntries.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {variableEntries.map((entry) => (
              <Badge key={`${step.index}-${entry.key}`} variant="outline" className="text-zinc-200">
                {entry.key}: {entry.value}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-zinc-400">No variables provided for this step.</p>
        )}
      </section>

      {pseudocode ? (
        <section>
          <h4 className="text-sm font-semibold text-zinc-100">Pseudocode</h4>
          <ol className="mt-2 space-y-1 rounded-md bg-zinc-900 p-3 text-sm text-zinc-300">
            {pseudocode.lines.map((line, idx) => {
              const lineNumber = idx + 1;
              const isActive = pseudocode.currentLine === lineNumber;
              return (
                <li
                  key={`${step.index}-code-${lineNumber}`}
                  className={cn(
                    'rounded px-2 py-1',
                    isActive && 'bg-blue-900/60 text-blue-100 ring-1 ring-blue-500/70',
                  )}
                >
                  <span className="mr-2 text-zinc-500">{lineNumber}.</span>
                  {line}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

function ArrayStepRenderer(props: RendererProps) {
  const { step } = props;
  const highlighted = getStepHighlightedIndices(step);
  return (
    <div>
      <div className="mt-3 flex flex-wrap gap-2">
        {getStepValues(step.state).map((value, idx) => (
          <div
            key={`${step.index}-${idx}`}
            className={cn(
              'min-w-11 rounded-md border border-transparent bg-zinc-800 px-3 py-2 text-center text-sm',
              highlighted.includes(idx) && 'border-blue-400 bg-blue-900/70',
            )}
          >
            {value}
          </div>
        ))}
      </div>
      <TeachingElements {...props} />
    </div>
  );
}

function GraphStepRenderer(props: RendererProps) {
  const { step } = props;
  const state = Array.isArray(step.state) ? null : (step.state as GraphStatePayload);

  return (
    <div>
      <div className="mt-3 space-y-3 text-sm">
        <div>
          <p className="mb-1 text-zinc-400">Nodes</p>
          <div className="flex flex-wrap gap-2">
            {(state?.nodes ?? []).map((node, idx) => {
              const nodeLabel = formatValue(node);
              const isActive = (state?.active_nodes ?? []).some((activeNode) => formatValue(activeNode) === nodeLabel);
              return (
                <Badge key={`${step.index}-node-${idx}`} className={cn(isActive && 'bg-blue-700')}>
                  {nodeLabel}
                </Badge>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-1 text-zinc-400">Edges</p>
          <div className="flex flex-wrap gap-2 text-zinc-300">
            {(state?.edges ?? []).map((edge, idx) => (
              <Badge key={`${step.index}-edge-${idx}`} variant="outline">
                {formatValue(edge)}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <TeachingElements {...props} />
    </div>
  );
}

function MatrixStepRenderer(props: RendererProps) {
  const { step } = props;
  const state = Array.isArray(step.state) ? null : (step.state as MatrixStatePayload);
  const highlightedCells = new Set((state?.highlighted_cells ?? []).map((cell) => `${cell.row}-${cell.col}`));

  return (
    <div>
      <div className="mt-3 inline-flex flex-col gap-1 rounded-md bg-zinc-900 p-2">
        {(state?.cells ?? []).map((row, rowIdx) => (
          <div key={`${step.index}-row-${rowIdx}`} className="flex gap-1">
            {row.map((cell, colIdx) => {
              const isHighlighted = highlightedCells.has(`${rowIdx}-${colIdx}`);
              return (
                <div
                  key={`${step.index}-${rowIdx}-${colIdx}`}
                  className={cn(
                    'min-w-10 rounded px-2 py-1 text-center text-sm',
                    isHighlighted ? 'bg-blue-900/70 text-blue-100 ring-1 ring-blue-500' : 'bg-zinc-800 text-zinc-200',
                  )}
                >
                  {cell}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <TeachingElements {...props} />
    </div>
  );
}

function TreeStepRenderer(props: RendererProps) {
  const { step } = props;
  const state = Array.isArray(step.state) ? null : (step.state as TreeStatePayload);
  const activePath = new Set((state?.active_path ?? []).map((node) => formatValue(node)));

  return (
    <div>
      <div className="mt-3 space-y-3 text-sm">
        <div>
          <p className="mb-1 text-zinc-400">Nodes</p>
          <div className="flex flex-wrap gap-2">
            {(state?.nodes ?? []).map((node, idx) => {
              const label = formatValue(node);
              return (
                <Badge key={`${step.index}-tree-node-${idx}`} className={cn(activePath.has(label) && 'bg-blue-700')}>
                  {label}
                </Badge>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-1 text-zinc-400">Links</p>
          <div className="flex flex-wrap gap-2 text-zinc-300">
            {(state?.links ?? []).map((link, idx) => (
              <Badge key={`${step.index}-tree-link-${idx}`} variant="outline">
                {formatValue(link)}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <TeachingElements {...props} />
    </div>
  );
}

function renderStepByState(props: RendererProps) {
  const { step } = props;
  if (Array.isArray(step.state)) {
    return <ArrayStepRenderer {...props} />;
  }

  const rendererMap = {
    array_state: ArrayStepRenderer,
    graph_state: GraphStepRenderer,
    matrix_state: MatrixStepRenderer,
    tree_state: TreeStepRenderer,
  } as const;

  const Renderer = rendererMap[step.state.kind] ?? ArrayStepRenderer;
  return <Renderer {...props} />;
}

export function StepViewer({ title, query, steps }: StepViewerProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setCurrentStep(0);
  }, [steps]);

  const step = useMemo(() => steps[currentStep], [steps, currentStep]);
  const previousStep = currentStep > 0 ? steps[currentStep - 1] : undefined;

  if (!steps.length) {
    return (
      <Card>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-zinc-400">No steps available.</p>
      </Card>
    );
  }

  return (
    <Card>
      <Badge>{title}</Badge>
      <p className="mt-2 text-sm text-zinc-400">{query}</p>
      <h3 className="mt-3 text-lg font-semibold">
        Step {step.index}: {step.title}
      </h3>
      <p className="mt-2 text-sm text-zinc-200">{step.explanation}</p>

      {renderStepByState({
        step,
        previousStep,
        stepIndex: currentStep,
        totalSteps: steps.length,
      })}

      <div className="mt-4 flex gap-2">
        <Button variant="outline" onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}>
          Previous
        </Button>
        <Button variant="default" onClick={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}>
          Next
        </Button>
      </div>
      <small className="mt-2 block text-zinc-400">
        {currentStep + 1} / {steps.length}
      </small>
    </Card>
  );
}
