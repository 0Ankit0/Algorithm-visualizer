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
  runMode?: PlaybackMode;
};

export type PlaybackMode = 'once' | 'loop' | 'step';

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

type NodePosition = {
  x: number;
  y: number;
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

function parseGraphEdge(edge: unknown): { from: string; to: string } | null {
  if (Array.isArray(edge) && edge.length >= 2) {
    return { from: formatValue(edge[0]), to: formatValue(edge[1]) };
  }

  if (edge && typeof edge === 'object') {
    const maybe = edge as Record<string, unknown>;
    const from = maybe.from ?? maybe.source ?? maybe.u;
    const to = maybe.to ?? maybe.target ?? maybe.v;
    if (from !== undefined && to !== undefined) {
      return { from: formatValue(from), to: formatValue(to) };
    }
  }

  if (typeof edge === 'string' && edge.includes('-')) {
    const [from, to] = edge.split('-', 2).map((part) => part.trim());
    if (from && to) {
      return { from, to };
    }
  }

  return null;
}

function getCircularNodePositions(labels: string[]): Record<string, NodePosition> {
  const radius = 110;
  const center = 140;
  const count = Math.max(labels.length, 1);
  const map: Record<string, NodePosition> = {};

  labels.forEach((label, idx) => {
    const angle = ((Math.PI * 2) / count) * idx - Math.PI / 2;
    map[label] = {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });

  return map;
}

function NumericArrayBars({ values, highlighted, stepIndex }: { values: number[]; highlighted: number[]; stepIndex: number }) {
  const maxAbs = Math.max(...values.map((value) => Math.abs(value)), 1);

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm text-zinc-400">Visual bars</p>
      <div className="grid auto-rows-fr grid-flow-col gap-2 overflow-x-auto rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
        {values.map((value, idx) => {
          const height = Math.max(12, Math.round((Math.abs(value) / maxAbs) * 120));
          const isHighlighted = highlighted.includes(idx);
          return (
            <div key={`bar-${stepIndex}-${idx}`} className="flex min-w-11 flex-col items-center justify-end gap-1">
              <div
                className={cn(
                  'w-full rounded-t-sm transition-all',
                  isHighlighted ? 'bg-blue-500 shadow-[0_0_0_1px_rgba(96,165,250,0.6)]' : 'bg-zinc-600',
                )}
                style={{ height }}
                title={`Index ${idx}: ${value}`}
              />
              <span className="text-xs text-zinc-300">{value}</span>
              <span className="text-[11px] text-zinc-500">[{idx}]</span>
            </div>
          );
        })}
      </div>
    </div>
  );
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
  const rawValues = getStepValues(step.state);
  const allNumbers = rawValues.every((value) => typeof value === 'number');

  return (
    <div>
      <div className="mt-3 flex flex-wrap gap-2">
        {rawValues.map((value, idx) => (
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
      {allNumbers ? <NumericArrayBars values={rawValues as number[]} highlighted={highlighted} stepIndex={step.index} /> : null}
      <TeachingElements {...props} />
    </div>
  );
}

function GraphStepRenderer(props: RendererProps) {
  const { step } = props;
  const state = Array.isArray(step.state) ? null : (step.state as GraphStatePayload);
  const nodeLabels = (state?.nodes ?? []).map((node) => formatValue(node));
  const activeNodes = new Set((state?.active_nodes ?? []).map((node) => formatValue(node)));
  const positions = getCircularNodePositions(nodeLabels);
  const edges = (state?.edges ?? []).map((edge) => parseGraphEdge(edge)).filter((edge): edge is { from: string; to: string } => edge !== null);

  return (
    <div>
      <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
        <p className="mb-2 text-sm text-zinc-400">Graph view</p>
        <svg viewBox="0 0 280 280" className="h-72 w-full">
          {edges.map((edge, idx) => {
            const from = positions[edge.from];
            const to = positions[edge.to];
            if (!from || !to) return null;
            return <line key={`edge-${step.index}-${idx}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#3f3f46" strokeWidth="2" />;
          })}

          {nodeLabels.map((label, idx) => {
            const pos = positions[label];
            const isActive = activeNodes.has(label);
            return (
              <g key={`node-${step.index}-${idx}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="18"
                  className={cn(isActive ? 'fill-blue-500' : 'fill-zinc-700')}
                  stroke={isActive ? '#93c5fd' : '#71717a'}
                  strokeWidth="2"
                />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#f4f4f5" fontSize="12" fontWeight="600">
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

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

export function StepViewer({ title, query, steps, runMode = 'once' }: StepViewerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(runMode !== 'step');
  const [intervalMs, setIntervalMs] = useState(1200);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(runMode !== 'step');
  }, [steps, runMode]);

  useEffect(() => {
    if (runMode === 'step') {
      setIsPlaying(false);
      return;
    }

    if (currentStep < steps.length - 1) {
      setIsPlaying(true);
    }
  }, [runMode, currentStep, steps.length]);

  useEffect(() => {
    if (!isPlaying || steps.length <= 1) {
      return;
    }

    if (runMode === 'step') {
      return;
    }

    if (currentStep >= steps.length - 1) {
      if (runMode === 'loop') {
        setCurrentStep(0);
        return;
      }
      setIsPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, intervalMs);

    return () => window.clearTimeout(timer);
  }, [isPlaying, currentStep, intervalMs, steps.length, runMode]);

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

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm text-zinc-300">
          Step Interval
          <select
            value={String(intervalMs)}
            onChange={(event) => setIntervalMs(Number(event.target.value))}
            className="w-44 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
          >
            <option value="400">0.4s (Very Fast)</option>
            <option value="800">0.8s (Fast)</option>
            <option value="1200">1.2s (Normal)</option>
            <option value="1800">1.8s (Slow)</option>
            <option value="2600">2.6s (Very Slow)</option>
          </select>
        </label>

        <Button
          variant={isPlaying ? 'outline' : 'default'}
          onClick={() => setIsPlaying((prev) => !prev)}
          disabled={runMode === 'step'}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        {runMode === 'step' ? (
          <Button variant="default" onClick={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}>
            Next Step
          </Button>
        ) : null}
        <Button
          variant="secondary"
          onClick={() => {
            setCurrentStep(0);
            setIsPlaying(runMode !== 'step');
          }}
        >
          Restart
        </Button>
      </div>
      <small className="mt-2 block text-zinc-400">
        {currentStep + 1} / {steps.length}
      </small>
    </Card>
  );
}
