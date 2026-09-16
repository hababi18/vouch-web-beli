import { useState } from 'react';
import { BadgeCheck, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { hubConfig, TOTAL_VOUCHES_LABEL } from '../config/hubConfig';
import { buildTelegramLink } from '../utils/format';
import { StoryModal } from './StoryModal';

export const ChannelHeader = () => {
  const [storyOpen, setStoryOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border-b border-border bg-bg-soft"
    >
      <div className="bg-cyan/10 border-b border-border px-4 py-2 text-center text-xs text-cyan">
        {hubConfig.bannerNotice}
      </div>

      <div className="px-4 py-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setStoryOpen(true)}
            aria-label="Ver historia del canal"
            className="relative shrink-0 rounded-full p-[3px]"
            style={{
              background:
                'conic-gradient(from 0deg, #a855f7, #f43f5e, #f59e0b, #22d3ee, #a855f7)',
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'conic-gradient(from 0deg, #a855f7, #f43f5e, #f59e0b, #22d3ee, #a855f7)',
              }}
              animate={{ rotate: 360, opacity: [0.6, 1, 0.6] }}
              transition={{
                rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
            <div className="relative rounded-full bg-bg-soft p-[2px]">
              <img
                src={hubConfig.avatarUrl}
                alt={hubConfig.channelName}
                className="h-16 w-16 rounded-full object-cover"
              />
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-lg font-semibold text-slate-200">
                {hubConfig.channelName}
              </h1>
              <BadgeCheck className="h-5 w-5 shrink-0 fill-cyan text-bg-soft" />
            </div>
            <p className="text-sm text-slate-400">{hubConfig.handle}</p>
            <button
              type="button"
              onClick={() => setStoryOpen(true)}
              className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-400"
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                ●
              </motion.span>
              Historia activa (24h)
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-400">{hubConfig.bio}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-emerald">
          <span className="font-medium">{TOTAL_VOUCHES_LABEL}</span>
          <span className="h-1 w-1 rounded-full bg-slate-400/40" />
          <span className="text-slate-400">Canal Oficial de Beli</span>
        </div>

        <a
          href={buildTelegramLink(hubConfig.telegramUsername)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition-transform active:scale-[0.98]"
        >
          <Send className="h-4 w-4" />
          Contactar por Telegram
        </a>
      </div>

      <StoryModal open={storyOpen} onClose={() => setStoryOpen(false)} />
    </motion.header>
  );
};
