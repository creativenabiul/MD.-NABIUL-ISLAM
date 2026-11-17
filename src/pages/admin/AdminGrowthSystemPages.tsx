import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  EyeOff,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  logAdminActivity,
  removeDocument,
  saveDocument,
  slugifyId,
} from '../../lib/portfolioService';
import type { NavigationItem } from '../../types/portfolio';
import {
  AdminNoticeBanner,
  ConfirmModal,
  formatFirestoreTime,
  MediaField,
} from '../../components/admin/AdminUi';
import { AdminLayout, useAdminData } from './AdminLayout';

/* 1. NAVIGATION MENU MANAGEMENT (/admin/navigation) */
function NavigationInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [editing, setEditing] = useState<NavigationItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NavigationItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading navigation...</div>;

  const saveNav = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = editing.id === 'NEW';
    const id = isNew ? slugifyId('nav', editing.label) : editing.id;
    await saveDocument('navigation_items', id, {
      label: editing.label,
      destination: editing.destination,
      sectionId: editing.sectionId || '',
      parentLabel: editing.parentLabel || '',
      isExternal: editing.isExternal,
      isVisible: editing.isVisible,
      sortOrder: editing.sortOrder,
    });
    await logAdminActivity(user?.email, isNew ? 'create' : 'update', 'navigation_items', id, `Saved menu item "${editing.label}"`);
    setEditing(null);
    await reloadAdmin();
    setNotice('Navigation item saved.');
  };

  const moveNav = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= adminData.navigationItems.length) return;
    const a = adminData.navigationItems[idx];
    const b = adminData.navigationItems[target];
    await Promise.all([
      saveDocument('navigation_items', a.id, { ...a, sortOrder: target + 1 }),
      saveDocument('navigation_items', b.id, { ...b, sortOrder: idx + 1 }),
    ]);
    await reloadAdmin();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4B475]">Header Structure</p>
          <h1 className="font-serif text-3xl font-semibold">Navigation Menu Manager</h1>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: 'NEW',
              label: '',
              destination: '/',
              sectionId: '',
              parentLabel: '',
              isExternal: false,
              isVisible: true,
              sortOrder: adminData.navigationItems.length + 1,
            })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Menu Link
        </button>
      </div>

      <AdminNoticeBanner message={notice} />

      {editing && (
        <form onSubmit={saveNav} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Label (e.g. Projects)" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="URL / Route (/about, #section, https://...)" value={editing.destination} onChange={(e) => setEditing({ ...editing, destination: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Parent Dropdown Label (optional)" value={editing.parentLabel || ''} onChange={(e) => setEditing({ ...editing, parentLabel: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Section Anchor ID (optional)" value={editing.sectionId || ''} onChange={(e) => setEditing({ ...editing, sectionId: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" checked={editing.isVisible} onChange={(e) => setEditing({ ...editing, isVisible: e.target.checked })} className="accent-[#D4B475]" />
              Visible in Navbar
            </label>
            <label className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" checked={editing.isExternal} onChange={(e) => setEditing({ ...editing, isExternal: e.target.checked })} className="accent-[#D4B475]" />
              Open in New Tab (External Link)
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-[#8C8A84]">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">Save</button>
          </div>
        </form>
      )}

      <div className="space-y-2.5">
        {adminData.navigationItems.map((nav, idx) => (
          <div key={nav.id} className="p-4 rounded-xl bg-[#111114] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                {nav.label}{' '}
                {nav.parentLabel ? <span className="text-xs text-[#D4B475]">↳ under {nav.parentLabel}</span> : null}
              </p>
              <p className="text-xs font-mono text-[#8C8A84]">
                {nav.destination} {nav.isExternal ? '· External' : ''} · {nav.isVisible ? 'Visible' : 'Hidden'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => moveNav(idx, -1)} disabled={idx === 0} className="p-2 rounded-lg border border-white/10 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => moveNav(idx, 1)} disabled={idx === adminData.navigationItems.length - 1} className="p-2 rounded-lg border border-white/10 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
              <button onClick={async () => { await saveDocument('navigation_items', nav.id, { ...nav, isVisible: !nav.isVisible }); await reloadAdmin(); }} className="p-2 rounded-lg border border-white/10">
                {nav.isVisible ? <Eye className="w-3.5 h-3.5 text-[#D4B475]" /> : <EyeOff className="w-3.5 h-3.5 text-[#8C8A84]" />}
              </button>
              <button onClick={() => setEditing(nav)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs">Edit</button>
              <button onClick={() => setDeleteTarget(nav)} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Navigation Item?"
        message={`Remove "${deleteTarget?.label}" from website navigation?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await removeDocument('navigation_items', deleteTarget.id);
          await logAdminActivity(user?.email, 'delete', 'navigation_items', deleteTarget.id, `Deleted nav link "${deleteTarget.label}"`);
          setDeleteTarget(null);
          await reloadAdmin();
        }}
      />
    </div>
  );
}

/* 2. SEO MANAGEMENT (/admin/seo) */
function SeoInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [form, setForm] = useState({
    siteTitle: '',
    seoDescription: '',
    seoKeywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImageUrl: '',
    canonicalUrl: '',
    robotsMeta: 'index, follow',
  });
  const [pageOverrides, setPageOverrides] = useState<Record<string, { title: string; description: string }>>({
    home: { title: '', description: '' },
    about: { title: '', description: '' },
    projects: { title: '', description: '' },
    contact: { title: '', description: '' },
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!adminData) return;
    const s = adminData.settings;
    setForm({
      siteTitle: s.siteTitle || '',
      seoDescription: s.seoDescription || '',
      seoKeywords: s.seoKeywords || '',
      ogTitle: s.ogTitle || '',
      ogDescription: s.ogDescription || '',
      ogImageUrl: s.ogImageUrl || '',
      canonicalUrl: s.canonicalUrl || '',
      robotsMeta: s.robotsMeta || 'index, follow',
    });
    try {
      const parsed = s.pageSeoJson ? JSON.parse(s.pageSeoJson) : {};
      setPageOverrides({
        home: parsed.home || { title: '', description: '' },
        about: parsed.about || { title: '', description: '' },
        projects: parsed.projects || { title: '', description: '' },
        contact: parsed.contact || { title: '', description: '' },
      });
    } catch {
      // Keep clean defaults
    }
  }, [adminData]);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading SEO settings...</div>;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveDocument('site_settings', 'main', {
        ...adminData.settings,
        ...form,
        pageSeoJson: JSON.stringify(pageOverrides),
      });
      await logAdminActivity(user?.email, 'settings_change', 'seo', 'main', 'Updated global and per-page SEO configuration');
      await reloadAdmin();
      setNotice('SEO metadata & Open Graph tags updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4B475]">Search &amp; Social Graph</p>
          <h1 className="font-serif text-3xl font-semibold">SEO Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <a href="/robots.txt" target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg border border-white/15 text-xs hover:border-[#D4B475]">
            View robots.txt
          </a>
          <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg border border-white/15 text-xs hover:border-[#D4B475]">
            View sitemap.xml
          </a>
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">
            {saving ? 'Saving...' : 'Save SEO'}
          </button>
        </div>
      </div>

      <AdminNoticeBanner message={notice} />

      <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
        <h2 className="font-serif text-xl text-[#D4B475]">Global Meta &amp; Open Graph</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Default Site Title</label>
            <input type="text" value={form.siteTitle} onChange={(e) => setForm({ ...form, siteTitle: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Keywords</label>
            <input type="text" value={form.seoKeywords} onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Canonical Base URL</label>
            <input type="url" placeholder="https://your-domain.com" value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Robots Directive</label>
            <input type="text" value={form.robotsMeta} onChange={(e) => setForm({ ...form, robotsMeta: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Open Graph Title</label>
            <input type="text" value={form.ogTitle} onChange={(e) => setForm({ ...form, ogTitle: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <MediaField
            label="Social Share (OG) Image"
            value={form.ogImageUrl}
            media={adminData.media}
            acceptTypes={['image']}
            folder="seo"
            onChange={(url) => setForm({ ...form, ogImageUrl: url })}
            onUploaded={reloadAdmin}
          />
        </div>
        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Default Meta Description</label>
          <textarea rows={2} value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Open Graph Description</label>
          <textarea rows={2} value={form.ogDescription} onChange={(e) => setForm({ ...form, ogDescription: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
        </div>
      </div>

      {/* Per-page overrides */}
      <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
        <h2 className="font-serif text-xl text-[#D4B475]">Per-Page SEO Overrides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['home', 'about', 'projects', 'contact'] as const).map((pg) => (
            <div key={pg} className="p-4 rounded-xl bg-[#070708] border border-white/10 space-y-2.5">
              <p className="text-xs font-mono uppercase text-[#D4B475]">/{pg === 'home' ? '' : pg} Page</p>
              <input
                type="text"
                placeholder="Custom title (optional)"
                value={pageOverrides[pg]?.title || ''}
                onChange={(e) =>
                  setPageOverrides((prev) => ({
                    ...prev,
                    [pg]: { ...prev[pg], title: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-[#111114] border border-white/10 text-xs"
              />
              <textarea
                rows={2}
                placeholder="Custom description (optional)"
                value={pageOverrides[pg]?.description || ''}
                onChange={(e) =>
                  setPageOverrides((prev) => ({
                    ...prev,
                    [pg]: { ...prev[pg], description: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-[#111114] border border-white/10 text-xs"
              />
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}

/* 3. DESIGN CUSTOMIZATION WITH LIVE PREVIEW (/admin/design) */
function DesignInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [design, setDesign] = useState({
    accentGoldHex: '#D4B475',
    primaryBgHex: '#070708',
    secondaryBgHex: '#111114',
    textColorHex: '#F5F2EB',
    headingFont: 'cormorant' as 'cormorant' | 'playfair' | 'jakarta',
    bodyFont: 'jakarta' as 'jakarta' | 'inter' | 'system',
    themeMode: 'dark' as 'dark' | 'light',
    buttonStyle: 'sweep' as 'sweep' | 'solid' | 'outline',
    borderRadiusStyle: 'rounded' as 'sharp' | 'rounded' | 'soft',
    sectionSpacing: 'standard' as 'compact' | 'standard' | 'airy',
    headerStyle: 'glass' as 'glass' | 'solid' | 'minimal',
    footerStyle: 'editorial' as 'editorial' | 'compact',
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!adminData) return;
    const s = adminData.settings;
    setDesign({
      accentGoldHex: s.accentGoldHex || '#D4B475',
      primaryBgHex: s.primaryBgHex || '#070708',
      secondaryBgHex: s.secondaryBgHex || '#111114',
      textColorHex: s.textColorHex || '#F5F2EB',
      headingFont: s.headingFont || 'cormorant',
      bodyFont: s.bodyFont || 'jakarta',
      themeMode: s.themeMode || 'dark',
      buttonStyle: s.buttonStyle || 'sweep',
      borderRadiusStyle: s.borderRadiusStyle || 'rounded',
      sectionSpacing: s.sectionSpacing || 'standard',
      headerStyle: s.headerStyle || 'glass',
      footerStyle: s.footerStyle || 'editorial',
    });
  }, [adminData]);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading design system...</div>;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveDocument('site_settings', 'main', {
        ...adminData.settings,
        ...design,
      });
      await logAdminActivity(user?.email, 'settings_change', 'design_settings', 'main', 'Updated visual design tokens & typography');
      await reloadAdmin();
      setNotice('Design tokens published to live website.');
    } finally {
      setSaving(false);
    }
  };

  const radiusCss =
    design.borderRadiusStyle === 'sharp'
      ? '0px'
      : design.borderRadiusStyle === 'soft'
      ? '24px'
      : '14px';

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4B475]">Visual System</p>
          <h1 className="font-serif text-3xl font-semibold">Design Customization &amp; Live Preview</h1>
        </div>
        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">
          {saving ? 'Publishing...' : 'Publish Design Settings'}
        </button>
      </div>

      <AdminNoticeBanner message={notice} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] text-[#8C8A84] mb-1">Accent Color</label>
              <input type="color" value={design.accentGoldHex} onChange={(e) => setDesign({ ...design, accentGoldHex: e.target.value })} className="w-full h-10 rounded bg-transparent cursor-pointer" />
            </div>
            <div>
              <label className="block text-[11px] text-[#8C8A84] mb-1">Primary Bg</label>
              <input type="color" value={design.primaryBgHex} onChange={(e) => setDesign({ ...design, primaryBgHex: e.target.value })} className="w-full h-10 rounded bg-transparent cursor-pointer" />
            </div>
            <div>
              <label className="block text-[11px] text-[#8C8A84] mb-1">Secondary Bg</label>
              <input type="color" value={design.secondaryBgHex} onChange={(e) => setDesign({ ...design, secondaryBgHex: e.target.value })} className="w-full h-10 rounded bg-transparent cursor-pointer" />
            </div>
            <div>
              <label className="block text-[11px] text-[#8C8A84] mb-1">Text Color</label>
              <input type="color" value={design.textColorHex} onChange={(e) => setDesign({ ...design, textColorHex: e.target.value })} className="w-full h-10 rounded bg-transparent cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Heading Typography</label>
              <select value={design.headingFont} onChange={(e) => setDesign({ ...design, headingFont: e.target.value as 'cormorant' | 'playfair' | 'jakarta' })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs">
                <option value="cormorant">Cormorant Garamond (Editorial Serif)</option>
                <option value="playfair">Playfair Display</option>
                <option value="jakarta">Plus Jakarta Sans (Geometric Sans)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Body Typography</label>
              <select value={design.bodyFont} onChange={(e) => setDesign({ ...design, bodyFont: e.target.value as 'jakarta' | 'inter' | 'system' })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs">
                <option value="jakarta">Plus Jakarta Sans</option>
                <option value="inter">Inter</option>
                <option value="system">System UI</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Theme Mode</label>
              <select value={design.themeMode} onChange={(e) => setDesign({ ...design, themeMode: e.target.value as 'dark' | 'light' })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs">
                <option value="dark">Obsidian Luxury Dark</option>
                <option value="light">Warm Editorial Light</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Button Style</label>
              <select value={design.buttonStyle} onChange={(e) => setDesign({ ...design, buttonStyle: e.target.value as 'sweep' | 'solid' | 'outline' })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs">
                <option value="sweep">Gold Accent Sweep</option>
                <option value="solid">Solid Fill</option>
                <option value="outline">Minimal Bordered</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Border Radius Scale</label>
              <select value={design.borderRadiusStyle} onChange={(e) => setDesign({ ...design, borderRadiusStyle: e.target.value as 'sharp' | 'rounded' | 'soft' })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs">
                <option value="sharp">Sharp Editorial (0px)</option>
                <option value="rounded">Balanced (16px)</option>
                <option value="soft">Soft Pill (24px)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Section Spacing</label>
              <select value={design.sectionSpacing} onChange={(e) => setDesign({ ...design, sectionSpacing: e.target.value as 'compact' | 'standard' | 'airy' })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs">
                <option value="compact">Compact</option>
                <option value="standard">Standard Editorial</option>
                <option value="airy">Airy Exhibition</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Header Style</label>
              <select value={design.headerStyle} onChange={(e) => setDesign({ ...design, headerStyle: e.target.value as 'glass' | 'solid' | 'minimal' })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs">
                <option value="glass">Glassmorphic Scrolled</option>
                <option value="solid">Solid Surface</option>
                <option value="minimal">Minimal Transparent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Footer Style</label>
              <select value={design.footerStyle} onChange={(e) => setDesign({ ...design, footerStyle: e.target.value as 'editorial' | 'compact' })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs">
                <option value="editorial">Editorial Full Footer</option>
                <option value="compact">Compact Single-Row</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Design Preview Card */}
        <div className="lg:col-span-5 space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4B475]">Live Interactive Preview</p>
          <div
            style={{
              backgroundColor: design.themeMode === 'light' ? '#F6F4EF' : design.primaryBgHex,
              color: design.themeMode === 'light' ? '#141417' : design.textColorHex,
              borderRadius: radiusCss,
            }}
            className="p-6 border border-white/15 space-y-5 transition-all"
          >
            <span style={{ color: design.accentGoldHex }} className="text-[11px] font-mono uppercase tracking-[0.2em]">
              Portfolio Preview Card
            </span>
            <h3
              style={{
                fontFamily:
                  design.headingFont === 'playfair'
                    ? '"Playfair Display", Georgia, serif'
                    : design.headingFont === 'jakarta'
                    ? '"Plus Jakarta Sans", sans-serif'
                    : '"Cormorant Garamond", Georgia, serif',
              }}
              className="text-3xl font-semibold leading-tight"
            >
              {adminData.profile.fullName}
            </h3>
            <div
              style={{
                backgroundColor: design.themeMode === 'light' ? '#EBE7DE' : design.secondaryBgHex,
                borderRadius: radiusCss,
              }}
              className="p-4 border border-white/10 text-xs opacity-85 leading-relaxed"
            >
              Minimal luxury visual system paired with responsive typography and intelligent automation architecture.
            </div>
            <button
              type="button"
              style={{
                backgroundColor: design.buttonStyle === 'outline' ? 'transparent' : design.accentGoldHex,
                color: design.buttonStyle === 'outline' ? design.accentGoldHex : '#070708',
                border: `1px solid ${design.accentGoldHex}`,
                borderRadius: radiusCss,
              }}
              className="px-4 py-2 text-xs font-semibold"
            >
              Primary CTA Preview
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* 4. SECURITY SETTINGS (/admin/security) */
function SecurityInner() {
  const { user, logout, idleMinutes, setIdleMinutes, getIdToken } = useAuth();
  const { adminData, loading, reloadAdmin } = useAdminData();
  const [timeoutInput, setTimeoutInput] = useState(idleMinutes);
  const [serverVerified, setServerVerified] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setTimeoutInput(idleMinutes);
  }, [idleMinutes]);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading security panel...</div>;

  const verifyBackendToken = async () => {
    const token = await getIdToken();
    const resp = await fetch('/api/admin/verify-session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await resp.json();
    setServerVerified(
      resp.ok ? `Verified server session for ${res.email}` : `Verification failed: ${res.error}`
    );
  };

  const saveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdleMinutes(timeoutInput);
    await saveDocument('site_settings', 'main', {
      ...adminData.settings,
      sessionTimeoutMinutes: timeoutInput,
    });
    await logAdminActivity(user?.email, 'settings_change', 'security', 'main', `Updated idle session timeout to ${timeoutInput} minutes`);
    await reloadAdmin();
    setNotice('Session security preferences updated.');
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4B475]">Zero-Trust Access</p>
        <h1 className="font-serif text-3xl font-semibold">Security &amp; Session Controls</h1>
      </div>

      <AdminNoticeBanner message={notice} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-[#D4B475]">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="font-serif text-xl font-semibold">Authorized Administrator</h2>
          </div>
          <div className="text-xs space-y-2 text-[#8C8A84]">
            <p>Email: <span className="text-[#F5F2EB] font-mono">{user?.email}</span></p>
            <p>Email Verified: <span className="text-emerald-400">{user?.emailVerified ? 'Verified' : 'No'}</span></p>
            <p>Auth Provider: <span className="text-[#F5F2EB]">Firebase Auth (Google 2FA enforced at IdP)</span></p>
            <p>Database Isolation: <span className="text-[#F5F2EB]">Strict Firestore Eight-Pillars RBAC Rules</span></p>
            <p>Public Registration: <span className="text-emerald-400">Disabled</span></p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={verifyBackendToken}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/15 text-xs hover:border-[#D4B475]"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4B475]" /> Test Server Token Verification
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-500/30 text-xs text-rose-300"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out Session
            </button>
          </div>
          {serverVerified && <p className="text-xs font-mono text-emerald-300">{serverVerified}</p>}
        </div>

        <form onSubmit={saveSecurity} className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
          <h2 className="font-serif text-xl font-semibold text-[#D4B475]">Idle Session Timeout</h2>
          <p className="text-xs text-[#8C8A84]">
            Automatically sign out inactive admin sessions after the configured duration (5 – 1440 minutes).
          </p>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Timeout (minutes)</label>
            <input
              type="number"
              min={5}
              max={1440}
              value={timeoutInput}
              onChange={(e) => setTimeoutInput(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">
            Save Timeout Policy
          </button>
        </form>
      </div>
    </div>
  );
}

/* 5. ACTIVITY LOGS (/admin/logs) */
function LogsInner() {
  const { adminData, loading } = useAdminData();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading activity logs...</div>;

  const filtered = adminData.activityLogs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.summary.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q) ||
        log.actorEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4B475]">Immutable Audit Trail</p>
        <h1 className="font-serif text-3xl font-semibold">Admin Activity Logs</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111114] border border-white/10">
          <Search className="w-4 h-4 text-[#8C8A84]" />
          <input
            type="text"
            placeholder="Search audit events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-[#F5F2EB] focus:outline-none"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#111114] border border-white/10 text-xs text-[#F5F2EB]"
        >
          <option value="all">All Actions</option>
          {['login', 'logout', 'create', 'update', 'delete', 'publish', 'media_upload', 'settings_change', 'restore_version', 'backup_export'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl bg-[#111114] border border-white/10 divide-y divide-white/8 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-8 text-sm text-[#8C8A84]">No activity log entries recorded yet.</p>
        ) : (
          filtered.map((log) => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-sm text-[#F5F2EB]">{log.summary}</p>
                <p className="text-[11px] font-mono text-[#8C8A84] mt-0.5">
                  {log.actorEmail} · {log.entityType}/{log.entityId}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-2 py-0.5 rounded bg-[#D4B475]/15 text-[#D4B475] text-[10px] font-mono uppercase">
                  {log.action}
                </span>
                <p className="text-[11px] text-[#8C8A84] mt-1">{formatFirestoreTime(log.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminNavigationPage() { return <AdminLayout><NavigationInner /></AdminLayout>; }
export function AdminSeoPage() { return <AdminLayout><SeoInner /></AdminLayout>; }
export function AdminDesignPage() { return <AdminLayout><DesignInner /></AdminLayout>; }
export function AdminSecurityPage() { return <AdminLayout><SecurityInner /></AdminLayout>; }
export function AdminLogsPage() { return <AdminLayout><LogsInner /></AdminLayout>; }
