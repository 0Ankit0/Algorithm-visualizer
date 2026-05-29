import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StepViewer } from '@/components/StepViewer';
import type { StudyItem } from '@/lib/types';

type AlgorithmStudyPanelProps = {
  studyItems: StudyItem[];
  selectedStudyId: string;
  onSelectStudy: (id: string) => void;
  loading: boolean;
};

export function AlgorithmStudyPanel({ studyItems, selectedStudyId, onSelectStudy, loading }: AlgorithmStudyPanelProps) {
  const selectedStudy = studyItems.find((item) => item.id === selectedStudyId) ?? null;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-semibold">Study Examples</h2>
        <p className="mb-4 mt-1 text-sm text-zinc-400">Prebuilt walkthroughs for this algorithm.</p>
        {loading ? <p className="mb-3 text-sm text-zinc-300">Loading...</p> : null}

        <div className="grid gap-2">
          {studyItems.map((item) => (
            <Button key={item.id} variant={item.id === selectedStudyId ? 'default' : 'outline'} onClick={() => onSelectStudy(item.id)}>
              <span className="text-left">
                <strong className="block">{item.name}</strong>
                <span className="text-xs text-zinc-300">{item.description}</span>
              </span>
            </Button>
          ))}
        </div>
      </Card>

      {selectedStudy ? (
        <StepViewer title={selectedStudy.name} query={selectedStudy.query} steps={selectedStudy.steps} />
      ) : (
        <Card>
          <h3 className="text-lg font-semibold">No study example found</h3>
          <p className="mt-2 text-sm text-zinc-400">This algorithm currently has no study-mode example.</p>
        </Card>
      )}
    </section>
  );
}
