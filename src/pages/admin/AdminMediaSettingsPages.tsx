import { useEffect, useState } from 'react';
import {
  Copy,
  Download,
  FileText,
  Film,
  FolderOpen,
  History,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  buildPortfolioBackupPayload,
  logAdminActivity,
  removeDocument,
  restoreContentVersion,
  saveContentVersion,
  saveDocument,
  slugifyId,
} from '../../lib/portfolioService';
import type { ContentVersionItem, MediaAssetItem } from '../../types/portfolio';
import { resolveAssetUrl } from '../../lib/assetUrl';
import {
  AdminNoticeBanner,
  ConfirmModal,
  formatFirestoreTime,
  MediaField,
  uploadFileToServer,
} from '../../components/admin/AdminUi';
import { AdminLayout, useAdminData } from './AdminLayout';

/* MEDIA LIBRARY (/admin/media) */
function MediaInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { getIdToken, user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [folder, setFolder] = useState('general');
  const [folderFilter, setFolderFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<MediaAssetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetItem | null>(null);
  const [notice, setNotice] = useState<{ msg: string; tone: 'success' | 'error' } | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading media library...</div>;

  const folders = Array.from(
    new Set(['general', 'projects', 'profile', 'hero', 'services', 'certifications', ...adminData.media.map((m) => m.folder || 'general')])
  );

  const filtered = adminData.media.filter((asset) => {
    if (folderFilter !== 'all' && (asset.folder || 'general') !== folderFilter) return false;
    if (typeFilter !== 'all' && asset.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        asset.title.toLowerCase().includes(q) ||
        (asset.altText || '').toLowerCase().includes(q) ||
        (asset.caption || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleMultiUpload = async (files: FileList) => {
    setUploading(true);
    setNotice(null);
    try {
      for (const file of Array.from(files)) {
        await uploadFileToServer(file, getIdToken, user?.email, folder);
      }
      await reloadAdmin();
      setNotice({ msg: `Uploaded ${files.length} file(s) to "${folder}".`, tone: 'success' });
    } catch (err) {
      setNotice({ msg: err instanceof Error ? err.message : 'Upload failed', tone: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceFile = async (asset: MediaAssetItem, file: File) => {
    setUploading(true);
    try {
      const token = await getIdToken();
      if (asset.url.startsWith('/uploads/') && token) {
        await fetch(`/api/admin/upload?url=${encodeURIComponent(asset.url)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      const uploaded = await uploadFileToServer(file, getIdToken, user?.email, asset.folder || 'general');
      await saveDocument('media_assets', asset.id, {
        ...asset,
        url: uploaded.url,
        type: uploaded.type,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
      });
      await logAdminActivity(user?.email, 'update', 'media_assets', asset.id, `Replaced asset file "${asset.title}"`);
      await reloadAdmin();
      setNotice({ msg: `Replaced "${asset.title}".`, tone: 'success' });
    } catch (err) {
      setNotice({ msg: err instanceof Error ? err.message : 'Replace failed', tone: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    await saveDocument('media_assets', editing.id, {
      title: editing.title,
      url: editing.url,
      type: editing.type,
      altText: editing.altText,
      caption: editing.caption || '',
      folder: editing.folder || 'general',
      mimeType: editing.mimeType,
      sizeBytes: editing.sizeBytes,
      createdAt: editing.createdAt,
    });
    await logAdminActivity(user?.email, 'update', 'media_assets', editing.id, `Updated metadata for "${editing.title}"`);
    setEditing(null);
    await reloadAdmin();
    setNotice({ msg: 'Media metadata updated.', tone: 'success' });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const token = await getIdToken();
    if (deleteTarget.url.startsWith('/uploads/') && token) {
      await fetch(`/api/admin/upload?url=${encodeURIComponent(deleteTarget.url)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    await removeDocument('media_assets', deleteTarget.id);
    await logAdminActivity(user?.email, 'delete', 'media_assets', deleteTarget.id, `Deleted media asset "${deleteTarget.title}"`);
    setDeleteTarget(null);
    await reloadAdmin();
    setNotice({ msg: 'Media asset deleted.', tone: 'success' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">Assets</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold">Media Library &amp; Folders</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '-'))}
            placeholder="Upload folder"
            className="w-32 px-3 py-2 rounded-lg bg-[#111114] border border-white/15 text-xs"
          />
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold cursor-pointer hover:bg-[#E8D2A0]">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Multi-Upload Files'}</span>
            <input
              type="file"
              multiple
              accept="image/*,.svg,video/mp4,video/webm,application/pdf"
              className="sr-only"
              onChange={(e) => e.target.files && handleMultiUpload(e.target.files)}
            />
          </label>
        </div>
      </div>

      {notice && <AdminNoticeBanner message={notice.msg} tone={notice.tone} />}

      {/* Search & Folder Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111114] border border-white/10">
          <Search className="w-4 h-4 text-[#8C8A84]" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-[#F5F2EB] focus:outline-none"
          />
        </div>
        <select
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#111114] border border-white/10 text-xs text-[#F5F2EB]"
        >
          <option value="all">All Folders</option>
          {folders.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | 'image' | 'video' | 'document')}
          className="px-3 py-2 rounded-xl bg-[#111114] border border-white/10 text-xs text-[#F5F2EB]"
        >
          <option value="all">All Types</option>
          <option value="image">Images &amp; SVG</option>
          <option value="video">Videos</option>
          <option value="document">PDF Documents</option>
        </select>
      </div>

      {editing && (
        <form onSubmit={handleSaveMeta} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4">
          <h2 className="font-serif text-xl text-[#D4B475]">Edit Asset Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Filename / Title</label>
              <input type="text" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs" required />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Folder</label>
              <input type="text" value={editing.folder || 'general'} onChange={(e) => setEditing({ ...editing, folder: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs" />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Alt Text</label>
              <input type="text" value={editing.altText} onChange={(e) => setEditing({ ...editing, altText: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs" />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Caption</label>
              <input type="text" value={editing.caption || ''} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-[#8C8A84]">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">Save Metadata</button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#111114] border border-white/10 text-sm text-[#8C8A84]">
          Upload JPG, PNG, WebP, sanitized SVG, MP4, WebM, or PDF files above to organize and reuse URLs across your site.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((asset) => (
            <div key={asset.id} className="rounded-2xl overflow-hidden bg-[#111114] border border-white/10 flex flex-col">
              <div className="aspect-video bg-[#070708] flex items-center justify-center overflow-hidden">
                {asset.type === 'image' ? (
                  <img src={resolveAssetUrl(asset.url)} alt={asset.altText} className="w-full h-full object-cover" />
                ) : asset.type === 'video' ? (
                  <video src={resolveAssetUrl(asset.url)} controls className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[#D4B475]">
                    <FileText className="w-8 h-8" />
                    <span className="text-[11px] font-mono">PDF Document</span>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-[#F5F2EB] truncate">{asset.title}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#D4B475] uppercase">
                      <FolderOpen className="w-3 h-3" /> {asset.folder || 'general'}
                    </span>
                  </div>
                  {asset.caption && <p className="text-[11px] text-[#8C8A84] mt-1 truncate">{asset.caption}</p>}
                  <p className="text-[10px] font-mono text-[#8C8A84] mt-1">
                    {((asset.sizeBytes || 0) / 1024).toFixed(1)} KB
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/8">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(asset.url);
                      setNotice({ msg: `Copied ${asset.url}`, tone: 'success' });
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#D4B475] hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditing(asset)}
                      className="px-2.5 py-1 rounded border border-white/15 text-[11px] hover:border-[#D4B475]"
                    >
                      Edit Info
                    </button>
                    <label className="px-2.5 py-1 rounded border border-white/15 text-[11px] cursor-pointer hover:border-[#D4B475] inline-flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Replace
                      <input
                        type="file"
                        accept="image/*,.svg,video/mp4,video/webm,application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleReplaceFile(asset, e.target.files[0])}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(asset)}
                      className="p-1.5 rounded-lg border border-rose-500/30 text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Media Asset?"
        message={`Delete "${deleteTarget?.title}"? Make sure no active project or section relies on this URL.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/* WEBSITE SETTINGS, SOCIAL PLATFORMS, BACKUP EXPORT & ROLLBACK (/admin/settings) */
function SettingsInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [marqueeText, setMarqueeText] = useState('');
  const [showcaseVideoUrl, setShowcaseVideoUrl] = useState('');
  const [showcasePosterUrl, setShowcasePosterUrl] = useState('');
  const [contactFormEnabled, setContactFormEnabled] = useState(true);
  const [contactAvailabilityNote, setContactAvailabilityNote] = useState('');
  const [showAdminFooterLink, setShowAdminFooterLink] = useState(true);
  const [enableCustomCursor, setEnableCustomCursor] = useState(true);

  const [newPlatform, setNewPlatform] = useState('');
  const [newPlatformUrl, setNewPlatformUrl] = useState('');
  const [socialEdits, setSocialEdits] = useState<Record<string, { url: string; isVisible: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<ContentVersionItem | null>(null);
  const [notice, setNotice] = useState<{ msg: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!adminData) return;
    const s = adminData.settings;
    setMarqueeText(s.marqueeText || '');
    setShowcaseVideoUrl(s.showcaseVideoUrl || '');
    setShowcasePosterUrl(s.showcasePosterUrl || '');
    setContactFormEnabled(s.contactFormEnabled ?? true);
    setContactAvailabilityNote(s.contactAvailabilityNote || '');
    setShowAdminFooterLink(s.showAdminFooterLink ?? true);
    setEnableCustomCursor(s.enableCustomCursor);

    const map: Record<string, { url: string; isVisible: boolean }> = {};
    adminData.socialLinks.forEach((l) => {
      map[l.id] = { url: l.url, isVisible: l.isVisible };
    });
    setSocialEdits(map);
  }, [adminData]);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading website settings...</div>;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await saveContentVersion(
        'settings',
        'main',
        `Settings snapshot (${new Date().toLocaleTimeString()})`,
        adminData.settings,
        user?.email
      );
      await saveDocument('site_settings', 'main', {
        ...adminData.settings,
        marqueeText,
        showcaseVideoUrl,
        showcasePosterUrl,
        contactFormEnabled,
        contactAvailabilityNote,
        showAdminFooterLink,
        enableCustomCursor,
      });
      await Promise.all(
        adminData.socialLinks.map((link) => {
          const edit = socialEdits[link.id] || { url: link.url, isVisible: link.isVisible };
          return saveDocument('social_links', link.id, {
            platform: link.platform,
            url: edit.url.trim(),
            isVisible: edit.isVisible && edit.url.trim().length > 0,
            sortOrder: link.sortOrder,
          });
        })
      );
      await logAdminActivity(user?.email, 'settings_change', 'site_settings', 'main', 'Updated website settings & social links');
      await reloadAdmin();
      setNotice({ msg: 'Website settings & social platforms saved.', tone: 'success' });
    } catch (err) {
      setNotice({ msg: err instanceof Error ? err.message : 'Save failed', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocialPlatform = async () => {
    if (!newPlatform.trim()) return;
    const id = slugifyId('soc', newPlatform);
    await saveDocument('social_links', id, {
      platform: newPlatform.trim(),
      url: newPlatformUrl.trim(),
      isVisible: newPlatformUrl.trim().length > 0,
      sortOrder: adminData.socialLinks.length + 1,
    });
    await logAdminActivity(user?.email, 'create', 'social_links', id, `Added social platform "${newPlatform.trim()}"`);
    setNewPlatform('');
    setNewPlatformUrl('');
    await reloadAdmin();
  };

  const handleFullBackupExport = () => {
    const payload = buildPortfolioBackupPayload(adminData);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    void logAdminActivity(user?.email, 'backup_export', 'full_portfolio', 'all', 'Exported full portfolio JSON backup');
    setNotice({ msg: 'Complete portfolio backup JSON downloaded.', tone: 'success' });
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">Configuration</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold">Website Settings, Social &amp; Backups</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFullBackupExport}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-white/15 text-xs hover:border-[#D4B475]"
          >
            <Download className="w-3.5 h-3.5 text-[#D4B475]" />
            <span>Export Full Backup</span>
          </button>
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold hover:bg-[#E8D2A0]">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {notice && <AdminNoticeBanner message={notice.msg} tone={notice.tone} />}

      {/* Showcase Video, Marquee & Contact Settings */}
      <section className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-5">
        <h2 className="font-serif text-xl font-semibold text-[#D4B475]">Interactive Showcase &amp; Contact Behavior</h2>
        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Marquee Banner Copy</label>
          <input type="text" value={marqueeText} onChange={(e) => setMarqueeText(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MediaField
            label="Scroll-Scrubbed Showcase Video (MP4/WebM)"
            value={showcaseVideoUrl}
            media={adminData.media}
            acceptTypes={['video']}
            folder="showcase"
            onChange={setShowcaseVideoUrl}
            onUploaded={reloadAdmin}
          />
          <MediaField
            label="Showcase Video Poster Image"
            value={showcasePosterUrl}
            media={adminData.media}
            acceptTypes={['image']}
            folder="showcase"
            onChange={setShowcasePosterUrl}
            onUploaded={reloadAdmin}
          />
        </div>
        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Contact Form Availability Note</label>
          <input type="text" value={contactAvailabilityNote} onChange={(e) => setContactAvailabilityNote(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
        </div>
        <div className="flex flex-wrap gap-6 pt-1">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={contactFormEnabled} onChange={(e) => setContactFormEnabled(e.target.checked)} className="accent-[#D4B475]" />
            <span>Enable Contact Form Submissions</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showAdminFooterLink} onChange={(e) => setShowAdminFooterLink(e.target.checked)} className="accent-[#D4B475]" />
            <span>Show Subtle Admin Link in Footer</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enableCustomCursor} onChange={(e) => setEnableCustomCursor(e.target.checked)} className="accent-[#D4B475]" />
            <span>Enable Magnetic Custom Cursor</span>
          </label>
        </div>
      </section>

      {/* Dynamic Social Media Profiles */}
      <section className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#D4B475]">Social Media Profiles (Unlimited Platforms)</h2>
          <p className="text-xs text-[#8C8A84] mt-0.5">Only platforms with actual URLs and visibility enabled appear on the public site.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminData.socialLinks.map((link) => {
            const state = socialEdits[link.id] || { url: link.url, isVisible: link.isVisible };
            return (
              <div key={link.id} className="p-3.5 rounded-xl bg-[#070708] border border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#F5F2EB]">{link.platform}</span>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 text-[11px] text-[#8C8A84]">
                      <input
                        type="checkbox"
                        checked={state.isVisible}
                        onChange={(e) =>
                          setSocialEdits((prev) => ({
                            ...prev,
                            [link.id]: { ...state, isVisible: e.target.checked },
                          }))
                        }
                        className="accent-[#D4B475]"
                      />
                      Visible
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        await removeDocument('social_links', link.id);
                        await reloadAdmin();
                      }}
                      className="text-rose-400 hover:text-rose-300 text-xs"
                      title="Delete platform"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <input
                  type="url"
                  value={state.url}
                  placeholder={`https://... (${link.platform} profile URL)`}
                  onChange={(e) =>
                    setSocialEdits((prev) => ({
                      ...prev,
                      [link.id]: { url: e.target.value, isVisible: e.target.value.trim().length > 0 },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#111114] border border-white/10 text-xs"
                />
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <input type="text" placeholder="Add custom platform (e.g. Threads, Kaggle)" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs" />
          <input type="url" placeholder="https://..." value={newPlatformUrl} onChange={(e) => setNewPlatformUrl(e.target.value)} className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs" />
          <button type="button" onClick={handleAddSocialPlatform} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium">
            <Plus className="w-3.5 h-3.5 text-[#D4B475]" /> Add Platform
          </button>
        </div>
      </section>

      {/* Version History & Rollback */}
      <section className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#D4B475]" />
          <h2 className="font-serif text-xl font-semibold text-[#D4B475]">Version History &amp; Safe Rollback</h2>
        </div>
        {adminData.contentVersions.length === 0 ? (
          <p className="text-xs text-[#8C8A84]">Snapshots are automatically saved before updates to Profile, About, Projects, Sections, and Settings.</p>
        ) : (
          <div className="divide-y divide-white/8">
            {adminData.contentVersions.slice(0, 12).map((ver) => (
              <div key={ver.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#F5F2EB]">{ver.label}</p>
                  <p className="text-[11px] font-mono text-[#8C8A84]">
                    {ver.entityType} / {ver.entityId} · {formatFirestoreTime(ver.createdAt)} · {ver.actorEmail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRestoreTarget(ver)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4B475]/40 text-xs text-[#D4B475] hover:bg-[#D4B475] hover:text-[#070708] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmModal
        open={Boolean(restoreTarget)}
        title="Restore Previous Snapshot?"
        message={`Revert "${restoreTarget?.label}"? Current live values for this item will be replaced with the saved snapshot.`}
        confirmLabel="Restore Snapshot"
        onCancel={() => setRestoreTarget(null)}
        onConfirm={async () => {
          if (!restoreTarget) return;
          await restoreContentVersion(restoreTarget, user?.email);
          setRestoreTarget(null);
          await reloadAdmin();
          setNotice({ msg: 'Snapshot restored successfully.', tone: 'success' });
        }}
      />
    </form>
  );
}

export function AdminMediaPage() {
  return (
    <AdminLayout>
      <MediaInner />
    </AdminLayout>
  );
}

export function AdminSettingsPage() {
  return (
    <AdminLayout>
      <SettingsInner />
    </AdminLayout>
  );
}
