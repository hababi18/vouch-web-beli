import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Trash2,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RotateCcw,
  Check,
  UploadCloud,
  Link as LinkIcon,
  Smartphone,
  LogOut,
  Loader2,
  Lock,
  Calendar,
} from 'lucide-react';
import { useVouchStore } from '../store/vouchStore';
import { api, ApiError, getAuthToken, resolveMediaUrl, setAuthToken } from '../lib/api';
import type { VouchCategory, VouchItem } from '../types/vouch';

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: Exclude<VouchCategory, 'Todos'>[] = [
  'Envíos',
  'Comprobantes',
  'Unboxing',
  'Calidad',
];

type UploadMode = 'device' | 'path';

interface FormState {
  mediaType: 'image' | 'video';
  uploadMode: UploadMode;
  mediaUrl: string;
  fileName: string;
  customerName: string;
  customerHandle: string;
  caption: string;
  category: Exclude<VouchCategory, 'Todos'>;
  pinned: boolean;
  /** YYYY-MM-DD, matching an <input type="date">. Empty = use the current date. */
  publishDate: string;
}

const emptyForm: FormState = {
  mediaType: 'image',
  uploadMode: 'device',
  mediaUrl: '',
  fileName: '',
  customerName: '',
  customerHandle: '',
  caption: '',
  category: 'Envíos',
  pinned: false,
  publishDate: '',
};

const toDateInputValue = (isoString: string): string => isoString.slice(0, 10);

