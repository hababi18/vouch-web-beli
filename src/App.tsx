import { useEffect, useRef, useState } from 'react';
import { ChannelHeader } from './components/ChannelHeader';
import { PinnedTicker } from './components/PinnedTicker';
import { VouchFeed } from './components/VouchFeed';
import { MediaLightbox } from './components/MediaLightbox';
import { AdminModal } from './components/AdminModal';
import { StickyTelegramBar } from './components/StickyTelegramBar';
import { useVouchStore } from './store/vouchStore';
import type { VouchItem } from './types/vouch';

function App() {
  const vouches = useVouchStore((s) => s.vouches);
  const loading = useVouchStore((s) => s.loading);
  const error = useVouchStore((s) => s.error);
  const fetchVouches = useVouchStore((s) => s.fetchVouches);
  const [lightboxItem, setLightboxItem] = useState<VouchItem | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const footerClickCount = useRef(0);
  const footerClickTimer = useRef<number | null>(null);

  useEffect(() => {
    void fetchVouches();
  }, [fetchVouches]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAdminOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFooterClick = () => {
    footerClickCount.current += 1;
    if (footerClickTimer.current) window.clearTimeout(footerClickTimer.current);

    if (footerClickCount.current >= 3) {
      setAdminOpen(true);
      footerClickCount.current = 0;
      return;
    }

    footerClickTimer.current = window.setTimeout(() => {
      footerClickCount.current = 0;
    }, 800);
  };

  return (
    <div className="min-h-screen bg-bg">
      <PinnedTicker />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col border-x border-border bg-bg-soft shadow-2xl">
        <ChannelHeader />

        <main className="flex-1">
          {loading && vouches.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
              <p className="text-sm text-slate-400">Cargando referencias...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <p className="text-sm text-slate-400">{error}</p>
              <button
                onClick={() => void fetchVouches()}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-200"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <VouchFeed vouches={vouches} onExpandMedia={setLightboxItem} />
          )}
        </main>

        <footer className="px-4 pb-4 pt-2 text-center">
          <p
            onClick={handleFooterClick}
            className="cursor-default select-none text-xs text-slate-400/60"
          >
            © {new Date().getFullYear()} {vouches.length > 0 ? 'Beli' : ''} · Todas las pruebas son de clientes reales
          </p>
        </footer>

        <StickyTelegramBar />
      </div>

      <MediaLightbox vouch={lightboxItem} onClose={() => setLightboxItem(null)} />
      <AdminModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </div>
  );
}

export default App;
