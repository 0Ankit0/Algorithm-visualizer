'use client';

type TabItem = {
  key: string;
  label: string;
};

type ModeTabsProps = {
  activeMode: string;
  setActiveMode: (mode: string) => void;
  tabs: TabItem[];
};

export function ModeTabs({ activeMode, setActiveMode, tabs }: ModeTabsProps) {
  return (
    <div className="card" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
      {tabs.map((tab) => (
        <button key={tab.key} className={activeMode === tab.key ? 'primary' : ''} onClick={() => setActiveMode(tab.key)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
