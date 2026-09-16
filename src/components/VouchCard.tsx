import { motion } from 'framer-motion';
import { CheckCircle, Pin } from 'lucide-react';
import type { ReactionEmoji, VouchItem } from '../types/vouch';
import { VideoPlayer } from './VideoPlayer';
import { EmojiReactions } from './EmojiReactions';
import { formatRelativeDate } from '../utils/format';
import { hubConfig } from '../config/hubConfig';
import { resolveMediaUrl } from '../lib/api';
import { useVouchStore } from '../store/vouchStore';

interface VouchCardProps {
  vouch: VouchItem;
  onExpandMedia: (vouch: VouchItem) => void;
}

export const VouchCard = ({ vouch, onExpandMedia }: VouchCardProps) => {
  const reactToVouch = useVouchStore((s) => s.reactToVouch);
  const handleToggleReaction = (emoji: ReactionEmoji) => {
    void reactToVouch(vouch.id, emoji);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      {vouch.pinned && (
        <div className="flex items-center gap-1.5 border-b border-border bg-cyan/10 px-4 py-1.5 text-xs font-medium text-cyan">
          <Pin className="h-3 w-3 fill-cyan" />
          Fijado
        </div>
      )}

      <div className="flex items-center gap-2.5 px-4 py-3">
        <img
          src={hubConfig.avatarUrl}
          alt={hubConfig.channelName}
          className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-sm font-semibold text-slate-200">
              Admin // Beli
            </span>
            <CheckCircle className="h-4 w-4 shrink-0 fill-cyan text-bg-soft" />
          </div>
          <span className="text-xs text-slate-400">{formatRelativeDate(vouch.createdAt)}</span>
        </div>
      </div>

      <div className="px-3 pb-3">
        {vouch.media.type === 'image' ? (
          <img
            src={resolveMediaUrl(vouch.media.url)}
            alt="Referencia verificada"
            loading="lazy"
            onClick={() => onExpandMedia(vouch)}
            className="aspect-[4/5] w-full cursor-zoom-in rounded-xl object-cover"
          />
        ) : (
          <VideoPlayer
            src={resolveMediaUrl(vouch.media.url)}
            onExpand={() => onExpandMedia(vouch)}
          />
        )}
      </div>

      <EmojiReactions
        reactions={vouch.reactions}
        myReactions={vouch.myReactions}
        onToggle={handleToggleReaction}
      />
    </motion.article>
  );
};
