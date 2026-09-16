import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { REACTION_EMOJIS, type ReactionCounts, type ReactionEmoji } from '../types/vouch';

interface EmojiReactionsProps {
  reactions: ReactionCounts;
  myReactions: ReactionEmoji[];
  onToggle: (emoji: ReactionEmoji) => void;
}

export const EmojiReactions = ({ reactions, myReactions, onToggle }: EmojiReactionsProps) => {
  const [trayOpen, setTrayOpen] = useState(false);
  const [poppedEmoji, setPoppedEmoji] = useState<ReactionEmoji | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trayOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTrayOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [trayOpen]);

  const handleToggle = (emoji: ReactionEmoji) => {
    if (!myReactions.includes(emoji)) {
      setPoppedEmoji(emoji);
      window.setTimeout(() => setPoppedEmoji((current) => (current === emoji ? null : current)), 350);
    }
    onToggle(emoji);
  };

  const getCount = (emoji: ReactionEmoji): number => reactions[emoji] ?? 0;

  const visibleEmojis = REACTION_EMOJIS.filter((emoji) => getCount(emoji) > 0).sort(
    (a, b) => getCount(b) - getCount(a),
  );

  return (
    <div ref={containerRef} className="relative px-4 pb-3 pt-1">
      <div className="flex flex-wrap items-center gap-1.5">
        {visibleEmojis.map((emoji) => {
          const isActive = myReactions.includes(emoji);
          return (
            <motion.button
              key={emoji}
              type="button"
              onClick={() => handleToggle(emoji)}
              whileTap={{ scale: 0.9 }}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-cyan bg-cyan/15 text-cyan'
                  : 'border-border bg-bg text-slate-400 hover:text-slate-200'
              }`}
            >
              <motion.span
                animate={poppedEmoji === emoji ? { scale: [1, 1.6, 1] } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 12 }}
                className="text-sm leading-none"
              >
                {emoji}
              </motion.span>
              <span>{getCount(emoji)}</span>
            </motion.button>
          );
        })}

        <button
          type="button"
          onClick={() => setTrayOpen((v) => !v)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-bg px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200"
        >
          <Plus className="h-3 w-3" />
          Añadir reacción
        </button>
      </div>

      <AnimatePresence>
        {trayOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="absolute bottom-full left-4 z-30 mb-2 flex flex-wrap gap-1 rounded-2xl border border-border bg-surface p-2 shadow-xl"
            style={{ maxWidth: 260 }}
          >
            {REACTION_EMOJIS.map((emoji) => {
              const isActive = myReactions.includes(emoji);
              return (
                <motion.button
                  key={emoji}
                  type="button"
                  whileHover={{ scale: 1.25 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleToggle(emoji)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${
                    isActive ? 'bg-cyan/15' : 'hover:bg-bg'
                  }`}
                >
                  {emoji}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
