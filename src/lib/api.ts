import type { VouchCategory, VouchInput, VouchItem } from '../types/vouch';

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

const TOKEN_KEY = 'admin_token';

export const getAuthToken = (): string | null => sessionStorage.getItem(TOKEN_KEY);

export const setAuthToken = (token: string | null): void => {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
};

/**
 * Files uploaded through the admin panel are stored on the API server under
 * /uploads and must be resolved against the API origin. Everything else
 * (absolute URLs, data/blob URIs, or a path like /media/x meant to live
 * alongside the frontend itself) is left untouched.
 */
export const resolveMediaUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
  return url;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, headers, ...rest } = options;
  const token = getAuthToken();
  const isFormData = rest.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error ?? `Error ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface RawVouch {
  id: string;
  media: { type: 'image' | 'video'; url: string; thumbnail: string | null };
  customerName: string;
  customerHandle: string | null;
  verifiedPurchase: boolean;
  caption: string;
  category: string;
  createdAt: string;
  published: boolean;
  pinned: boolean;
  reactions: Record<string, number>;
  myReactions: string[];
}

export const mapRawVouch = (raw: RawVouch): VouchItem => ({
  id: raw.id,
  media: {
    type: raw.media.type,
    url: raw.media.url,
    thumbnail: raw.media.thumbnail ?? undefined,
  },
  customerName: raw.customerName,
  customerHandle: raw.customerHandle ?? undefined,
  verifiedPurchase: raw.verifiedPurchase,
  caption: raw.caption,
  category: raw.category as VouchCategory,
  createdAt: raw.createdAt,
  published: raw.published,
  pinned: raw.pinned,
  reactions: raw.reactions,
  myReactions: raw.myReactions as VouchItem['myReactions'],
});

export const api = {
  login: (password: string) =>
    request<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
      skipAuth: true,
    }),

  getVouches: (visitorId: string) =>
    request<RawVouch[]>(`/api/vouches?visitorId=${encodeURIComponent(visitorId)}`, {
      skipAuth: true,
    }),

  createVouch: (data: VouchInput) =>
    request<RawVouch>('/api/vouches', { method: 'POST', body: JSON.stringify(data) }),

  updateVouch: (id: string, data: Partial<VouchInput>) =>
    request<RawVouch>(`/api/vouches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteVouch: (id: string) => request<void>(`/api/vouches/${id}`, { method: 'DELETE' }),

  restoreSeed: () => request<void>('/api/vouches/restore-seed', { method: 'POST' }),

  react: (vouchId: string, emoji: string, visitorId: string) =>
    request<RawVouch>(`/api/vouches/${vouchId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji, visitorId }),
      skipAuth: true,
    }),

  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ url: string; mediaType: 'image' | 'video' }>('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },
};
