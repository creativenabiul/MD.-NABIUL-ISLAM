import { useEffect, useState } from 'react';
import { Upload, Trash2, Copy, CheckCircle2, FileText, Film } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { removeDocument, saveDocument, slugifyId } from '../../lib/portfolioService';
import type { MediaAssetItem } from '../../types/portfolio';
import { AdminLayout, useAdminData } from './AdminLayout';

/* MEDIA LIBRARY */
function MediaInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { getIdToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading media library...</div>;

  const handleUpload = async (file: File) => {
    setUploading(true);
    setNotice('');
    try {
      const token = await getIdToken();
      const base64 = await new Promise<string>((resolve, reject) => {
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
          dataBase64: base64,
        }),
      });
      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || 'Upload failed');

      const docId = slugifyId('media', file.name);
      await saveDocument(
        'media_assets',
        docId,
        {
          title: file.name,
          url: res.url,
          type: res.type,
          altText: file.name.replace(/\.[^/.]+$/, ''),
          mimeType: res.mimeType,
          sizeBytes: res.sizeBytes,
        },
        true
      );
      await reloadAdmin();
      setNotice(`Uploaded ${file.name} (${res.url})`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const updateAlt = async (asset: MediaAssetItem, altText: string) => {
    await saveDocument('media_assets', asset.id, {
      title: asset.title,
      url: asset.url,
      type: asset.type,
      altText,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      createdAt: asset.createdAt,
    });
    await reloadAdmin();
  };

  const deleteAsset = async (asset: MediaAssetItem) => {
    const token = await getIdToken();
    if (asset.url.startsWith('/uploads/') && token) {
      await fetch(`/api/admin/upload?url=${encodeURIComponent(asset.url)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    await removeDocument('media_assets', asset.id);
    await reloadAdmin();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">Assets</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold">Media Library</h1>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold cursor-pointer hover:bg-[#E8D2A0]">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Image, Video, or PDF'}</span>
          <input
            type="file"
            accept="image/*,video/mp4,video/webm,application/pdf"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
        </label>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#141418] border border-[#D4B475]/40 text-xs text-[#E8D2A0]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {adminData.media.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#111114] border border-white/10 text-sm text-[#8C8A84]">
          Upload images, MP4 showcase videos, or PDF CV documents here to manage URLs and alt text.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {adminData.media.map((asset) => (
            <div key={asset.id} className="rounded-2xl overflow-hidden bg-[#111114] border border-white/10 flex flex-col">
              <div className="aspect-video bg-[#070708] flex items-center justify-center overflow-hidden">
                {asset.type === 'image' ? (
                  <img src={asset.url} alt={asset.altText} className="w-full h-full object-cover" />
                ) : asset.type === 'video' ? (
                  <Film className="w-8 h-8 text-[#D4B475]" />
                ) : (
                  <FileText className="w-8 h-8 text-[#D4B475]" />
                )}
              </div>
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#F5F2EB] truncate">{asset.title}</p>
                  <input
                    type="text"
                    defaultValue={asset.altText}
                    onBlur={(e) => updateAlt(asset, e.target.value)}
                    placeholder="Alt text..."
                    className="w-full px-2.5 py-1.5 rounded bg-[#070708] border border-white/12 text-xs"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(asset.url);
                      setNotice(`Copied ${asset.url}`);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#D4B475] hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy URL
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAsset(asset)}
                    className="p-1.5 rounded-lg border border-rose-500/30 text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* SETTINGS & SOCIAL LINKS */
function SettingsInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { getIdToken } = useAuth();
  const [settingsForm, setSettingsForm] = useState({
    siteTitle: '',
    tagline: '',
    seoDescription: '',
    ogImageUrl: '',
    showcaseVideoUrl: '',
    showcasePosterUrl: '',
    marqueeText: '',
    accentGoldHex: '#D4B475',
    enable3D: true,
    enableCustomCursor: true,
  });
  const [socialEdits, setSocialEdits] = useState<Record<string, { url: string; isVisible: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!adminData) return;
    const s = adminData.settings;
    setSettingsForm({
      siteTitle: s.siteTitle,
      tagline: s.tagline,
      seoDescription: s.seoDescription,
      ogImageUrl: s.ogImageUrl || '',
      showcaseVideoUrl: s.showcaseVideoUrl || '',
      showcasePosterUrl: s.showcasePosterUrl || '',
      marqueeText: s.marqueeText,
      accentGoldHex: s.accentGoldHex || '#D4B475',
      enable3D: s.enable3D,
      enableCustomCursor: s.enableCustomCursor,
    });
    const map: Record<string, { url: string; isVisible: boolean }> = {};
    adminData.socialLinks.forEach((l) => {
      map[l.id] = { url: l.url, isVisible: l.isVisible };
    });
    setSocialEdits(map);
  }, [adminData]);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading settings...</div>;

  const uploadVideo = async (file: File) => {
    setUploadingVideo(true);
    try {
      const token = await getIdToken();
      const base64 = await new Promise<string>((resolve, reject) => {
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
          dataBase64: base64,
        }),
      });
      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || 'Upload failed');
      setSettingsForm((prev) => ({ ...prev, showcaseVideoUrl: res.url }));
      setNotice('Showcase video uploaded. Click Save Settings to publish.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Video upload failed');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      await saveDocument('site_settings', 'main', settingsForm);
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
      await reloadAdmin();
      setNotice('Site settings, video configuration & social links saved.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">Configuration</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold">Settings, SEO &amp; Social Profiles</h1>
        </div>
        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold hover:bg-[#E8D2A0]">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#141418] border border-[#D4B475]/40 text-xs text-[#E8D2A0]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* SEO & Experience */}
      <section className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
        <h2 className="font-serif text-xl font-semibold text-[#D4B475]">SEO &amp; Visual Experience</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Site Title</label>
            <input type="text" value={settingsForm.siteTitle} onChange={(e) => setSettingsForm({ ...settingsForm, siteTitle: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Tagline</label>
            <input type="text" value={settingsForm.tagline} onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Meta Description</label>
          <textarea rows={2} value={settingsForm.seoDescription} onChange={(e) => setSettingsForm({ ...settingsForm, seoDescription: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Marquee Text</label>
          <input type="text" value={settingsForm.marqueeText} onChange={(e) => setSettingsForm({ ...settingsForm, marqueeText: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Scroll-Scrubbed MP4 Video URL</label>
            <div className="flex gap-2">
              <input type="text" value={settingsForm.showcaseVideoUrl} onChange={(e) => setSettingsForm({ ...settingsForm, showcaseVideoUrl: e.target.value })} className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 text-xs cursor-pointer hover:border-[#D4B475]">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingVideo ? '...' : 'Replace MP4'}</span>
                <input type="file" accept="video/mp4,video/webm" className="sr-only" onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Video Poster Image URL</label>
            <input type="text" value={settingsForm.showcasePosterUrl} onChange={(e) => setSettingsForm({ ...settingsForm, showcasePosterUrl: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settingsForm.enable3D} onChange={(e) => setSettingsForm({ ...settingsForm, enable3D: e.target.checked })} className="accent-[#D4B475]" />
            Enable 3D Hero Environment
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settingsForm.enableCustomCursor} onChange={(e) => setSettingsForm({ ...settingsForm, enableCustomCursor: e.target.checked })} className="accent-[#D4B475]" />
            Enable Magnetic Custom Cursor
          </label>
        </div>
      </section>

      {/* Social Media Profiles */}
      <section className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#D4B475]">Social Media Profiles</h2>
          <p className="text-xs text-[#8C8A84] mt-1">Only platforms with actual URLs and visibility enabled appear on the public website.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminData.socialLinks.map((link) => {
            const state = socialEdits[link.id] || { url: link.url, isVisible: link.isVisible };
            return (
              <div key={link.id} className="p-3.5 rounded-xl bg-[#070708] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F5F2EB]">{link.platform}</span>
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
      </section>
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
