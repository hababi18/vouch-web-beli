import { Send } from 'lucide-react';
import { hubConfig } from '../config/hubConfig';
import { buildTelegramLink } from '../utils/format';

const TICKER_TEXT = 'Unirse al Canal Oficial de Telegram';
const REPEAT_COUNT = 6;

export const PinnedTicker = () => {
  const items = Array.from({ length: REPEAT_COUNT });

  return (
    <div className="w-full overflow-hidden border-b border-border bg-bg-soft">
      <a
        href={buildTelegramLink(hubConfig.telegramUsername)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-max items-center py-2 animate-marquee hover:[animation-play-state:paused]"
      >
        {[...items, ...items].map((_, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-2 px-4 text-xs font-semibold tracking-wide text-cyan"
          >
            <Send className="h-3.5 w-3.5 shrink-0" />
            {TICKER_TEXT}
          </span>
        ))}
      </a>
    </div>
  );
};
