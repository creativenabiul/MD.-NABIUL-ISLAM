import { useState } from 'react';
import { Plus, Trash2, Edit3, Upload, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { removeDocument, saveDocument, slugifyId } from '../../lib/portfolioService';
import type { ProjectItem } from '../../types/portfolio';
import { AdminLayout, useAdminData } from './AdminLayout';

const EMPTY_PROJECT: Omit<ProjectItem, 'id'> = {
  slug: '',
  title: '',
  category: 'Branding',
  shortDescription: '',
  overview: '',
  objective: '',
  challenges: '',
  approach: '',
  designProcess: '',
  finalOutput: '',
  results: '',
  tools: [],
  coverImageUrl: '',
  galleryImages: [],
  liveUrl: '',
  sourceUrl: '',
  featured: false,
  status: 'published',
  sortOrder: 1,
};

function ProjectsInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { getIdToken } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ProjectItem, 'id'>>(EMPTY_PROJECT);
  const [toolsInput, setToolsInput] = useState('');
  const [galleryInput, setGalleryInput] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');

  if (loading || !adminData) {
    return <div className="text-sm text-[#8C8A84]">Loading projects...</div>;
  }

  const startCreate = () => {
    setEditingId('NEW');
    setForm({ ...EMPTY_PROJECT, sortOrder: adminData.projects.length + 1 });
    setToolsInput('');
    setGalleryInput('');
    setNotice('');
  };

  const startEdit = (proj: ProjectItem) => {
    setEditingId(proj.id);
    setForm({
      slug: proj.slug,
      title: proj.title,
      category: proj.category,
      shortDescription: proj.shortDescription,
      overview: proj.overview || '',
      objective: proj.objective || '',
      challenges: proj.challenges || '',
      approach: proj.approach || '',
      designProcess: proj.designProcess || '',
      finalOutput: proj.finalOutput || '',
      results: proj.results || '',
      tools: proj.tools || [],
      coverImageUrl: proj.coverImageUrl || '',
      galleryImages: proj.galleryImages || [],
      liveUrl: proj.liveUrl || '',
      sourceUrl: proj.sourceUrl || '',
      featured: proj.featured,
      status: proj.status,
      sortOrder: proj.sortOrder,
    });
    setToolsInput((proj.tools || []).join(', '));
    setGalleryInput((proj.galleryImages || []).join('\n'));
    setNotice('');
  };

  const uploadImage = async (file: File, target: 'cover' | 'gallery') => {
    setUploading(true);
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

      if (target === 'cover') {
        setForm((p) => ({ ...p, coverImageUrl: res.url }));
      } else {
        setGalleryInput((prev) => (prev ? `${prev}\n${res.url}` : res.url));
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      const cleanSlug = (form.slug || form.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const tools = toolsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const galleryImages = galleryInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const isNew = editingId === 'NEW';
      const docId = isNew ? slugifyId('proj', cleanSlug) : editingId!;
      await saveDocument(
        'projects',
        docId,
        {
          ...form,
          slug: cleanSlug,
          tools,
          galleryImages,
        },
        isNew
      );
      await reloadAdmin();
      setEditingId(null);
      setNotice('Project saved successfully.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed saving project.');
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const list = [...adminData.projects];
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const a = list[index];
    const b = list[targetIdx];
    await Promise.all([
      saveDocument('projects', a.id, { ...a, sortOrder: targetIdx + 1 }),
      saveDocument('projects', b.id, { ...b, sortOrder: index + 1 }),
    ]);
    await reloadAdmin();
  };

  const handleDelete = async (id: string) => {
    await removeDocument('projects', id);
    await reloadAdmin();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const slug = newCategoryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    await saveDocument('project_categories', slugifyId('cat', slug), {
      name: newCategoryName.trim(),
      slug,
      sortOrder: adminData.categories.length + 1,
    });
    setNewCategoryName('');
    await reloadAdmin();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">
            Portfolio
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold">Projects &amp; Categories</h1>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold hover:bg-[#E8D2A0]"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#141418] border border-[#D4B475]/40 text-xs text-[#E8D2A0]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {editingId && (
        <form
          onSubmit={handleSaveProject}
          className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-[#D4B475]">
              {editingId === 'NEW' ? 'Create Project' : 'Edit Project'}
            </h2>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="text-xs text-[#8C8A84] hover:text-[#F5F2EB]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Project Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">URL Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="auto-generated-from-title"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              >
                {adminData.categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'published' | 'draft' })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Short Description</label>
            <textarea
              rows={2}
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Overview</label>
              <textarea
                rows={3}
                value={form.overview}
                onChange={(e) => setForm({ ...form, overview: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Objective</label>
              <textarea
                rows={3}
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Challenges</label>
              <textarea
                rows={3}
                value={form.challenges}
                onChange={(e) => setForm({ ...form, challenges: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Creative Approach</label>
              <textarea
                rows={3}
                value={form.approach}
                onChange={(e) => setForm({ ...form, approach: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Design Process</label>
              <textarea
                rows={3}
                value={form.designProcess}
                onChange={(e) => setForm({ ...form, designProcess: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Final Output</label>
              <textarea
                rows={3}
                value={form.finalOutput}
                onChange={(e) => setForm({ ...form, finalOutput: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">
                Verified Results (leave blank if none)
              </label>
              <input
                type="text"
                value={form.results}
                onChange={(e) => setForm({ ...form, results: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">
                Tools Used (comma-separated)
              </label>
              <input
                type="text"
                value={toolsInput}
                onChange={(e) => setToolsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Live URL (optional)</label>
              <input
                type="url"
                value={form.liveUrl}
                onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Source Code URL (optional)</label>
              <input
                type="url"
                value={form.sourceUrl}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8C8A84] mb-1">Cover Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                  className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 text-xs cursor-pointer hover:border-[#D4B475]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? '...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'cover')}
                  />
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#8C8A84]">Gallery Image URLs (one per line)</label>
                <label className="text-xs text-[#D4B475] cursor-pointer hover:underline">
                  + Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'gallery')}
                  />
                </label>
              </div>
              <textarea
                rows={3}
                value={galleryInput}
                onChange={(e) => setGalleryInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="accent-[#D4B475]"
              />
              <span>Feature on Portfolio Showcase</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold hover:bg-[#E8D2A0]"
            >
              {saving ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </form>
      )}

      {/* Existing Projects List */}
      <div className="space-y-3">
        {adminData.projects.map((proj, idx) => (
          <div
            key={proj.id}
            className="p-4 rounded-xl bg-[#111114] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              {proj.coverImageUrl && (
                <img
                  src={proj.coverImageUrl}
                  alt={proj.title}
                  className="w-16 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="font-medium text-sm text-[#F5F2EB] truncate">{proj.title}</p>
                <p className="text-xs text-[#8C8A84] truncate">
                  {proj.category} · {proj.status} {proj.featured ? '· Featured' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleMove(idx, -1)}
                disabled={idx === 0}
                aria-label="Move up"
                className="p-2 rounded-lg border border-white/10 hover:border-[#D4B475] disabled:opacity-30"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMove(idx, 1)}
                disabled={idx === adminData.projects.length - 1}
                aria-label="Move down"
                className="p-2 rounded-lg border border-white/10 hover:border-[#D4B475] disabled:opacity-30"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => startEdit(proj)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/15 text-xs hover:border-[#D4B475]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(proj.id)}
                aria-label="Delete project"
                className="p-2 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-950/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Category Manager */}
      <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
        <h2 className="font-serif text-xl font-semibold">Project Categories</h2>
        <div className="flex flex-wrap gap-2">
          {adminData.categories.map((c) => (
            <div
              key={c.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#070708] border border-white/10 text-xs"
            >
              <span>{c.name}</span>
              <button
                type="button"
                onClick={async () => {
                  await removeDocument('project_categories', c.id);
                  await reloadAdmin();
                }}
                aria-label={`Remove ${c.name}`}
                className="text-rose-400 hover:text-rose-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddCategory} className="flex gap-2 max-w-sm">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Add category..."
            className="flex-1 px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminProjectsPage() {
  return (
    <AdminLayout>
      <ProjectsInner />
    </AdminLayout>
  );
}
