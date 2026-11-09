'use client';

import dynamic from 'next/dynamic';
import { HeadsUpDisplay } from '@/components/hud/HeadsUpDisplay';

const RacingCanvas = dynamic(
  () => import('@/components/canvas/RacingCanvas').then((mod) => mod.RacingCanvas),
  { ssr: false }
);

export default function GamePage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <RacingCanvas />
      <HeadsUpDisplay />
    </main>
  );
}
