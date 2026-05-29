import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { AlgorithmDescriptor, AlgorithmType, StudyItem } from '@/lib/types';
import { fetchAlgorithms, fetchStudyMode } from '@/src/api/visualizerApi';
import { AlgorithmGeneratePanel } from '@/src/components/algorithm/AlgorithmGeneratePanel';
import { AlgorithmStudyPanel } from '@/src/components/algorithm/AlgorithmStudyPanel';
import { fallbackAlgorithmDescriptors, fallbackAlgorithmOptions } from '@/src/constants/algorithms';

type VisualizationMode = 'study' | 'custom';

function isAlgorithmType(value: string): value is AlgorithmType {
  return fallbackAlgorithmOptions.some((item) => item.value === value);
}

export function AlgorithmVisualizerPage() {
  const params = useParams<{ algorithmId: string }>();
  const [algorithmDescriptors, setAlgorithmDescriptors] = useState<AlgorithmDescriptor[]>(fallbackAlgorithmDescriptors);
  const [studyItems, setStudyItems] = useState<StudyItem[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState('');
  const [mode, setMode] = useState<VisualizationMode>('study');
  const [loading, setLoading] = useState(true);
  const [loadingStudy, setLoadingStudy] = useState(true);

  const algorithmId = params.algorithmId ?? '';
  const isKnownAlgorithm = isAlgorithmType(algorithmId);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        const descriptors = await fetchAlgorithms();
        if (!cancelled) {
          setAlgorithmDescriptors(descriptors);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoadingStudy(true);
        const items = await fetchStudyMode();
        if (!cancelled) {
          setStudyItems(items);
        }
      } finally {
        if (!cancelled) {
          setLoadingStudy(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const descriptor = useMemo(
    () => algorithmDescriptors.find((item) => item.algorithm === algorithmId) ?? null,
    [algorithmDescriptors, algorithmId],
  );

  const filteredStudyItems = useMemo(
    () => studyItems.filter((item) => item.algorithm === algorithmId),
    [studyItems, algorithmId],
  );

  useEffect(() => {
    if (filteredStudyItems.length > 0) {
      setSelectedStudyId(filteredStudyItems[0].id);
    } else {
      setSelectedStudyId('');
    }
  }, [algorithmId, filteredStudyItems]);

  if (!isKnownAlgorithm) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-4 pb-16 pt-8">
        <Card>
          <h1 className="text-2xl font-bold">Unknown Algorithm</h1>
          <p className="mt-2 text-zinc-400">The algorithm page you requested does not exist.</p>
          <Link to="/">
            <Button className="mt-4">Back to Algorithm List</Button>
          </Link>
        </Card>
      </main>
    );
  }

  if (loading || !descriptor) {
    return (
      <main className="mx-auto max-w-6xl space-y-4 px-4 pb-16 pt-8">
        <p className="text-zinc-300">Loading algorithm page...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 pb-16 pt-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/">
          <Button variant="outline">All Algorithms</Button>
        </Link>
        <h1 className="text-3xl font-bold">{descriptor.label}</h1>
      </div>

      <p className="max-w-4xl text-zinc-400">
        This dedicated page focuses on {descriptor.label}. Use Study for guided examples or Custom Input for your own values.
      </p>

      <Card className="flex flex-wrap gap-2">
        <Button variant={mode === 'study' ? 'default' : 'outline'} onClick={() => setMode('study')}>
          Study
        </Button>
        <Button variant={mode === 'custom' ? 'default' : 'outline'} onClick={() => setMode('custom')}>
          Custom Input
        </Button>
      </Card>

      {mode === 'study' ? (
        <AlgorithmStudyPanel
          studyItems={filteredStudyItems}
          selectedStudyId={selectedStudyId}
          onSelectStudy={setSelectedStudyId}
          loading={loadingStudy}
        />
      ) : (
        <AlgorithmGeneratePanel descriptor={descriptor} />
      )}
    </main>
  );
}
