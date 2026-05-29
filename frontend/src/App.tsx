import { Link, Navigate, Route, Routes } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlgorithmVisualizerPage } from '@/src/pages/AlgorithmVisualizerPage';
import { AlgorithmsHomePage } from '@/src/pages/AlgorithmsHomePage';

function NotFoundPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 pb-16 pt-8">
      <Card>
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="mt-2 text-zinc-400">The page you requested does not exist.</p>
        <Link to="/">
          <Button className="mt-4">Go to Algorithms</Button>
        </Link>
      </Card>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AlgorithmsHomePage />} />
      <Route path="/algorithms/:algorithmId" element={<AlgorithmVisualizerPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
