import { useEffect, useState } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { saveDocument } from '../../lib/portfolioService';
import { AdminLayout, useAdminData } from './AdminLayout';

function ProfileAboutInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { getIdToken } = useAuth();

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    headline: '',
    heroDescription: '',
    location: '',
    email: '',
    phone: '',
    availability: '',
    isAvailable: true,
    profileImageUrl: '',
    cvUrl: '',
    cvFilename: '',
  });

  const [aboutForm, setAboutForm] = useState({
    introduction: '',
    background: '',
    careerObjective: '',
    interestsText: '',
    portraitImageUrl: '',
  });

  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    if (!adminData) return;
    const p = adminData.profile;
    const a = adminData.about;
    setProfileForm({
      fullName: p.fullName,
      headline: p.headline,
      heroDescription: p.heroDescription,
      location: p.location,
      email: p.email,
      phone: p.phone,
      availability: p.availability,
      isAvailable: p.isAvailable,
      profileImageUrl: p.profileImageUrl || '',
      cvUrl: p.cvUrl || '',
      cvFilename: p.cvFilename || '',
    });
    setAboutForm({
      introduction: a.introduction,
      background: a.background,
      careerObjective: a.careerObjective,
      interestsText: (a.interests || []).join(', '),
      portraitImageUrl: a.portraitImageUrl || '',
    });
  }, [adminData]);

  const handleFileUpload = async (
    file: File,
    target: 'profileImage' | 'portraitImage' | 'cv'
  ) => {
    setUploadingField(target);
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
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Upload failed');

      if (target === 'profileImage') {
        setProfileForm((prev) => ({ ...prev, profileImageUrl: data.url }));
      } else if (target === 'portraitImage') {
        setAboutForm((prev) => ({ ...prev, portraitImageUrl: data.url }));
      } else {
        setProfileForm((prev) => ({
          ...prev,
          cvUrl: data.url,
          cvFilename: file.name,
        }));
      }
    } catch (err) {
      setSavedNotice(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice('');
    try {
      await saveDocument('profiles', 'main', profileForm);
      const interests = aboutForm.interestsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await saveDocument('about_sections', 'main', {
        introduction: aboutForm.introduction,
        background: aboutForm.background,
        careerObjective: aboutForm.careerObjective,
        interests,
        portraitImageUrl: aboutForm.portraitImageUrl,
      });
      await reloadAdmin();
      setSavedNotice('Profile, Hero, About & CV saved to database.');
    } catch (err) {
      setSavedNotice(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-[#8C8A84]">Loading profile data...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">
            Identity &amp; Copy
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold">Profile, Hero &amp; About</h1>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold hover:bg-[#E8D2A0] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {savedNotice && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#141418] border border-[#D4B475]/40 text-xs text-[#E8D2A0]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Profile & Contact Info */}
      <section className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-5">
        <h2 className="font-serif text-xl font-semibold text-[#D4B475]">
          Personal Profile &amp; Hero Section
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1.5">Full Name</label>
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1.5">Professional Headline</label>
            <input
              type="text"
              value={profileForm.headline}
              onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1.5">Public Email</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1.5">Phone</label>
            <input
              type="text"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1.5">Location</label>
            <input
              type="text"
              value={profileForm.location}
              onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1.5">Availability Statement</label>
            <input
              type="text"
              value={profileForm.availability}
              onChange={(e) => setProfileForm({ ...profileForm, availability: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              required
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={profileForm.isAvailable}
            onChange={(e) => setProfileForm({ ...profileForm, isAvailable: e.target.checked })}
            className="accent-[#D4B475]"
          />
          <span>Display availability badge on public Hero</span>
        </label>

        <div>
          <label className="block text-xs text-[#8C8A84] mb-1.5">Hero Description</label>
          <textarea
            rows={3}
            value={profileForm.heroDescription}
            onChange={(e) => setProfileForm({ ...profileForm, heroDescription: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1.5">Hero Portrait URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileForm.profileImageUrl}
                onChange={(e) => setProfileForm({ ...profileForm, profileImageUrl: e.target.value })}
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 text-xs cursor-pointer hover:border-[#D4B475]">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingField === 'profileImage' ? '...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'profileImage')}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8C8A84] mb-1.5">CV / Resume PDF URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileForm.cvUrl}
                onChange={(e) => setProfileForm({ ...profileForm, cvUrl: e.target.value })}
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 text-xs cursor-pointer hover:border-[#D4B475]">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingField === 'cv' ? '...' : 'Upload PDF'}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cv')}
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-5">
        <h2 className="font-serif text-xl font-semibold text-[#D4B475]">About Narrative</h2>

        <div>
          <label className="block text-xs text-[#8C8A84] mb-1.5">Introduction</label>
          <textarea
            rows={3}
            value={aboutForm.introduction}
            onChange={(e) => setAboutForm({ ...aboutForm, introduction: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-[#8C8A84] mb-1.5">Background</label>
          <textarea
            rows={3}
            value={aboutForm.background}
            onChange={(e) => setAboutForm({ ...aboutForm, background: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-[#8C8A84] mb-1.5">Career Objective</label>
          <textarea
            rows={2}
            value={aboutForm.careerObjective}
            onChange={(e) => setAboutForm({ ...aboutForm, careerObjective: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1.5">
              Professional Interests (comma-separated)
            </label>
            <input
              type="text"
              value={aboutForm.interestsText}
              onChange={(e) => setAboutForm({ ...aboutForm, interestsText: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8C8A84] mb-1.5">About Portrait URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={aboutForm.portraitImageUrl}
                onChange={(e) => setAboutForm({ ...aboutForm, portraitImageUrl: e.target.value })}
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 text-xs cursor-pointer hover:border-[#D4B475]">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingField === 'portraitImage' ? '...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'portraitImage')}
                />
              </label>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}

export function AdminProfileAboutPage() {
  return (
    <AdminLayout>
      <ProfileAboutInner />
    </AdminLayout>
  );
}
