import { Input } from '@/components/ui/input';

type CatalogSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CatalogSearch({ value, onChange }: CatalogSearchProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search for algorithms..."
      />
    </div>
  );
}
