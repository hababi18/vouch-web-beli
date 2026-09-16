import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { useVouchStore } from '../store/vouchStore';
import { hubConfig } from '../config/hubConfig';
import { buildTelegramLink } from '../utils/format';
import { resolveMediaUrl } from '../lib/api';

interface StoryModalProps {
  open: boolean;
  onClose: () => void;
}

const SLIDE_DURATION_MS = 5000;
const MAX_SLIDES = 3;

export const StoryModal = ({ open, onClose }: StoryModalProps) => {
  const vouches = useVouchStore((s) => s.vouches);
  const [activeIndex, setActiveIndex] = useState(0);

  const highlights = [...vouches]
    .filter((v) => v.published)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_SLIDES);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open || highlights.length === 0) return;

    const timer = window.setTimeout(() => {
      if (activeIndex < highlights.length - 1) {
        setActiveIndex((i) => i + 1);
      } else {
        onClose();
      }
    }, SLIDE_DURATION_MS);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex, highlights.length]);

  if (highlights.length === 0) return null;
  const current = highlights[activeIndex];

  const handleTap = (side: 'left' | 'right') => {
    if (side === 'left') {
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (activeIndex < highlights.length - 1) {
      setActiveIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const ctaMessage = `Hola! Vengo de la historia del canal y me interesa información sobre el pedido de ${current.customerName}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        >
          <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-black sm:h-[92vh] sm:rounded-2xl">
            <div className="absolute inset-x-0 top-0 z-20 flex gap-1 p-2">
              {highlights.map((h, i) => (
                <div key={h.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: i < activeIndex ? '100%' : '0%' }}
                    animate={{ width: i < activeIndex ? '100%' : i === activeIndex ? '100%' : '0%' }}
                    transition={
                      i === activeIndex
                        ? { duration: SLIDE_DURATION_MS / 1000, ease: 'linear' }
                        : { duration: 0 }
                    }
                  />
                </div>
              ))}
            </div>

            <div className="absolute inset-x-0 top-6 z-20 flex items-center gap-2 px-3 pt-2">
              <img
                src={hubConfig.avatarUrl}
                alt={hubConfig.channelName}
                className="h-8 w-8 rounded-full border border-white/40 object-cover"
              />
              <span className="text-sm font-semibold text-white drop-shadow">
                {hubConfig.channelName}
              </span>
              <span className="text-xs text-white/70">{current.customerName}</span>
              <button
                onClick={onClose}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative flex-1"
              >
                {current.media.type === 'video' ? (
                  <video
                    src={resolveMediaUrl(current.media.url)}
                    autoPlay
                    muted
                    playsInline
                    loop
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={resolveMediaUrl(current.media.url)}
                    alt={current.caption}
                    className="h-full w-full object-cover"
                  />
                )}

                <div className="absolute inset-0 flex">
                  <button
                    aria-label="Historia anterior"
                    onClick={() => handleTap('left')}
                    className="h-full w-1/2"
                  />
                  <button
                    aria-label="Historia siguiente"
                    onClick={() => handleTap('right')}
                    className="h-full w-1/2"
                  />
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-16">
                  <p className="text-sm font-medium text-white drop-shadow">
                    {current.customerName}
                  </p>
                  <p className="mt-1 line-clamp-3 text-sm text-white/85 drop-shadow">
                    {current.caption}
                  </p>
                  <a
                    href={buildTelegramLink(hubConfig.telegramUsername, ctaMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="pointer-events-auto mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan/30"
                  >
                    <Send className="h-4 w-4" />
                    Hablar en Telegram
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
