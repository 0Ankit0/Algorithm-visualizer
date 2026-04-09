'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getStepHighlightedIndices, getStepValues, type VisualizationStep } from '@/lib/types';

type StepViewerProps = {
  title: string;
  query: string;
  steps: VisualizationStep[];
};

export function StepViewer({ title, query, steps }: StepViewerProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setCurrentStep(0);
  }, [steps]);

  const step = useMemo(() => steps[currentStep], [steps, currentStep]);

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

      <div className="mt-3 flex flex-wrap gap-2">
        {getStepValues(step.state).map((value, idx) => (
          <div
            key={`${step.index}-${idx}`}
            className={cn(
              'min-w-11 rounded-md border border-transparent bg-zinc-800 px-3 py-2 text-center text-sm',
              getStepHighlightedIndices(step).includes(idx) && 'border-blue-400 bg-blue-900/70',
            )}
          >
            {value}
          </div>
        ))}
      </div>

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
