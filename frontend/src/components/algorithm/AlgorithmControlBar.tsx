import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PlaybackMode } from '@/components/StepViewer';

type AlgorithmControlBarProps = {
  runMode: PlaybackMode;
  onRunModeChange: (mode: PlaybackMode) => void;
  arraySize: number;
  onArraySizeChange: (nextSize: number) => void;
  canRandomize: boolean;
  onRandomize: () => void;
  onResetInputs: () => void;
};

export function AlgorithmControlBar({
  runMode,
  onRunModeChange,
  arraySize,
  onArraySizeChange,
  canRandomize,
  onRandomize,
  onResetInputs,
}: AlgorithmControlBarProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold">Control Bar</h3>
      <p className="mt-1 text-sm text-zinc-400">Tune input size, random data, reset fields, and choose run mode.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm text-zinc-200">
          Run Mode
          <select
            value={runMode}
            onChange={(event) => onRunModeChange(event.target.value as PlaybackMode)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
          >
            <option value="once">Once</option>
            <option value="loop">Loop</option>
            <option value="step">Step-by-step</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm text-zinc-200">
          Array Size: {arraySize}
          <input
            type="range"
            min={4}
            max={24}
            step={1}
            value={arraySize}
            onChange={(event) => onArraySizeChange(Number(event.target.value))}
            className="accent-blue-500"
            disabled={!canRandomize}
          />
        </label>

        <div className="flex flex-wrap items-end gap-2">
          <Button variant="secondary" onClick={onRandomize} disabled={!canRandomize}>
            Randomize
          </Button>
          <Button variant="outline" onClick={onResetInputs}>
            Reset Inputs
          </Button>
        </div>
      </div>
    </Card>
  );
}
