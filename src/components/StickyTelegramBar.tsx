import { Send } from 'lucide-react';
import { hubConfig } from '../config/hubConfig';
import { buildTelegramLink } from '../utils/format';

export const StickyTelegramBar = () => {
  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-bg-soft/95 px-4 py-3 backdrop-blur-sm">
      <a
        href={buildTelegramLink(hubConfig.telegramUsername)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition-transform active:scale-[0.98]"
      >
        <Send className="h-4 w-4" />
        Hablar con el Vendedor
      </a>
    </div>
  );
};
