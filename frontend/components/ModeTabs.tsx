'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    <Card className="mb-4 flex flex-wrap gap-3">
      {tabs.map((tab) => (
        <Button key={tab.key} variant={activeMode === tab.key ? 'default' : 'outline'} onClick={() => setActiveMode(tab.key)}>
          {tab.label}
        </Button>
      ))}
    </Card>
  );
}
