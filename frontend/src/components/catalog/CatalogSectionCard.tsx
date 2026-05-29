import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { CatalogSection } from '@/src/constants/catalog';

type CatalogSectionCardProps = {
  section: CatalogSection;
  expanded: boolean;
  onToggle: () => void;
};

export function CatalogSectionCard({ section, expanded, onToggle }: CatalogSectionCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{section.title}</h2>
          <p className="text-sm text-zinc-400">{section.subtitle}</p>
        </div>
        <Button variant="outline" onClick={onToggle}>
          {expanded ? 'Hide' : 'Show'}
        </Button>
      </div>

      {expanded ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {section.items.map((item) => (
            <Link key={item.algorithm} to={`/algorithms/${item.algorithm}`}>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 transition hover:border-blue-500/70 hover:bg-zinc-900">
                <h3 className="font-semibold text-zinc-100">{item.label}</h3>
                <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
