import { useState, ChangeEvent } from 'react';
import {
  AlertTriangle,
  Check,
  Image as ImageIcon,
  Search,
  Upload,
  X,
  FileText,
  Film,
} from 'lucide-react';
import type { MediaAssetItem } from '../../types/portfolio';
import { useAuth } from '../../context/AuthContext';
import { logAdminActivity, saveDocument, slugifyId } from '../../lib/portfolioService';
import { resolveAssetUrl } from '../../lib/assetUrl';

export function formatFirestoreTime(ts: unknown): string {
  if (!ts) return '—';
  if (typeof ts === 'string' || typeof ts === 'number') {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }
  if (typeof ts === 'object' && ts !== null) {
    const obj = ts as { seconds?: number; toDate?: () => Date };
    if (typeof obj.toDate === 'function') {
      return obj.toDate().toLocaleString();
    }
    if (typeof obj.seconds === 'number') {
      return new Date(obj.seconds * 1000).toLocaleString();
    }
  }
  return '—';
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm Delete',
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#111114] border border-white/15 p-6 space-y-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#F5F2EB]">{title}</h3>
            <p className="mt-1 text-xs text-[#8C8A84] leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-white/15 text-xs text-[#F5F2EB]/80 hover:text-[#F5F2EB] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {busy ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export async function uploadFileToServer(
  file: File,
  getIdToken: () => Promise<string | null>,
  actorEmail: string | null | undefined,
  folder = 'general'
): Promise<{
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  type: 'image' | 'video' | 'document';
}> {
  const token = await getIdToken();
  if (!token) throw new Error('Authentication session expired. Please sign in again.');

  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const resp = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      dataBase64,
      folder,
    }),
  });
  const result = await resp.json();
  if (!resp.ok) {
    throw new Error(result.error || 'Upload failed');
  }

  const assetId = slugifyId('asset', file.name.replace(/\.[^.]+$/, ''));
  await saveDocument(
    'media_assets',
    assetId,
    {
      title: file.name,
      url: result.url,
      type: result.type,
      altText: file.name.replace(/\.[^.]+$/, ''),
      caption: '',
      folder,
      mimeType: result.mimeType,
      sizeBytes: result.sizeBytes,
    },
    true
  );

  await logAdminActivity(
    actorEmail,
    'media_upload',
    'media_assets',
    assetId,
    `Uploaded ${file.name} (${result.type}) to "${folder}"`
  );

  return result;
}

export function MediaPickerModal({
  open,
  media,
  acceptTypes,
  folder = 'general',
  onClose,
  onSelect,
  onUploaded,
}: {
  open: boolean;
  media: MediaAssetItem[];
  acceptTypes?: Array<'image' | 'video' | 'document'>;
  folder?: string;
  onClose: () => void;
  onSelect: (url: string, item?: MediaAssetItem) => void;
  onUploaded?: () => Promise<void>;
}) {
  const { getIdToken, user } = useAuth();
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const filtered = media.filter((m) => {
    if (acceptTypes && !acceptTypes.includes(m.type)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      (m.folder || '').toLowerCase().includes(q) ||
      (m.altText || '').toLowerCase().includes(q)
    );
  });

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadFileToServer(file, getIdToken, user?.email, folder);
      if (onUploaded) await onUploaded();
      onSelect(uploaded.url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-4xl max-h-[86vh] flex flex-col rounded-2xl bg-[#111114] border border-white/15 shadow-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#F5F2EB]">Select Media Asset</h3>
            <p className="text-xs text-[#8C8A84]">Choose from your library or upload a new file.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold cursor-pointer hover:bg-[#E8D2A0]">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading...' : 'Upload New'}</span>
              <input
                type="file"
                accept="image/*,.svg,video/mp4,video/webm,application/pdf"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close media picker"
              className="p-2 rounded-lg border border-white/10 text-[#8C8A84] hover:text-[#F5F2EB]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-white/10 flex items-center gap-2 bg-[#0c0c0f]">
          <Search className="w-4 h-4 text-[#8C8A84]" />
          <input
            type="text"
            placeholder="Search by title, folder, or alt text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-[#F5F2EB] focus:outline-none"
          />
        </div>

        {error && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200">
            {error}
          </div>
        )}

        <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item.url, item);
                onClose();
              }}
              className="group text-left rounded-xl bg-[#070708] border border-white/10 hover:border-[#D4B475]/60 overflow-hidden transition-colors"
            >
              <div className="aspect-[4/3] bg-black/50 flex items-center justify-center overflow-hidden">
                {item.type === 'image' ? (
                  <img
                    src={resolveAssetUrl(item.url)}
                    alt={item.altText || item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : item.type === 'video' ? (
                  <Film className="w-8 h-8 text-[#D4B475]" />
                ) : (
                  <FileText className="w-8 h-8 text-[#D4B475]" />
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-[#F5F2EB] truncate">{item.title}</p>
                <p className="text-[10px] font-mono text-[#8C8A84] uppercase mt-0.5">
                  {item.folder || item.type}
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-xs text-[#8C8A84] text-center py-8">
              No matching assets in library. Use “Upload New” above to add one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MediaField({
  label,
  value,
  media,
  acceptTypes,
  folder = 'general',
  placeholder = 'https://... or /uploads/...',
  onChange,
  onUploaded,
}: {
  label: string;
  value: string;
  media: MediaAssetItem[];
  acceptTypes?: Array<'image' | 'video' | 'document'>;
  folder?: string;
  placeholder?: string;
  onChange: (nextUrl: string) => void;
  onUploaded?: () => Promise<void>;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-xs text-[#8C8A84] block">{label}</label>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-[#070708] border border-white/10 text-xs text-[#F5F2EB]"
        />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 text-xs font-medium text-[#F5F2EB]"
        >
          <ImageIcon className="w-3.5 h-3.5 text-[#D4B475]" />
          <span>Library / Upload</span>
        </button>
      </div>
      {value && (value.match(/\.(jpg|jpeg|png|webp|avif|svg)(\?.*)?$/i) || value.startsWith('data:image')) && (
        <div className="flex items-center gap-3 pt-1">
          <img
            src={resolveAssetUrl(value)}
            alt={label}
            className="w-12 h-12 rounded-lg object-cover border border-white/10 bg-black"
          />
          <span className="text-[11px] font-mono text-[#8C8A84] truncate max-w-xs">{value}</span>
        </div>
      )}
      <MediaPickerModal
        open={pickerOpen}
        media={media}
        acceptTypes={acceptTypes}
        folder={folder}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => onChange(url)}
        onUploaded={onUploaded}
      />
    </div>
  );
}

export function AdminNoticeBanner({
  message,
  tone = 'success',
}: {
  message: string | null;
  tone?: 'success' | 'error';
}) {
  if (!message) return null;
  return (
    <div
      role="status"
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs border ${
        tone === 'error'
          ? 'bg-rose-950/50 border-rose-500/30 text-rose-200'
          : 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200'
      }`}
    >
      <Check className="w-3.5 h-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
