import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { VouchItem } from '../types/vouch';
import { resolveMediaUrl } from '../lib/api';

interface MediaLightboxProps {
  vouch: VouchItem | null;
  onClose: () => void;
}

export const MediaLightbox = ({ vouch, onClose }: MediaLightboxProps) => {
  return (
    <AnimatePresence>
      {vouch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
          >
            <X className="h-5 w-5" />
          </button>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="max-h-full max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {vouch.media.type === 'image' ? (
              <img
                src={resolveMediaUrl(vouch.media.url)}
                alt={vouch.caption}
                className="max-h-[90vh] max-w-full rounded-lg object-contain"
              />
            ) : (
              <video
                src={resolveMediaUrl(vouch.media.url)}
                controls
                autoPlay
                playsInline
                className="max-h-[90vh] max-w-full rounded-lg object-contain"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
