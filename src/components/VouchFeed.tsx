import { AnimatePresence } from 'framer-motion';
import type { VouchItem } from '../types/vouch';
import { VouchCard } from './VouchCard';

interface VouchFeedProps {
  vouches: VouchItem[];
  onExpandMedia: (vouch: VouchItem) => void;
}

export const VouchFeed = ({ vouches, onExpandMedia }: VouchFeedProps) => {
  const sorted = [...vouches]
    .filter((v) => v.published)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
        <p className="text-sm text-slate-400">Aún no hay referencias publicadas.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5 px-4 py-4">
      <AnimatePresence initial={false}>
        {sorted.map((vouch) => (
          <VouchCard key={vouch.id} vouch={vouch} onExpandMedia={onExpandMedia} />
        ))}
      </AnimatePresence>
    </div>
  );
};