const LoginScreen = ({ onLoggedIn }: { onLoggedIn: (token: string) => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const { token } = await api.login(password);
      setAuthToken(token);
      onLoggedIn(token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan/10 text-cyan">
        <Lock className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-200">Acceso de administrador</h3>
        <p className="mt-1 text-xs text-slate-400">Ingresa la contraseña para gestionar el canal.</p>
      </div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        autoFocus
        className="w-full max-w-xs rounded-lg border border-border bg-bg px-3 py-2 text-center text-sm text-slate-200 placeholder:text-slate-400/60 focus:border-cyan focus:outline-none"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-cyan px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Entrar
      </button>
    </form>
  );
};

export const AdminModal = ({ open, onClose }: AdminModalProps) => {
  const { vouches, addVouch, updateVouch, deleteVouch, togglePin, togglePublished, restoreSeedData } =
    useVouchStore();

  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
  };

  const handleAuthError = (err: unknown): boolean => {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      setAuthToken(null);
      setToken(null);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setAuthToken(null);
    setToken(null);
  };

  const loadFile = async (file: File) => {
    setIsUploading(true);
    setFormError(null);
    try {
      const result = await api.uploadFile(file);
      setForm((f) => ({
        ...f,
        mediaType: result.mediaType,
        mediaUrl: result.url,
        fileName: file.name,
      }));
    } catch (err) {
      if (!handleAuthError(err)) {
        setFormError(err instanceof ApiError ? err.message : 'No se pudo subir el archivo.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void loadFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mediaUrl.trim() || !form.customerName.trim() || !form.caption.trim()) return;

    setIsSaving(true);
    setFormError(null);

    // Build the date from local YYYY-MM-DD parts at local noon (not
    // UTC midnight) so it can't roll over to the previous/next day once
    // converted to UTC for storage and back to local time for display.
    const createdAt = form.publishDate
      ? (() => {
          const [year, month, day] = form.publishDate.split('-').map(Number);
          return new Date(year, month - 1, day, 12).toISOString();
        })()
      : undefined;

    try {
      if (editingId) {
        await updateVouch(editingId, {
          media: { type: form.mediaType, url: form.mediaUrl.trim() },
          customerName: form.customerName.trim(),
          customerHandle: form.customerHandle.trim() || undefined,
          caption: form.caption.trim(),
          category: form.category,
          pinned: form.pinned,
          createdAt,
        });
      } else {
        await addVouch({
          media: { type: form.mediaType, url: form.mediaUrl.trim() },
          customerName: form.customerName.trim(),
          customerHandle: form.customerHandle.trim() || undefined,
          verifiedPurchase: true,
          caption: form.caption.trim(),
          category: form.category,
          published: true,
          pinned: form.pinned,
          createdAt,
        });
      }
      resetForm();
    } catch (err) {
      if (!handleAuthError(err)) {
        setFormError(err instanceof ApiError ? err.message : 'No se pudo guardar la referencia.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (v: VouchItem) => {
    setEditingId(v.id);
    setFormError(null);
    setForm({
      mediaType: v.media.type,
      uploadMode: 'path',
      mediaUrl: v.media.url,
      fileName: '',
      customerName: v.customerName,
      customerHandle: v.customerHandle ?? '',
      caption: v.caption,
      category: v.category === 'Todos' ? 'Envíos' : v.category,
      pinned: v.pinned,
      publishDate: toDateInputValue(v.createdAt),
    });
  };

  const runGuarded = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (err) {
      handleAuthError(err);
    }
  };

  const sortedVouches = [...vouches].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-bg-soft sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-slate-200">Panel de Administración</h2>
              <div className="flex items-center gap-2">
                {token && (
                  <button
                    onClick={handleLogout}
                    title="Cerrar sesión"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-slate-400 hover:text-slate-200"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!token ? (
              <LoginScreen onLoggedIn={setToken} />
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <form
                  onSubmit={handleSubmit}
                  className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-200">
                    {editingId ? 'Editar referencia' : 'Nueva referencia'}
                  </h3>

                  <div className="flex gap-2">
                    {(['image', 'video'] as const).map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setForm((f) => ({ ...f, mediaType: type }))}
                        className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          form.mediaType === type
                            ? 'border-cyan bg-cyan/10 text-cyan'
                            : 'border-border text-slate-400'
                        }`}
                      >
                        {type === 'image' ? 'Imagen' : 'Video'}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {([
                      { key: 'device', label: 'Subir desde dispositivo', icon: Smartphone },
                      { key: 'path', label: 'Ruta local / URL', icon: LinkIcon },
                    ] as const).map(({ key, label, icon: Icon }) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setForm((f) => ({ ...f, uploadMode: key }))}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          form.uploadMode === key
                            ? 'border-cyan bg-cyan/10 text-cyan'
                            : 'border-border text-slate-400'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {form.uploadMode === 'device' ? (
                    <div
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                        isDragging
                          ? 'border-cyan bg-cyan/5'
                          : 'border-border bg-bg hover:border-cyan/50'
                      }`}
                    >
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-cyan" />
                      ) : (
                        <UploadCloud className="h-6 w-6 text-slate-400" />
                      )}
                      <p className="text-xs text-slate-400">
                        {isUploading
                          ? 'Subiendo archivo...'
                          : 'Arrastra una foto o video aquí, o haz clic para seleccionar'}
                      </p>
                      {form.fileName && !isUploading && (
                        <p className="max-w-full truncate text-xs font-medium text-cyan">
                          {form.fileName}
                        </p>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <input
                      value={form.mediaUrl}
                      onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
                      placeholder="/media/nombre-archivo.jpg o https://..."
                      className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400/60 focus:border-cyan focus:outline-none"
                    />
                  )}

                  {form.mediaUrl && (
                    <div className="overflow-hidden rounded-lg border border-border bg-bg">
                      {form.mediaType === 'image' ? (
                        <img
                          src={resolveMediaUrl(form.mediaUrl)}
                          alt="Vista previa"
                          className="max-h-48 w-full object-contain"
                        />
                      ) : (
                        <video
                          src={resolveMediaUrl(form.mediaUrl)}
                          controls
                          muted
                          className="max-h-48 w-full object-contain"
                        />
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                      placeholder="Nombre del cliente"
                      className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400/60 focus:border-cyan focus:outline-none"
                    />
                    <input
                      value={form.customerHandle}
                      onChange={(e) => setForm((f) => ({ ...f, customerHandle: e.target.value }))}
                      placeholder="Handle (opcional)"
                      className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400/60 focus:border-cyan focus:outline-none"
                    />
                  </div>

                  <textarea
                    value={form.caption}
                    onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                    placeholder="Descripción / caption"
                    rows={3}
                    className="resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400/60 focus:border-cyan focus:outline-none"
                  />

                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setForm((f) => ({ ...f, category: cat }))}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          form.category === cat
                            ? 'border-cyan bg-cyan/10 text-cyan'
                            : 'border-border text-slate-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      Fecha de publicación (opcional)
                    </label>
                    <input
                      type="date"
                      value={form.publishDate}
                      onChange={(e) => setForm((f) => ({ ...f, publishDate: e.target.value }))}
                      className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-slate-200 [color-scheme:dark] focus:border-cyan focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-slate-400/70">
                      Déjalo vacío para usar la fecha y hora actuales.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={form.pinned}
                      onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                      className="h-4 w-4 rounded border-border accent-cyan"
                    />
                    Fijar al inicio
                  </label>

                  {formError && <p className="text-xs text-red-400">{formError}</p>}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSaving || isUploading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : editingId ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {editingId ? 'Guardar cambios' : 'Agregar referencia'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-lg border border-border px-4 py-2.5 text-sm text-slate-400"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>

                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">
                    Referencias existentes ({vouches.length})
                  </h3>
                  <button
                    onClick={() => void runGuarded(restoreSeedData)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restaurar datos de muestra
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {sortedVouches.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5"
                    >
                      <img
                        src={resolveMediaUrl(v.media.thumbnail ?? v.media.url)}
                        alt={v.caption}
                        className="h-12 w-12 shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {v.customerName}
                        </p>
                        <p className="truncate text-xs text-slate-400">{v.caption}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="rounded bg-bg px-1.5 py-0.5">{v.category}</span>
                          {!v.published && (
                            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-400">
                              Borrador
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => void runGuarded(() => togglePin(v.id))}
                          title={v.pinned ? 'Desfijar' : 'Fijar'}
                          className={`flex h-8 w-8 items-center justify-center rounded-md ${
                            v.pinned ? 'bg-cyan/10 text-cyan' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {v.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => void runGuarded(() => togglePublished(v.id))}
                          title={v.published ? 'Ocultar' : 'Publicar'}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-slate-200"
                        >
                          {v.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => startEdit(v)}
                          title="Editar"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-slate-200"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => void runGuarded(() => deleteVouch(v.id))}
                          title="Eliminar"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
