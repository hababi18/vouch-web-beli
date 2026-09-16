import { create } from 'zustand';
import { api, mapRawVouch } from '../lib/api';
import { getVisitorId } from '../lib/visitor';
import type { ReactionEmoji, VouchInput, VouchItem } from '../types/vouch';

interface VouchStore {
  vouches: VouchItem[];
  loading: boolean;
  error: string | null;
  fetchVouches: () => Promise<void>;
  addVouch: (input: VouchInput) => Promise<void>;
  updateVouch: (id: string, input: Partial<VouchInput>) => Promise<void>;
  deleteVouch: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  togglePublished: (id: string) => Promise<void>;
  restoreSeedData: () => Promise<void>;
  reactToVouch: (id: string, emoji: ReactionEmoji) => Promise<void>;
}

export const useVouchStore = create<VouchStore>((set, get) => ({
  vouches: [],
  loading: false,
  error: null,

  fetchVouches: async () => {
    set({ loading: true, error: null });
    try {
      const raw = await api.getVouches(getVisitorId());
      set({ vouches: raw.map(mapRawVouch), loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'No se pudieron cargar las referencias.',
        loading: false,
      });
    }
  },

  addVouch: async (input) => {
    const raw = await api.createVouch(input);
    set((state) => ({ vouches: [mapRawVouch(raw), ...state.vouches] }));
  },

  updateVouch: async (id, input) => {
    const raw = await api.updateVouch(id, input);
    set((state) => ({
      vouches: state.vouches.map((v) => (v.id === id ? mapRawVouch(raw) : v)),
    }));
  },

  deleteVouch: async (id) => {
    await api.deleteVouch(id);
    set((state) => ({ vouches: state.vouches.filter((v) => v.id !== id) }));
  },

  togglePin: async (id) => {
    const vouch = get().vouches.find((v) => v.id === id);
    if (!vouch) return;
    await get().updateVouch(id, { pinned: !vouch.pinned });
  },

  togglePublished: async (id) => {
    const vouch = get().vouches.find((v) => v.id === id);
    if (!vouch) return;
    await get().updateVouch(id, { published: !vouch.published });
  },

  restoreSeedData: async () => {
    await api.restoreSeed();
    await get().fetchVouches();
  },

  reactToVouch: async (id, emoji) => {
    const visitorId = getVisitorId();

    // Optimistic update so the tap feels instant.
    set((state) => ({
      vouches: state.vouches.map((v) => {
        if (v.id !== id) return v;
        const isActive = v.myReactions.includes(emoji);
        const nextCount = (v.reactions[emoji] ?? 0) + (isActive ? -1 : 1);
        return {
          ...v,
          reactions: { ...v.reactions, [emoji]: Math.max(0, nextCount) },
          myReactions: isActive
            ? v.myReactions.filter((e) => e !== emoji)
            : [...v.myReactions, emoji],
        };
      }),
    }));

    try {
      const raw = await api.react(id, emoji, visitorId);
      set((state) => ({
        vouches: state.vouches.map((v) => (v.id === id ? mapRawVouch(raw) : v)),
      }));
    } catch {
      // Server rejected it (e.g. vouch was deleted) — resync with reality.
      await get().fetchVouches();
    }
  },
}));
