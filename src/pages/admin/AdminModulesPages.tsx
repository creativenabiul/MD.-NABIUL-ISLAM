import { useState } from 'react';
import { Plus, Trash2, Edit3, Eye, EyeOff } from 'lucide-react';
import { removeDocument, saveDocument, slugifyId } from '../../lib/portfolioService';
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
import { AdminLayout, useAdminData } from './AdminLayout';

/* 1. SERVICES */
function ServicesInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [deliverablesText, setDeliverablesText] = useState('');

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading services...</div>;

  const openNew = () => {
    setEditing({
      id: 'NEW',
      title: '',
      description: '',
      deliverables: [],
      sortOrder: adminData.services.length + 1,
      status: 'published',
    });
    setDeliverablesText('');
  };

  const openEdit = (item: ServiceItem) => {
    setEditing(item);
    setDeliverablesText((item.deliverables || []).join('\n'));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const deliverables = deliverablesText.split('\n').map((s) => s.trim()).filter(Boolean);
    const id = editing.id === 'NEW' ? slugifyId('srv', editing.title) : editing.id;
    await saveDocument('services', id, { ...editing, deliverables });
    setEditing(null);
    await reloadAdmin();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold">Services</h1>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {editing && (
        <form onSubmit={save} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Service Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="number" placeholder="Order" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as 'published' | 'draft' })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
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
              <p className="font-medium text-sm">{s.title}</p>
              <p className="text-xs text-[#8C8A84]">{s.deliverables.length} deliverables · {s.status}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(s)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs inline-flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
              <button onClick={async () => { await removeDocument('services', s.id); await reloadAdmin(); }} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 2. SKILLS */
function SkillsInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const [editing, setEditing] = useState<SkillItem | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading skills...</div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const id = editing.id === 'NEW' ? slugifyId('sk', editing.name) : editing.id;
    const payload: Record<string, unknown> = {
      name: editing.name,
      category: editing.category,
      proficiencyLabel: editing.proficiencyLabel,
      hasLevel: editing.hasLevel,
      sortOrder: editing.sortOrder,
      status: editing.status,
    };
    if (editing.hasLevel && typeof editing.level === 'number') {
      payload.level = editing.level;
    }
    await saveDocument('skills', id, payload);
    setEditing(null);
    await reloadAdmin();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold">Skills Matrix</h1>
        <button onClick={() => setEditing({ id: 'NEW', name: '', category: 'Graphic Design', proficiencyLabel: 'Applied', hasLevel: false, level: 80, sortOrder: adminData.skills.length + 1, status: 'published' })} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">
          <Plus className="w-4 h-4" /> Add Skill
        </button>
      </div>

      {editing && (
        <form onSubmit={save} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Skill Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm">
              {['Graphic Design', 'Social Media Marketing', 'Digital Marketing', 'AI and Automation', 'Office Productivity', 'Technology'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" placeholder="Label (e.g. Primary Practice)" value={editing.proficiencyLabel} onChange={(e) => setEditing({ ...editing, proficiencyLabel: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
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
              <button onClick={async () => { await removeDocument('skills', sk.id); await reloadAdmin(); }} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 3. STATISTICS */
function StatisticsInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const [editing, setEditing] = useState<StatisticItem | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading statistics...</div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const id = editing.id === 'NEW' ? slugifyId('stat', editing.label) : editing.id;
    await saveDocument('statistics', id, editing);
    setEditing(null);
    await reloadAdmin();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Statistics</h1>
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
        {adminData.statistics.map((st) => (
          <div key={st.id} className="p-4 rounded-xl bg-[#111114] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <p className="font-serif text-xl text-[#D4B475] tabular-nums">{st.value}{st.suffix} — <span className="text-[#F5F2EB] font-sans text-sm">{st.label}</span></p>
              <p className="text-xs text-[#8C8A84]">{st.description}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={async () => { await saveDocument('statistics', st.id, { ...st, isVisible: !st.isVisible }); await reloadAdmin(); }} className="p-2 rounded-lg border border-white/15 text-xs" title="Toggle visibility">
                {st.isVisible ? <Eye className="w-3.5 h-3.5 text-[#D4B475]" /> : <EyeOff className="w-3.5 h-3.5 text-[#8C8A84]" />}
              </button>
              <button onClick={() => setEditing(st)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs">Edit</button>
              <button onClick={async () => { await removeDocument('statistics', st.id); await reloadAdmin(); }} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 4. EXPERIENCE & ACHIEVEMENTS */
function ExperienceInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const [expEdit, setExpEdit] = useState<ExperienceItem | null>(null);
  const [achEdit, setAchEdit] = useState<AchievementItem | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading experience...</div>;

  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl font-semibold">Experience Timeline</h1>
          <button onClick={() => setExpEdit({ id: 'NEW', role: '', organization: '', context: '', period: '', description: '', sortOrder: adminData.experiences.length + 1, status: 'published' })} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">
            <Plus className="w-4 h-4" /> Add Experience
          </button>
        </div>

        {expEdit && (
          <form onSubmit={async (e) => { e.preventDefault(); const id = expEdit.id === 'NEW' ? slugifyId('exp', expEdit.role) : expEdit.id; await saveDocument('experiences', id, expEdit); setExpEdit(null); await reloadAdmin(); }} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Role / Title" value={expEdit.role} onChange={(e) => setExpEdit({ ...expEdit, role: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
              <input type="text" placeholder="Organization / Institute" value={expEdit.organization} onChange={(e) => setExpEdit({ ...expEdit, organization: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
              <input type="text" placeholder="Context (e.g. ASSET Program — Level 3)" value={expEdit.context} onChange={(e) => setExpEdit({ ...expEdit, context: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
              <input type="text" placeholder="Period" value={expEdit.period} onChange={(e) => setExpEdit({ ...expEdit, period: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            </div>
            <textarea rows={2} placeholder="Description" value={expEdit.description} onChange={(e) => setExpEdit({ ...expEdit, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
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
                <p className="text-xs text-[#8C8A84]">{exp.context}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setExpEdit(exp)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs">Edit</button>
                <button onClick={async () => { await removeDocument('experiences', exp.id); await reloadAdmin(); }} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold">Achievements &amp; Leadership</h2>
          <button onClick={() => setAchEdit({ id: 'NEW', title: '', organization: '', year: '', details: '', category: '', sortOrder: adminData.achievements.length + 1, status: 'published' })} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">
            <Plus className="w-4 h-4" /> Add Achievement
          </button>
        </div>

        {achEdit && (
          <form onSubmit={async (e) => { e.preventDefault(); const id = achEdit.id === 'NEW' ? slugifyId('ach', achEdit.title) : achEdit.id; await saveDocument('achievements', id, achEdit); setAchEdit(null); await reloadAdmin(); }} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="Title" value={achEdit.title} onChange={(e) => setAchEdit({ ...achEdit, title: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
              <input type="text" placeholder="Organization / Event" value={achEdit.organization} onChange={(e) => setAchEdit({ ...achEdit, organization: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
              <input type="text" placeholder="Year" value={achEdit.year} onChange={(e) => setAchEdit({ ...achEdit, year: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            </div>
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
                <p className="text-sm font-medium">{ach.title}</p>
                <p className="text-xs text-[#8C8A84]">{ach.details}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAchEdit(ach)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs">Edit</button>
                <button onClick={async () => { await removeDocument('achievements', ach.id); await reloadAdmin(); }} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* 5. EDUCATION */
function EducationInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const [editing, setEditing] = useState<EducationItem | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading education...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold">Education</h1>
        <button onClick={() => setEditing({ id: 'NEW', degree: '', institution: '', focus: '', period: '', sortOrder: adminData.education.length + 1, status: 'published' })} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">
          <Plus className="w-4 h-4" /> Add Education
        </button>
      </div>

      {editing && (
        <form onSubmit={async (e) => { e.preventDefault(); const id = editing.id === 'NEW' ? slugifyId('edu', editing.degree) : editing.id; await saveDocument('education', id, editing); setEditing(null); await reloadAdmin(); }} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Degree / Certificate" value={editing.degree} onChange={(e) => setEditing({ ...editing, degree: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Institution" value={editing.institution} onChange={(e) => setEditing({ ...editing, institution: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Focus / Group" value={editing.focus} onChange={(e) => setEditing({ ...editing, focus: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Period" value={editing.period} onChange={(e) => setEditing({ ...editing, period: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
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
              <p className="text-xs text-[#8C8A84]">{edu.institution} · {edu.period}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(edu)} className="px-3 py-1.5 rounded-lg border border-white/15 text-xs">Edit</button>
              <button onClick={async () => { await removeDocument('education', edu.id); await reloadAdmin(); }} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 6. CERTIFICATIONS */
function CertificationsInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const [editing, setEditing] = useState<CertificationItem | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading certifications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold">Certifications</h1>
        <button onClick={() => setEditing({ id: 'NEW', name: '', organization: '', issueDate: '', credentialId: '', imageUrl: '', verificationUrl: '', sortOrder: adminData.certifications.length + 1, status: 'published' })} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold">
          <Plus className="w-4 h-4" /> Add Certification
        </button>
      </div>

      {editing && (
        <form onSubmit={async (e) => { e.preventDefault(); const id = editing.id === 'NEW' ? slugifyId('cert', editing.name) : editing.id; await saveDocument('certifications', id, editing); setEditing(null); await reloadAdmin(); }} className="p-6 rounded-2xl bg-[#111114] border border-[#D4B475]/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Certification Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Issuing Organization" value={editing.organization} onChange={(e) => setEditing({ ...editing, organization: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Issue Date" value={editing.issueDate} onChange={(e) => setEditing({ ...editing, issueDate: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Credential ID (optional)" value={editing.credentialId} onChange={(e) => setEditing({ ...editing, credentialId: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Certificate Image URL (optional)" value={editing.imageUrl} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="url" placeholder="Verification URL (optional)" value={editing.verificationUrl} onChange={(e) => setEditing({ ...editing, verificationUrl: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
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
              <button onClick={async () => { await removeDocument('certifications', cert.id); await reloadAdmin(); }} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 7. TESTIMONIALS */
function TestimonialsInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const [editing, setEditing] = useState<TestimonialItem | null>(null);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading testimonials...</div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const id = editing.id === 'NEW' ? slugifyId('test', editing.name) : editing.id;
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
            <input type="text" placeholder="Person Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
            <input type="text" placeholder="Position / Role" value={editing.position} onChange={(e) => setEditing({ ...editing, position: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
            <input type="text" placeholder="Company" value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} className="px-3 py-2 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
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
                <button onClick={async () => { await removeDocument('testimonials', t.id); await reloadAdmin(); }} className="p-2 rounded-lg border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminServicesPage() { return <AdminLayout><ServicesInner /></AdminLayout>; }
export function AdminSkillsPage() { return <AdminLayout><SkillsInner /></AdminLayout>; }
export function AdminStatisticsPage() { return <AdminLayout><StatisticsInner /></AdminLayout>; }
export function AdminExperiencePage() { return <AdminLayout><ExperienceInner /></AdminLayout>; }
export function AdminEducationPage() { return <AdminLayout><EducationInner /></AdminLayout>; }
export function AdminCertificationsPage() { return <AdminLayout><CertificationsInner /></AdminLayout>; }
export function AdminTestimonialsPage() { return <AdminLayout><TestimonialsInner /></AdminLayout>; }
