import { useMemo, useState } from 'react';

import { CatalogSearch } from '@/src/components/catalog/CatalogSearch';
import { CatalogSectionCard } from '@/src/components/catalog/CatalogSectionCard';
import { catalogSections } from '@/src/constants/catalog';

export function AlgorithmsHomePage() {
  const [search, setSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    searching: true,
    sorting: true,
  });

  const normalizedSearch = search.trim().toLowerCase();

  const visibleSections = useMemo(() => {
    if (!normalizedSearch) {
      return catalogSections;
    }

    return catalogSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.label.toLowerCase().includes(normalizedSearch)),
      }))
      .filter((section) => section.items.length > 0);
  }, [normalizedSearch]);

  function toggleSection(sectionId: string) {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-8">
      <h1 className="text-3xl font-bold">Algorithm Visualizer</h1>
      <p className="max-w-4xl text-zinc-400">
        Interactive visual representations of computer science algorithms. Search and open a dedicated visualizer page for each algorithm.
      </p>

      <CatalogSearch value={search} onChange={setSearch} />

      <section className="space-y-3">
        {visibleSections.map((section) => (
          <CatalogSectionCard
            key={section.id}
            section={section}
            expanded={normalizedSearch ? true : !!expandedSections[section.id]}
            onToggle={() => toggleSection(section.id)}
          />
        ))}

        {!visibleSections.length ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
            No algorithms matched your search.
          </div>
        ) : null}
      </section>
    </main>
  );
}
