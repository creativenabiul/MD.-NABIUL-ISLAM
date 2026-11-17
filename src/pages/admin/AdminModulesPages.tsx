import { useState } from 'react';
import { Plus, Trash2, Edit3, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logAdminActivity, removeDocument, saveDocument, slugifyId } from '../../lib/portfolioService';
import type {
  AchievementItem,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ServiceItem,
  SkillItem,
  StatisticItem,
  TestimonialItem,
} from '../../types/portfolio';
import { AdminNoticeBanner, ConfirmModal, MediaField } from '../../components/admin/AdminUi';
import { AdminLayout, useAdminData } from './AdminLayout';

/* 1. SERVICES */
function ServicesInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [deliverablesText, setDeliverablesText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading services...</div>;

  const openNew = () => {
    setEditing({
      id: 'NEW',
      title: '',
      category: 'Design & Strategy',
      iconName: 'Layers',
      imageUrl: '',
      description: '',
      deliverables: [],
      sortOrder: adminData.services.length + 1,
      status: 'published',
    });
    setDeliverablesText('');
  };

  const openEdit = (item: ServiceItem) => {
    setEditing({
      ...item,
      category: item.category || '',
      iconName: item.iconName || '',
      imageUrl: item.imageUrl || '',
    });
    setDeliverablesText((item.deliverables || []).join('\n'));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const deliverables = deliverablesText.split('\n').map((s) => s.trim()).filter(Boolean);
    const isNew = editing.id === 'NEW';
    const id = isNew ? slugifyId('srv', editing.title) : editing.id;
    await saveDocument('services', id, { ...editing, deliverables });
    await logAdminActivity(user?.email, isNew ? 'create' : 'update', 'services', id, `Saved service "${editing.title}"`);
    setEditing(null);
    await reloadAdmin();
    setNotice('Service saved.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4B475]">Capabilities</p>
          <h1 className="font-serif text-3xl font-semibold">Services Management</h1>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      <AdminNoticeBanner message={notice} />

      {editing && (
        <form onSubmit={save} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" placeholder="Service Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Category (optional)" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Icon Name (e.g. Cpu, PenTool)" value={editing.iconName || ''} onChange={(e) => setEditing({ ...editing, iconName: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as 'published' | 'draft' })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <MediaField
            label="Service Image (optional)"
            value={editing.imageUrl || ''}
            media={adminData.media}
            acceptTypes={['image']}
            folder="services"
            onChange={(url) => setEditing({ ...editing, imageUrl: url })}
            onUploaded={reloadAdmin}
          />
          <textarea rows={2} placeholder="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          <textarea rows={4} placeholder="Deliverables (one per line)" value={deliverablesText} onChange={(e) => setDeliverablesText(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-[#8C8A84]">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">Save</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {adminData.services.map((s) => (
          <div key={s.id} className="p-4 rounded-xl bg-[#111114] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">{s.title} {s.category ? <span className="text-xs text-[#D4B475]">· {s.category}</span> : null}</p>
              <p className="text-xs text-[#8C8A84]">{s.deliverables.length} deliverables · {s.status}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(s)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs inline-flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
              <button onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Service?"
        message={`Delete "${deleteTarget?.title}" permanently?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await removeDocument('services', deleteTarget.id);
          await logAdminActivity(user?.email, 'delete', 'services', deleteTarget.id, `Deleted service "${deleteTarget.title}"`);
          setDeleteTarget(null);
          await reloadAdmin();
        }}
      />
    </div>
  );
}

/* 2. SKILLS */
function SkillsInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [editing, setEditing] = useState<SkillItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SkillItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading skills...</div>;

  const existingCategories = Array.from(
    new Set([
      'Graphic Design',
      'Social Media Marketing',
      'Digital Marketing',
      'AI and Automation',
      'Office Productivity',
      'Technology',
      ...adminData.skills.map((s) => s.category),
    ])
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = editing.id === 'NEW';
    const id = isNew ? slugifyId('sk', editing.name) : editing.id;
    const payload: Record<string, unknown> = {
      name: editing.name,
      category: editing.category,
      proficiencyLabel: editing.proficiencyLabel,
      description: editing.description || '',
      iconUrl: editing.iconUrl || '',
      hasLevel: editing.hasLevel,
      sortOrder: editing.sortOrder,
      status: editing.status,
    };
    if (editing.hasLevel && typeof editing.level === 'number') {
      payload.level = editing.level;
    }
    await saveDocument('skills', id, payload);
    await logAdminActivity(user?.email, isNew ? 'create' : 'update', 'skills', id, `Saved skill "${editing.name}"`);
    setEditing(null);
    await reloadAdmin();
    setNotice('Skill saved.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4B475]">Competencies</p>
          <h1 className="font-serif text-3xl font-semibold">Skills Matrix</h1>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: 'NEW',
              name: '',
              category: 'Graphic Design',
              proficiencyLabel: 'Applied',
              description: '',
              iconUrl: '',
              hasLevel: false,
              level: 80,
              sortOrder: adminData.skills.length + 1,
              status: 'published',
            })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Skill
        </button>
      </div>

      <AdminNoticeBanner message={notice} />

      {editing && (
        <form onSubmit={save} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Skill Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <div>
              <input
                list="skill-categories"
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                placeholder="Category"
                className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm"
                required
              />
              <datalist id="skill-categories">
                {existingCategories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <input type="text" placeholder="Proficiency Label (e.g. Primary Practice)" value={editing.proficiencyLabel} onChange={(e) => setEditing({ ...editing, proficiencyLabel: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <input type="text" placeholder="Short description (optional)" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          <MediaField
            label="Skill Icon / Badge Image (optional)"
            value={editing.iconUrl || ''}
            media={adminData.media}
            acceptTypes={['image']}
            folder="skills"
            onChange={(url) => setEditing({ ...editing, iconUrl: url })}
            onUploaded={reloadAdmin}
          />
          <div className="flex flex-wrap items-center gap-6">
            <label className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" checked={editing.hasLevel} onChange={(e) => setEditing({ ...editing, hasLevel: e.target.checked })} className="accent-[#D4B475]" />
              Show Percentage Bar
            </label>
            {editing.hasLevel && (
              <input type="number" min={0} max={100} value={editing.level ?? 80} onChange={(e) => setEditing({ ...editing, level: Number(e.target.value) })} className="w-24 px-3 py-1.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            )}
            <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as 'published' | 'draft' })} className="px-3 py-1.5 rounded-lg bg-[#070708] border border-white/12 text-sm">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-[#8C8A84]">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">Save</button>
          </div>
        </form>
      )}

      <div className="space-y-2.5">
        {adminData.skills.map((sk) => (
          <div key={sk.id} className="p-3.5 rounded-xl bg-[#111114] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{sk.name}</p>
              <p className="text-xs text-[#8C8A84]">{sk.category} · {sk.hasLevel ? `${sk.level}%` : sk.proficiencyLabel} · {sk.status}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(sk)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs">Edit</button>
              <button onClick={() => setDeleteTarget(sk)} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Skill?"
        message={`Remove "${deleteTarget?.name}" permanently from Firestore?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await removeDocument('skills', deleteTarget.id);
          await logAdminActivity(user?.email, 'delete', 'skills', deleteTarget.id, `Deleted skill "${deleteTarget.name}"`);
          setDeleteTarget(null);
          await reloadAdmin();
        }}
      />
    </div>
  );
}

/* 3. STATISTICS */
function StatisticsInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [editing, setEditing] = useState<StatisticItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StatisticItem | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading statistics...</div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = editing.id === 'NEW';
    const id = isNew ? slugifyId('stat', editing.label) : editing.id;
    await saveDocument('statistics', id, editing);
    await logAdminActivity(user?.email, isNew ? 'create' : 'update', 'statistics', id, `Saved statistic "${editing.label}"`);
    setEditing(null);
    await reloadAdmin();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= adminData.statistics.length) return;
    const a = adminData.statistics[idx];
    const b = adminData.statistics[target];
    await Promise.all([
      saveDocument('statistics', a.id, { ...a, sortOrder: target + 1 }),
      saveDocument('statistics', b.id, { ...b, sortOrder: idx + 1 }),
    ]);
    await reloadAdmin();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Statistics &amp; Counters</h1>
          <p className="text-xs text-[#8C8A84] mt-1">Only verified owner-supplied figures are displayed on the public site.</p>
        </div>
        <button onClick={() => setEditing({ id: 'NEW', value: 0, suffix: '+', label: '', description: '', isVisible: true, sortOrder: adminData.statistics.length + 1, status: 'published' })} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">
          <Plus className="w-4 h-4" /> Add Statistic
        </button>
      </div>

      {editing && (
        <form onSubmit={save} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="number" placeholder="Number" value={editing.value} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Suffix (+, %, K)" value={editing.suffix} onChange={(e) => setEditing({ ...editing, suffix: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Label" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
          </div>
          <input type="text" placeholder="Short description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" checked={editing.isVisible} onChange={(e) => setEditing({ ...editing, isVisible: e.target.checked })} className="accent-[#D4B475]" />
              Visible on public website
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-[#8C8A84]">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">Save</button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {adminData.statistics.map((st, idx) => (
          <div key={st.id} className="p-4 rounded-xl bg-[#111114] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <p className="font-serif text-xl text-[#D4B475] tabular-nums">{st.value}{st.suffix} — <span className="text-[#F5F2EB] font-sans text-sm">{st.label}</span></p>
              <p className="text-xs text-[#8C8A84]">{st.description}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-2 rounded-lg border border-white/10 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => move(idx, 1)} disabled={idx === adminData.statistics.length - 1} className="p-2 rounded-lg border border-white/10 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
              <button onClick={async () => { await saveDocument('statistics', st.id, { ...st, isVisible: !st.isVisible }); await reloadAdmin(); }} className="p-2 rounded-lg border border-white/15 text-xs" title="Toggle visibility">
                {st.isVisible ? <Eye className="w-3.5 h-3.5 text-[#D4B475]" /> : <EyeOff className="w-3.5 h-3.5 text-[#8C8A84]" />}
              </button>
              <button onClick={() => setEditing(st)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs">Edit</button>
              <button onClick={() => setDeleteTarget(st)} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Statistic?"
        message={`Remove "${deleteTarget?.label}" permanently?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await removeDocument('statistics', deleteTarget.id);
          await logAdminActivity(user?.email, 'delete', 'statistics', deleteTarget.id, `Deleted statistic "${deleteTarget.label}"`);
          setDeleteTarget(null);
          await reloadAdmin();
        }}
      />
    </div>
  );
}

/* 4. EXPERIENCE */
function ExperienceInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [expEdit, setExpEdit] = useState<ExperienceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExperienceItem | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading experience...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4B475]">Career &amp; Training</p>
          <h1 className="font-serif text-3xl font-semibold">Experience Timeline</h1>
        </div>
        <button
          onClick={() =>
            setExpEdit({
              id: 'NEW',
              role: '',
              organization: '',
              employmentType: 'Full-Time / Freelance',
              startDate: '',
              endDate: '',
              currentlyWorking: false,
              logoUrl: '',
              context: '',
              period: '',
              description: '',
              sortOrder: adminData.experiences.length + 1,
              status: 'published',
            })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Experience
        </button>
      </div>

      {expEdit && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const isNew = expEdit.id === 'NEW';
            const id = isNew ? slugifyId('exp', expEdit.role) : expEdit.id;
            await saveDocument('experiences', id, expEdit);
            await logAdminActivity(user?.email, isNew ? 'create' : 'update', 'experiences', id, `Saved experience "${expEdit.role}"`);
            setExpEdit(null);
            await reloadAdmin();
          }}
          className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Role / Position" value={expEdit.role} onChange={(e) => setExpEdit({ ...expEdit, role: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Organization / Institute" value={expEdit.organization} onChange={(e) => setExpEdit({ ...expEdit, organization: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Employment / Program Type" value={expEdit.employmentType || ''} onChange={(e) => setExpEdit({ ...expEdit, employmentType: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Context (e.g. ASSET Program — Level 3)" value={expEdit.context} onChange={(e) => setExpEdit({ ...expEdit, context: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Start Date" value={expEdit.startDate || ''} onChange={(e) => setExpEdit({ ...expEdit, startDate: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="End Date" disabled={Boolean(expEdit.currentlyWorking)} value={expEdit.currentlyWorking ? 'Present' : expEdit.endDate || ''} onChange={(e) => setExpEdit({ ...expEdit, endDate: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm disabled:opacity-50" />
            <input type="text" placeholder="Display Period Label" value={expEdit.period} onChange={(e) => setExpEdit({ ...expEdit, period: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <select value={expEdit.status} onChange={(e) => setExpEdit({ ...expEdit, status: e.target.value as 'published' | 'draft' })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" checked={Boolean(expEdit.currentlyWorking)} onChange={(e) => setExpEdit({ ...expEdit, currentlyWorking: e.target.checked })} className="accent-[#D4B475]" />
            <span>Currently working here</span>
          </label>
          <MediaField
            label="Organization Logo (optional)"
            value={expEdit.logoUrl || ''}
            media={adminData.media}
            acceptTypes={['image']}
            folder="logos"
            onChange={(url) => setExpEdit({ ...expEdit, logoUrl: url })}
            onUploaded={reloadAdmin}
          />
          <textarea rows={3} placeholder="Description" value={expEdit.description} onChange={(e) => setExpEdit({ ...expEdit, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setExpEdit(null)} className="px-4 py-2 text-xs text-[#8C8A84]">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">Save</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {adminData.experiences.map((exp) => (
          <div key={exp.id} className="p-4 rounded-xl bg-[#111114] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{exp.role} — <span className="text-[#D4B475]">{exp.organization}</span></p>
              <p className="text-xs text-[#8C8A84]">{exp.context || exp.employmentType} · {exp.period}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setExpEdit(exp)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs">Edit</button>
              <button onClick={() => setDeleteTarget(exp)} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Experience Entry?"
        message={`Delete "${deleteTarget?.role}" at "${deleteTarget?.organization}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await removeDocument('experiences', deleteTarget.id);
          await logAdminActivity(user?.email, 'delete', 'experiences', deleteTarget.id, `Deleted experience "${deleteTarget.role}"`);
          setDeleteTarget(null);
          await reloadAdmin();
        }}
      />
    </div>
  );
}

/* 5. ACHIEVEMENTS (/admin/achievements) */
function AchievementsInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [achEdit, setAchEdit] = useState<AchievementItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AchievementItem | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading achievements...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4B475]">Honors &amp; Leadership</p>
          <h1 className="font-serif text-3xl font-semibold">Achievements</h1>
        </div>
        <button
          onClick={() =>
            setAchEdit({
              id: 'NEW',
              title: '',
              organization: '',
              year: '',
              details: '',
              category: 'Competition',
              evidenceImageUrl: '',
              sortOrder: adminData.achievements.length + 1,
              status: 'published',
            })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Achievement
        </button>
      </div>

      {achEdit && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const isNew = achEdit.id === 'NEW';
            const id = isNew ? slugifyId('ach', achEdit.title) : achEdit.id;
            await saveDocument('achievements', id, achEdit);
            await logAdminActivity(user?.email, isNew ? 'create' : 'update', 'achievements', id, `Saved achievement "${achEdit.title}"`);
            setAchEdit(null);
            await reloadAdmin();
          }}
          className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Achievement Title" value={achEdit.title} onChange={(e) => setAchEdit({ ...achEdit, title: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Issuing Organization / Event" value={achEdit.organization} onChange={(e) => setAchEdit({ ...achEdit, organization: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Year / Date" value={achEdit.year} onChange={(e) => setAchEdit({ ...achEdit, year: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Category (Competition, Leadership...)" value={achEdit.category} onChange={(e) => setAchEdit({ ...achEdit, category: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <MediaField
            label="Award / Evidence Image (optional)"
            value={achEdit.evidenceImageUrl || ''}
            media={adminData.media}
            acceptTypes={['image']}
            folder="achievements"
            onChange={(url) => setAchEdit({ ...achEdit, evidenceImageUrl: url })}
            onUploaded={reloadAdmin}
          />
          <textarea rows={2} placeholder="Details" value={achEdit.details} onChange={(e) => setAchEdit({ ...achEdit, details: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAchEdit(null)} className="px-4 py-2 text-xs text-[#8C8A84]">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">Save</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {adminData.achievements.map((ach) => (
          <div key={ach.id} className="p-4 rounded-xl bg-[#111114] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{ach.title} <span className="text-xs text-[#D4B475]">· {ach.year}</span></p>
              <p className="text-xs text-[#8C8A84]">{ach.details}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAchEdit(ach)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs">Edit</button>
              <button onClick={() => setDeleteTarget(ach)} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Achievement?"
        message={`Delete "${deleteTarget?.title}" permanently?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await removeDocument('achievements', deleteTarget.id);
          await logAdminActivity(user?.email, 'delete', 'achievements', deleteTarget.id, `Deleted achievement "${deleteTarget.title}"`);
          setDeleteTarget(null);
          await reloadAdmin();
        }}
      />
    </div>
  );
}

/* 6. EDUCATION */
function EducationInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [editing, setEditing] = useState<EducationItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EducationItem | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading education...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4B475]">Academic Background</p>
          <h1 className="font-serif text-3xl font-semibold">Education Timeline</h1>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: 'NEW',
              degree: '',
              institution: '',
              department: '',
              focusGroup: '',
              startYear: '',
              endYear: '',
              result: '',
              description: '',
              certificateUrl: '',
              focus: '',
              period: '',
              sortOrder: adminData.education.length + 1,
              status: 'published',
            })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Education
        </button>
      </div>

      {editing && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const isNew = editing.id === 'NEW';
            const id = isNew ? slugifyId('edu', editing.degree) : editing.id;
            await saveDocument('education', id, editing);
            await logAdminActivity(user?.email, isNew ? 'create' : 'update', 'education', id, `Saved education "${editing.degree}"`);
            setEditing(null);
            await reloadAdmin();
          }}
          className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Degree / Exam Name" value={editing.degree} onChange={(e) => setEditing({ ...editing, degree: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Institution" value={editing.institution} onChange={(e) => setEditing({ ...editing, institution: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Department / Subject" value={editing.department || ''} onChange={(e) => setEditing({ ...editing, department: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Focus / Group (e.g. Science)" value={editing.focus} onChange={(e) => setEditing({ ...editing, focus: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Start Year" value={editing.startYear || ''} onChange={(e) => setEditing({ ...editing, startYear: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="End Year" value={editing.endYear || ''} onChange={(e) => setEditing({ ...editing, endYear: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Result / GPA (optional)" value={editing.result || ''} onChange={(e) => setEditing({ ...editing, result: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Period Display Label" value={editing.period} onChange={(e) => setEditing({ ...editing, period: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <MediaField
            label="Certificate / Transcript Attachment (optional)"
            value={editing.certificateUrl || ''}
            media={adminData.media}
            acceptTypes={['image', 'document']}
            folder="education"
            onChange={(url) => setEditing({ ...editing, certificateUrl: url })}
            onUploaded={reloadAdmin}
          />
          <textarea rows={2} placeholder="Academic description / highlights" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-[#8C8A84]">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">Save</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {adminData.education.map((edu) => (
          <div key={edu.id} className="p-4 rounded-xl bg-[#111114] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{edu.degree}</p>
              <p className="text-xs text-[#8C8A84]">{edu.institution} · {edu.period} {edu.result ? `· ${edu.result}` : ''}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(edu)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs">Edit</button>
              <button onClick={() => setDeleteTarget(edu)} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Education Entry?"
        message={`Delete "${deleteTarget?.degree}" from "${deleteTarget?.institution}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await removeDocument('education', deleteTarget.id);
          await logAdminActivity(user?.email, 'delete', 'education', deleteTarget.id, `Deleted education "${deleteTarget.degree}"`);
          setDeleteTarget(null);
          await reloadAdmin();
        }}
      />
    </div>
  );
}

/* 7. CERTIFICATIONS */
function CertificationsInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [editing, setEditing] = useState<CertificationItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CertificationItem | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading certifications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4B475]">Credentials</p>
          <h1 className="font-serif text-3xl font-semibold">Certifications</h1>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: 'NEW',
              name: '',
              organization: '',
              issueDate: '',
              credentialId: '',
              imageUrl: '',
              verificationUrl: '',
              description: '',
              sortOrder: adminData.certifications.length + 1,
              status: 'published',
            })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Certification
        </button>
      </div>

      {editing && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const isNew = editing.id === 'NEW';
            const id = isNew ? slugifyId('cert', editing.name) : editing.id;
            await saveDocument('certifications', id, editing);
            await logAdminActivity(user?.email, isNew ? 'create' : 'update', 'certifications', id, `Saved certification "${editing.name}"`);
            setEditing(null);
            await reloadAdmin();
          }}
          className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Certification Title" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Issuing Organization" value={editing.organization} onChange={(e) => setEditing({ ...editing, organization: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Issue Date" value={editing.issueDate} onChange={(e) => setEditing({ ...editing, issueDate: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Credential ID (optional)" value={editing.credentialId} onChange={(e) => setEditing({ ...editing, credentialId: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="url" placeholder="Verification URL (optional)" value={editing.verificationUrl} onChange={(e) => setEditing({ ...editing, verificationUrl: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as 'published' | 'draft' })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <MediaField
            label="Certificate Image or PDF"
            value={editing.imageUrl}
            media={adminData.media}
            acceptTypes={['image', 'document']}
            folder="certifications"
            onChange={(url) => setEditing({ ...editing, imageUrl: url })}
            onUploaded={reloadAdmin}
          />
          <textarea rows={2} placeholder="Description / skills verified" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-[#8C8A84]">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">Save</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {adminData.certifications.map((cert) => (
          <div key={cert.id} className="p-4 rounded-xl bg-[#111114] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{cert.name}</p>
              <p className="text-xs text-[#8C8A84]">{cert.organization} {cert.credentialId ? `· ID: ${cert.credentialId}` : ''}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(cert)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs">Edit</button>
              <button onClick={() => setDeleteTarget(cert)} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Certification?"
        message={`Remove "${deleteTarget?.name}" permanently?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await removeDocument('certifications', deleteTarget.id);
          await logAdminActivity(user?.email, 'delete', 'certifications', deleteTarget.id, `Deleted certification "${deleteTarget.name}"`);
          setDeleteTarget(null);
          await reloadAdmin();
        }}
      />
    </div>
  );
}

/* 8. TESTIMONIALS */
function TestimonialsInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [editing, setEditing] = useState<TestimonialItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TestimonialItem | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading testimonials...</div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = editing.id === 'NEW';
    const id = isNew ? slugifyId('test', editing.name) : editing.id;
    const payload: Record<string, unknown> = {
      name: editing.name,
      position: editing.position,
      company: editing.company,
      imageUrl: editing.imageUrl,
      quote: editing.quote,
      hasRating: editing.hasRating,
      sortOrder: editing.sortOrder,
      status: editing.status,
    };
    if (editing.hasRating && typeof editing.rating === 'number') {
      payload.rating = editing.rating;
    }
    await saveDocument('testimonials', id, payload);
    await logAdminActivity(user?.email, isNew ? 'create' : 'update', 'testimonials', id, `Saved testimonial from "${editing.name}"`);
    setEditing(null);
    await reloadAdmin();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Testimonials</h1>
          <p className="text-xs text-[#8C8A84] mt-1">Only published genuine client testimonials render on the public site.</p>
        </div>
        <button onClick={() => setEditing({ id: 'NEW', name: '', position: '', company: '', imageUrl: '', quote: '', hasRating: false, rating: 5, sortOrder: adminData.testimonials.length + 1, status: 'published' })} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      {editing && (
        <form onSubmit={save} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Client Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Position / Title" value={editing.position} onChange={(e) => setEditing({ ...editing, position: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Company" value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <MediaField
            label="Client Photo (optional)"
            value={editing.imageUrl}
            media={adminData.media}
            acceptTypes={['image']}
            folder="testimonials"
            onChange={(url) => setEditing({ ...editing, imageUrl: url })}
            onUploaded={reloadAdmin}
          />
          <textarea rows={3} placeholder="Testimonial Quote" value={editing.quote} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
          <div className="flex flex-wrap items-center gap-6">
            <label className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" checked={editing.hasRating} onChange={(e) => setEditing({ ...editing, hasRating: e.target.checked })} className="accent-[#D4B475]" />
              Include Verified Rating
            </label>
            {editing.hasRating && (
              <input type="number" min={1} max={5} value={editing.rating ?? 5} onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })} className="w-20 px-3 py-1.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            )}
            <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as 'published' | 'draft' })} className="px-3 py-1.5 rounded-lg bg-[#070708] border border-white/12 text-sm">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs text-[#8C8A84]">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">Save</button>
          </div>
        </form>
      )}

      {adminData.testimonials.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#111114] border border-white/10 text-sm text-[#8C8A84]">
          No testimonials added yet. The testimonial carousel remains hidden on the public website until a verified testimonial is published.
        </div>
      ) : (
        <div className="space-y-3">
          {adminData.testimonials.map((t) => (
            <div key={t.id} className="p-4 rounded-xl bg-[#111114] border border-white/10 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t.name} <span className="text-xs text-[#8C8A84]">· {t.company}</span></p>
                <p className="text-xs text-[#8C8A84] mt-1 line-clamp-1">&ldquo;{t.quote}&rdquo;</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(t)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs">Edit</button>
                <button onClick={() => setDeleteTarget(t)} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Testimonial?"
        message={`Delete testimonial from "${deleteTarget?.name}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await removeDocument('testimonials', deleteTarget.id);
          await logAdminActivity(user?.email, 'delete', 'testimonials', deleteTarget.id, `Deleted testimonial "${deleteTarget.name}"`);
          setDeleteTarget(null);
          await reloadAdmin();
        }}
      />
    </div>
  );
}

export function AdminServicesPage() { return <AdminLayout><ServicesInner /></AdminLayout>; }
export function AdminSkillsPage() { return <AdminLayout><SkillsInner /></AdminLayout>; }
export function AdminStatisticsPage() { return <AdminLayout><StatisticsInner /></AdminLayout>; }
export function AdminExperiencePage() { return <AdminLayout><ExperienceInner /></AdminLayout>; }
export function AdminAchievementsPage() { return <AdminLayout><AchievementsInner /></AdminLayout>; }
export function AdminEducationPage() { return <AdminLayout><EducationInner /></AdminLayout>; }
export function AdminCertificationsPage() { return <AdminLayout><CertificationsInner /></AdminLayout>; }
export function AdminTestimonialsPage() { return <AdminLayout><TestimonialsInner /></AdminLayout>; }
