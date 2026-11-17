import { useEffect, useState } from 'react';
import { Upload, Trash2, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logAdminActivity, saveContentVersion, saveDocument } from '../../lib/portfolioService';
import { AdminNoticeBanner, ConfirmModal, MediaField, uploadFileToServer } from '../../components/admin/AdminUi';
import { AdminLayout, useAdminData } from './AdminLayout';

function ProfileInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { getIdToken, user } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    headline: '',
    shortIntro: '',
    aboutSummary: '',
    tagline: '',
    careerObjective: '',
    dateOfBirth: '',
    heroDescription: '',
    location: '',
    email: '',
    phone: '',
    whatsapp: '',
    googleMapsUrl: '',
    availability: '',
    isAvailable: true,
    profileImageUrl: '',
    coverImageUrl: '',
    cvUrl: '',
    cvFilename: '',
    cvButtonText: 'Download CV',
    cvVisible: true,
  });

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; tone: 'success' | 'error' } | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [confirmClearCv, setConfirmClearCv] = useState(false);

  useEffect(() => {
    if (!adminData) return;
    const p = adminData.profile;
    setForm({
      fullName: p.fullName || '',
      headline: p.headline || '',
      shortIntro: p.shortIntro || '',
      aboutSummary: p.aboutSummary || '',
      tagline: p.tagline || '',
      careerObjective: p.careerObjective || '',
      dateOfBirth: p.dateOfBirth || '',
      heroDescription: p.heroDescription || '',
      location: p.location || '',
      email: p.email || '',
      phone: p.phone || '',
      whatsapp: p.whatsapp || '',
      googleMapsUrl: p.googleMapsUrl || '',
      availability: p.availability || '',
      isAvailable: p.isAvailable ?? true,
      profileImageUrl: p.profileImageUrl || '',
      coverImageUrl: p.coverImageUrl || '',
      cvUrl: p.cvUrl || '',
      cvFilename: p.cvFilename || 'Md_Nabiul_Islam_CV.pdf',
      cvButtonText: p.cvButtonText || 'Download CV',
      cvVisible: p.cvVisible ?? true,
    });
  }, [adminData]);

  const handleCvUpload = async (file: File) => {
    setUploadingCv(true);
    setNotice(null);
    try {
      const uploaded = await uploadFileToServer(file, getIdToken, user?.email, 'documents');
      setForm((prev) => ({
        ...prev,
        cvUrl: uploaded.url,
        cvFilename: file.name,
        cvVisible: true,
      }));
      await reloadAdmin();
      setNotice({ msg: `Uploaded CV "${file.name}". Click Save Profile to publish.`, tone: 'success' });
    } catch (err) {
      setNotice({ msg: err instanceof Error ? err.message : 'CV upload failed.', tone: 'error' });
    } finally {
      setUploadingCv(false);
    }
  };

  const handleClearCustomCv = async () => {
    if (form.cvUrl.startsWith('/uploads/')) {
      const token = await getIdToken();
      if (token) {
        await fetch(`/api/admin/upload?url=${encodeURIComponent(form.cvUrl)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    }
    const next = {
      ...form,
      cvUrl: '/api/cv/download',
      cvFilename: 'Md_Nabiul_Islam_CV.pdf',
    };
    setForm(next);
    await saveDocument('profiles', 'main', next);
    await logAdminActivity(user?.email, 'delete', 'profile_cv', 'main', 'Removed custom uploaded CV PDF');
    setConfirmClearCv(false);
    await reloadAdmin();
    setNotice({ msg: 'Custom CV removed; reverted to dynamic CV endpoint.', tone: 'success' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      if (adminData?.profile) {
        await saveContentVersion(
          'profile',
          'main',
          `Profile snapshot (${new Date().toLocaleTimeString()})`,
          adminData.profile,
          user?.email
        );
      }
      await saveDocument('profiles', 'main', form);
      await logAdminActivity(user?.email, 'update', 'profile', 'main', 'Updated personal profile & CV settings');
      await reloadAdmin();
      setNotice({ msg: 'Profile and CV configuration saved.', tone: 'success' });
    } catch (err) {
      setNotice({ msg: err instanceof Error ? err.message : 'Failed to save profile.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !adminData) {
    return <div className="text-sm text-[#8C8A84]">Loading profile data...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">
            Identity &amp; Resume
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold">Profile &amp; CV Management</h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold hover:bg-[#E8D2A0] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {notice && <AdminNoticeBanner message={notice.msg} tone={notice.tone} />}

      {/* Personal & Contact Info */}
      <section className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-5">
        <h2 className="font-serif text-xl font-semibold text-[#D4B475]">Personal &amp; Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Full Name</label>
            <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Professional Headline / Title</label>
            <input type="text" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Tagline</label>
            <input type="text" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Date of Birth (Optional)</label>
            <input type="text" placeholder="e.g. 12 May 2003 (leave blank to hide)" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Public Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Phone Number</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">WhatsApp Number / Link (Optional)</label>
            <input type="text" placeholder="+8801795110021" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Google Maps Link (Optional)</label>
            <input type="url" placeholder="https://maps.google.com/..." value={form.googleMapsUrl} onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Availability Text</label>
            <input type="text" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
          </div>
        </div>

        <label className="inline-flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
            className="accent-[#D4B475]"
          />
          <span>Display active availability indicator on website</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Short Intro</label>
            <textarea rows={2} value={form.shortIntro} onChange={(e) => setForm({ ...form, shortIntro: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Career Objective</label>
            <textarea rows={2} value={form.careerObjective} onChange={(e) => setForm({ ...form, careerObjective: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <MediaField
            label="Profile Image"
            value={form.profileImageUrl}
            media={adminData.media}
            acceptTypes={['image']}
            folder="profile"
            onChange={(url) => setForm({ ...form, profileImageUrl: url })}
            onUploaded={reloadAdmin}
          />
          <MediaField
            label="Cover Image"
            value={form.coverImageUrl}
            media={adminData.media}
            acceptTypes={['image']}
            folder="profile"
            onChange={(url) => setForm({ ...form, coverImageUrl: url })}
            onUploaded={reloadAdmin}
          />
        </div>
      </section>

      {/* CV / Resume Management */}
      <section className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#D4B475]">CV / Resume Management</h2>
            <p className="text-xs text-[#8C8A84] mt-0.5">Upload a custom PDF CV or control download button visibility and label.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={form.cvVisible}
              onChange={(e) => setForm({ ...form, cvVisible: e.target.checked })}
              className="accent-[#D4B475]"
            />
            <span>Show CV Download Button</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">CV Download Button Label</label>
            <input type="text" value={form.cvButtonText} onChange={(e) => setForm({ ...form, cvButtonText: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">CV Download Filename</label>
            <input type="text" value={form.cvFilename} onChange={(e) => setForm({ ...form, cvFilename: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 flex items-center gap-2 text-xs font-mono truncate">
            <FileText className="w-4 h-4 text-[#D4B475] shrink-0" />
            <span className="truncate">{form.cvUrl}</span>
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold cursor-pointer hover:bg-[#E8D2A0]">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploadingCv ? 'Uploading...' : 'Upload / Replace PDF'}</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={uploadingCv}
              onChange={(e) => e.target.files?.[0] && handleCvUpload(e.target.files[0])}
            />
          </label>
          {form.cvUrl.startsWith('/uploads/') && (
            <button
              type="button"
              onClick={() => setConfirmClearCv(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-950/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Uploaded CV</span>
            </button>
          )}
        </div>
      </section>

      <ConfirmModal
        open={confirmClearCv}
        title="Delete Uploaded CV PDF?"
        message="This deletes the custom PDF file from server uploads and reverts the link back to the dynamic CV generator."
        onCancel={() => setConfirmClearCv(false)}
        onConfirm={handleClearCustomCv}
      />
    </form>
  );
}

export function AdminProfileAboutPage() {
  return (
    <AdminLayout>
      <ProfileInner />
    </AdminLayout>
  );
}

export const AdminProfilePage = AdminProfileAboutPage;
