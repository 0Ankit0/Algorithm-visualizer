'use client';

import { useEffect, useMemo, useState } from 'react';

import type { VisualizationStep } from '@/lib/types';

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
      <div className="card">
        <h3>{title}</h3>
        <p>No steps available.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <span className="badge">{title}</span>
      <p style={{ marginTop: 0, color: '#a1a1aa' }}>{query}</p>
      <h3 style={{ marginTop: '0.5rem' }}>
        Step {step.index}: {step.title}
      </h3>
      <p>{step.explanation}</p>

      <div className="array">
        {step.state.map((value, idx) => (
          <div key={`${step.index}-${idx}`} className={`array-item ${step.highlighted_indices.includes(idx) ? 'active' : ''}`}>
            {value}
          </div>
        ))}
      </div>

      <div className="controls">
        <button onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}>Previous</button>
        <button onClick={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}>Next</button>
      </div>
      <small style={{ color: '#a1a1aa' }}>
        {currentStep + 1} / {steps.length}
      </small>
    </div>
  );
}
