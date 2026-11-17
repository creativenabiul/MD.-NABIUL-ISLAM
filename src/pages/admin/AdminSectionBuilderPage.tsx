import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  logAdminActivity,
  removeDocument,
  saveContentVersion,
  saveDocument,
  slugifyId,
} from '../../lib/portfolioService';
import { parseSectionBlocks } from '../../lib/assetUrl';
import type {
  ContentBlockType,
  SectionContentBlock,
  SectionTemplateType,
  WebsiteSectionItem,
} from '../../types/portfolio';
import { AdminNoticeBanner, ConfirmModal, MediaField } from '../../components/admin/AdminUi';
import { AdminLayout, useAdminData } from './AdminLayout';

const TEMPLATES: Array<{ value: SectionTemplateType; label: string }> = [
  { value: 'editorial_text', label: 'Editorial Split / Text' },
  { value: 'feature_cards', label: 'Feature Cards Grid' },
  { value: 'stats_grid', label: 'Metric Highlights Grid' },
  { value: 'media_showcase', label: 'Media / Video Showcase' },
  { value: 'gallery_grid', label: 'Visual Gallery Grid' },
  { value: 'cta_banner', label: 'Editorial CTA Banner' },
  { value: 'list_highlights', label: 'Structured Bullet Highlights' },
];

const BLOCK_TYPES: Array<{ value: ContentBlockType; label: string }> = [
  { value: 'text', label: 'Text Paragraph' },
  { value: 'card', label: 'Feature Card' },
  { value: 'image', label: 'Image Block' },
  { value: 'video', label: 'Video Block' },
  { value: 'button', label: 'Primary Button' },
  { value: 'link', label: 'Text Link' },
  { value: 'list', label: 'Bullet List' },
  { value: 'stat', label: 'Statistic Counter' },
];

function SectionBuilderInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();

  const [editing, setEditing] = useState<WebsiteSectionItem | null>(null);
  const [blocks, setBlocks] = useState<SectionContentBlock[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebsiteSectionItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading custom sections...</div>;

  const openNew = () => {
    setEditing({
      id: 'NEW',
      title: '',
      subtitle: 'Custom Section',
      description: '',
      template: 'feature_cards',
      blocksJson: '[]',
      backgroundTone: 'obsidian',
      isVisible: true,
      sortOrder: adminData.websiteSections.length + 1,
      status: 'published',
    });
    setBlocks([
      {
        id: slugifyId('blk', 'card'),
        type: 'card',
        title: 'Example Structured Card',
        body: 'Customize this structured content card or add image, video, button, link, list, or stat blocks.',
      },
    ]);
  };

  const openEdit = (sec: WebsiteSectionItem) => {
    setEditing(sec);
    setBlocks(parseSectionBlocks(sec.blocksJson));
  };

  const saveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = editing.id === 'NEW';
    const id = isNew ? slugifyId('sec', editing.title) : editing.id;
    if (!isNew) {
      await saveContentVersion('section', id, `${editing.title} (before edit)`, editing, user?.email);
    }
    await saveDocument(
      'website_sections',
      id,
      {
        title: editing.title,
        subtitle: editing.subtitle,
        description: editing.description,
        template: editing.template,
        blocksJson: JSON.stringify(blocks),
        backgroundTone: editing.backgroundTone,
        isVisible: editing.isVisible,
        sortOrder: editing.sortOrder,
        status: editing.status,
      },
      isNew
    );
    await logAdminActivity(user?.email, isNew ? 'create' : 'update', 'website_sections', id, `Saved custom section "${editing.title}" (${editing.status})`);
    setEditing(null);
    await reloadAdmin();
    setNotice('Custom website section saved.');
  };

  const reorderSections = async (from: number, to: number) => {
    if (from === to || to < 0 || to >= adminData.websiteSections.length) return;
    const copy = [...adminData.websiteSections];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    await Promise.all(
      copy.map((item, idx) => saveDocument('website_sections', item.id, { ...item, sortOrder: idx + 1 }))
    );
    await logAdminActivity(user?.email, 'update', 'website_sections', moved.id, `Reordered section "${moved.title}"`);
    await reloadAdmin();
  };

  const duplicateSection = async (sec: WebsiteSectionItem) => {
    const id = slugifyId('sec', `${sec.title}-copy`);
    await saveDocument(
      'website_sections',
      id,
      {
        title: `${sec.title} (Copy)`,
        subtitle: sec.subtitle,
        description: sec.description,
        template: sec.template,
        blocksJson: sec.blocksJson,
        backgroundTone: sec.backgroundTone,
        isVisible: sec.isVisible,
        sortOrder: adminData.websiteSections.length + 1,
        status: 'draft',
      },
      true
    );
    await logAdminActivity(user?.email, 'create', 'website_sections', id, `Duplicated section "${sec.title}"`);
    await reloadAdmin();
    setNotice(`Duplicated "${sec.title}" as draft.`);
  };

  const addBlock = (type: ContentBlockType) => {
    setBlocks((prev) => [
      ...prev,
      {
        id: slugifyId('blk', type),
        type,
        title: type === 'stat' ? 'Verified Stat' : type === 'button' ? 'Action Label' : '',
        body: '',
        mediaUrl: '',
        href: type === 'button' || type === 'link' ? '/projects' : '',
        linkLabel: type === 'button' || type === 'link' ? 'Explore More' : '',
        items: type === 'list' ? ['First highlight point', 'Second highlight point'] : undefined,
        statValue: type === 'stat' ? '100%' : undefined,
        statLabel: type === 'stat' ? 'Metric Label' : undefined,
      },
    ]);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">Dynamic CMS</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold">Custom Website Section Builder</h1>
          <p className="text-xs text-[#8C8A84] mt-1">
            Drag and drop sections to reorder how custom blocks appear on your homepage. Built with structured, XSS-safe templates.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold hover:bg-[#E8D2A0]"
        >
          <Plus className="w-4 h-4" /> Create Section
        </button>
      </div>

      <AdminNoticeBanner message={notice} />

      {editing && (
        <form onSubmit={saveSection} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-[#D4B475]">
              {editing.id === 'NEW' ? 'Build New Website Section' : `Editing: ${editing.title}`}
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPreviewMode((p) => !p)}
                className="px-3 py-1.5 rounded-lg border border-white/15 text-xs text-[#D4B475]"
              >
                {previewMode ? 'Edit Fields' : 'Preview Layout'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="text-xs text-[#8C8A84] hover:text-[#F5F2EB]">
                Cancel
              </button>
            </div>
          </div>

          {previewMode ? (
            <div className="p-6 rounded-xl bg-[#070708] border border-white/15 space-y-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#D4B475]">{editing.subtitle}</p>
              <h3 className="font-serif text-3xl text-[#F5F2EB]">{editing.title || 'Untitled Section'}</h3>
              {editing.description && <p className="text-sm text-[#8C8A84] max-w-2xl">{editing.description}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {blocks.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl bg-[#111114] border border-white/10">
                    <span className="text-[10px] font-mono uppercase text-[#D4B475]">{b.type}</span>
                    {b.title && <p className="font-medium text-sm text-[#F5F2EB] mt-1">{b.title}</p>}
                    {b.statValue && <p className="font-serif text-2xl text-[#D4B475]">{b.statValue}</p>}
                    {b.body && <p className="text-xs text-[#8C8A84] mt-1">{b.body}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#8C8A84] mb-1">Section Title</label>
                  <input type="text" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-[#8C8A84] mb-1">Eyebrow / Subtitle</label>
                  <input type="text" value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-[#8C8A84] mb-1">Template Style</label>
                  <select value={editing.template} onChange={(e) => setEditing({ ...editing, template: e.target.value as SectionTemplateType })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm">
                    {TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#8C8A84] mb-1">Section Introduction / Description</label>
                <textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#8C8A84] mb-1">Background Tone</label>
                  <select value={editing.backgroundTone} onChange={(e) => setEditing({ ...editing, backgroundTone: e.target.value as 'obsidian' | 'charcoal' | 'accent' })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm">
                    <option value="obsidian">Obsidian (#070708)</option>
                    <option value="charcoal">Charcoal (#111114)</option>
                    <option value="accent">Champagne AccentTint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#8C8A84] mb-1">Publish Status</label>
                  <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as 'published' | 'draft' })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm">
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={editing.isVisible} onChange={(e) => setEditing({ ...editing, isVisible: e.target.checked })} className="accent-[#D4B475]" />
                    <span>Visible on Public Page</span>
                  </label>
                </div>
              </div>

              {/* Content Blocks */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-mono uppercase tracking-[0.15em] text-[#D4B475]">
                    Structured Content Blocks ({blocks.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {BLOCK_TYPES.map((bt) => (
                      <button
                        key={bt.value}
                        type="button"
                        onClick={() => addBlock(bt.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#070708] border border-white/12 text-[11px] hover:border-[#D4B475]"
                      >
                        + {bt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {blocks.map((blk, idx) => (
                    <div key={blk.id} className="p-4 rounded-xl bg-[#070708] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase text-[#D4B475]">
                          #{idx + 1} · {blk.type}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const next = [...blocks];
                              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                              setBlocks(next);
                            }}
                            className="p-1.5 rounded border border-white/10 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === blocks.length - 1}
                            onClick={() => {
                              const next = [...blocks];
                              [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                              setBlocks(next);
                            }}
                            className="p-1.5 rounded border border-white/10 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setBlocks((p) => p.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded border border-rose-500/30 text-rose-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Block Title"
                          value={blk.title || ''}
                          onChange={(e) => setBlocks((p) => p.map((b, i) => (i === idx ? { ...b, title: e.target.value } : b)))}
                          className="px-3 py-2 rounded-lg bg-[#111114] border border-white/10 text-xs"
                        />
                        {(blk.type === 'button' || blk.type === 'link') && (
                          <input
                            type="text"
                            placeholder="Link URL (/projects or https://...)"
                            value={blk.href || ''}
                            onChange={(e) => setBlocks((p) => p.map((b, i) => (i === idx ? { ...b, href: e.target.value } : b)))}
                            className="px-3 py-2 rounded-lg bg-[#111114] border border-white/10 text-xs"
                          />
                        )}
                        {blk.type === 'stat' && (
                          <>
                            <input
                              type="text"
                              placeholder="Stat Value (e.g. 99%)"
                              value={blk.statValue || ''}
                              onChange={(e) => setBlocks((p) => p.map((b, i) => (i === idx ? { ...b, statValue: e.target.value } : b)))}
                              className="px-3 py-2 rounded-lg bg-[#111114] border border-white/10 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Stat Label"
                              value={blk.statLabel || ''}
                              onChange={(e) => setBlocks((p) => p.map((b, i) => (i === idx ? { ...b, statLabel: e.target.value } : b)))}
                              className="px-3 py-2 rounded-lg bg-[#111114] border border-white/10 text-xs"
                            />
                          </>
                        )}
                      </div>

                      {(blk.type === 'image' || blk.type === 'video' || blk.type === 'card') && (
                        <MediaField
                          label={blk.type === 'video' ? 'Video URL' : 'Image URL (optional)'}
                          value={blk.mediaUrl || ''}
                          media={adminData.media}
                          acceptTypes={blk.type === 'video' ? ['video'] : ['image']}
                          folder="sections"
                          onChange={(url) => setBlocks((p) => p.map((b, i) => (i === idx ? { ...b, mediaUrl: url } : b)))}
                          onUploaded={reloadAdmin}
                        />
                      )}

                      {blk.type === 'list' ? (
                        <textarea
                          rows={3}
                          placeholder="List items (one per line)"
                          value={(blk.items || []).join('\n')}
                          onChange={(e) =>
                            setBlocks((p) =>
                              p.map((b, i) =>
                                i === idx
                                  ? { ...b, items: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) }
                                  : b
                              )
                            )
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#111114] border border-white/10 text-xs"
                        />
                      ) : (
                        <textarea
                          rows={2}
                          placeholder="Body text / caption"
                          value={blk.body || ''}
                          onChange={(e) => setBlocks((p) => p.map((b, i) => (i === idx ? { ...b, body: e.target.value } : b)))}
                          className="w-full px-3 py-2 rounded-lg bg-[#111114] border border-white/10 text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-[#8C8A84]">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold hover:bg-[#E8D2A0]">
              Save Section
            </button>
          </div>
        </form>
      )}

      {/* Drag & Drop Custom Sections List */}
      <div className="space-y-3">
        {adminData.websiteSections.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#111114] border border-white/10 text-sm text-[#8C8A84]">
            No custom website sections created yet. Click “Create Section” above to add new dynamic editorial sections, galleries, banners, or showcases to your homepage.
          </div>
        ) : (
          adminData.websiteSections.map((sec, idx) => (
            <div
              key={sec.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null) {
                  void reorderSections(dragIdx, idx);
                  setDragIdx(null);
                }
              }}
              className="p-4 rounded-xl bg-[#111114] border border-white/10 hover:border-[#D4B475]/40 flex flex-wrap items-center justify-between gap-4 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-3 min-w-0">
                <GripVertical className="w-4 h-4 text-[#8C8A84] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#F5F2EB] truncate">{sec.title}</p>
                  <p className="text-xs text-[#8C8A84]">
                    Template: {sec.template} · {sec.status} · {sec.isVisible ? 'Visible' : 'Hidden'} · Order #{idx + 1}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => reorderSections(idx, idx - 1)}
                  disabled={idx === 0}
                  className="p-2 rounded-lg border border-white/10 disabled:opacity-30"
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => reorderSections(idx, idx + 1)}
                  disabled={idx === adminData.websiteSections.length - 1}
                  className="p-2 rounded-lg border border-white/10 disabled:opacity-30"
                  title="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await saveDocument('website_sections', sec.id, { ...sec, isVisible: !sec.isVisible });
                    await reloadAdmin();
                  }}
                  className="p-2 rounded-lg border border-white/10"
                  title="Toggle visibility"
                >
                  {sec.isVisible ? <Eye className="w-3.5 h-3.5 text-[#D4B475]" /> : <EyeOff className="w-3.5 h-3.5 text-[#8C8A84]" />}
                </button>
                <button
                  type="button"
                  onClick={() => duplicateSection(sec)}
                  className="p-2 rounded-lg border border-white/10"
                  title="Duplicate section"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(sec)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/15 text-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(sec)}
                  className="p-2 rounded-lg border border-rose-500/30 text-rose-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Custom Section?"
        message={`Permanently delete "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await removeDocument('website_sections', deleteTarget.id);
          await logAdminActivity(user?.email, 'delete', 'website_sections', deleteTarget.id, `Deleted custom section "${deleteTarget.title}"`);
          setDeleteTarget(null);
          await reloadAdmin();
        }}
      />
    </div>
  );
}

export function AdminSectionBuilderPage() {
  return (
    <AdminLayout>
      <SectionBuilderInner />
    </AdminLayout>
  );
}
