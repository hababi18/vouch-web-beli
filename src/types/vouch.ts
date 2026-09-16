export type VouchCategory =
  | 'Todos'
  | 'Envíos'
  | 'Comprobantes'
  | 'Unboxing'
  | 'Calidad';

export const REACTION_EMOJIS = [
  '❤️',
  '🤘',
  '🤑',
  '🫡',
  '👍',
  '📈',
  '🔥',
  '💪',
  '💸',
  '💰',
] as const;

/** A reaction emoji. Admins can add custom ones beyond REACTION_EMOJIS. */
export type ReactionEmoji = string;

export type ReactionCounts = Record<string, number>;

export interface VouchItem {
  id: string;
  media: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
  customerName: string;
  customerHandle?: string;
  verifiedPurchase: boolean;
  caption: string;
  category: VouchCategory;
  createdAt: string; // ISO date string
  published: boolean;
  pinned: boolean;
  /** Aggregated counts from every visitor plus any admin boosts, as reported by the API. */
  reactions: ReactionCounts;
  /** Emojis this browser's visitor has already reacted with. */
  myReactions: ReactionEmoji[];
  /** Admin-set fake/starting counts, before real visitor reactions are added in. */
  reactionBoosts: ReactionCounts;
}

/** Shape accepted by the API for creating/updating a vouch. */
export interface VouchInput {
  media: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
  customerName: string;
  customerHandle?: string;
  verifiedPurchase?: boolean;
  caption: string;
  category: Exclude<VouchCategory, 'Todos'>;
  published?: boolean;
  pinned?: boolean;
  /** ISO date string. Omit to use the current date/time. */
  createdAt?: string;
  /** Admin-set fake/starting reaction counts, keyed by emoji. */
  reactionBoosts?: ReactionCounts;
}

export interface HubConfig {
  channelName: string;
  handle: string;
  bio: string;
  telegramUsername: string; // e.g. "TuUsuarioDeTelegram"
  avatarUrl: string;
  bannerNotice: string;
}
