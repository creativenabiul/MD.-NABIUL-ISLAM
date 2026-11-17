import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logAdminActivity, saveContentVersion, saveDocument, slugifyId } from '../../lib/portfolioService';
import type { AboutInfoBlock } from '../../types/portfolio';
import { AdminNoticeBanner, MediaField } from '../../components/admin/AdminUi';
import { AdminLayout, useAdminData } from './AdminLayout';

/* HERO SECTION EDITOR (/admin/hero) */
function HeroInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [linesText, setLinesText] = useState('Designing Brands.\nScaling Strategy.\nAutomating Impact.');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [primaryCtaText, setPrimaryCtaText] = useState('Explore My Work');
  const [primaryCtaLink, setPrimaryCtaLink] = useState('#projects');
  const [secondaryCtaText, setSecondaryCtaText] = useState('Contact Me');
  const [secondaryCtaLink, setSecondaryCtaLink] = useState('/contact');
  const [heroBgUrl, setHeroBgUrl] = useState('');
  const [showHeroSection, setShowHeroSection] = useState(true);
  const [enable3D, setEnable3D] = useState(true);
  const [intensity, setIntensity] = useState<'full' | 'subtle' | 'minimal'>('full');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!adminData) return;
    const s = adminData.settings;
    setLinesText((s.heroHeadlineLines && s.heroHeadlineLines.length > 0 ? s.heroHeadlineLines : ['Designing Brands.', 'Scaling Strategy.', 'Automating Impact.']).join('\n'));
    setHeroDescription(adminData.profile.heroDescription || '');
    setHeroSubtitle(s.heroSubtitle || '');
    setPrimaryCtaText(s.heroPrimaryCtaText || 'Explore My Work');
    setPrimaryCtaLink(s.heroPrimaryCtaLink || '#projects');
    setSecondaryCtaText(s.heroSecondaryCtaText || 'Contact Me');
    setSecondaryCtaLink(s.heroSecondaryCtaLink || '/contact');
    setHeroBgUrl(s.heroBackgroundImageUrl || '');
    setShowHeroSection(s.showHeroSection ?? true);
    setEnable3D(s.enable3D);
    setIntensity(s.heroAnimationIntensity || 'full');
  }, [adminData]);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading hero settings...</div>;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const heroHeadlineLines = linesText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 6);

      await Promise.all([
        saveDocument('profiles', 'main', {
          ...adminData.profile,
          heroDescription,
        }),
        saveDocument('site_settings', 'main', {
          ...adminData.settings,
          heroHeadlineLines,
          heroSubtitle,
          heroPrimaryCtaText: primaryCtaText,
          heroPrimaryCtaLink: primaryCtaLink,
          heroSecondaryCtaText: secondaryCtaText,
          heroSecondaryCtaLink: secondaryCtaLink,
          heroBackgroundImageUrl: heroBgUrl,
          showHeroSection,
          enable3D,
          heroAnimationIntensity: intensity,
        }),
      ]);
      await logAdminActivity(user?.email, 'update', 'hero', 'main', 'Updated hero headlines, CTAs & 3D animation controls');
      await reloadAdmin();
      setNotice('Hero configuration saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">First Impression</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold">Hero Section Studio</h1>
        </div>
        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold hover:bg-[#E8D2A0]">
          {saving ? 'Saving...' : 'Save Hero Settings'}
        </button>
      </div>

      <AdminNoticeBanner message={notice} />

      <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Hero Eyebrow / Subtitle</label>
            <input type="text" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Kinetic Animation Intensity</label>
            <select value={intensity} onChange={(e) => setIntensity(e.target.value as 'full' | 'subtle' | 'minimal')} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm">
              <option value="full">Full Kinetic Typography + 3D</option>
              <option value="subtle">Subtle Editorial Motion</option>
              <option value="minimal">Minimal / Reduced</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Hero Headline Lines (one line per row, up to 6 lines)</label>
          <textarea rows={3} value={linesText} onChange={(e) => setLinesText(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm font-serif" required />
        </div>

        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Hero Intro Description</label>
          <textarea rows={3} value={heroDescription} onChange={(e) => setHeroDescription(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Primary CTA Button Text</label>
            <input type="text" value={primaryCtaText} onChange={(e) => setPrimaryCtaText(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Primary CTA Link</label>
            <input type="text" value={primaryCtaLink} onChange={(e) => setPrimaryCtaLink(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Secondary CTA Button Text</label>
            <input type="text" value={secondaryCtaText} onChange={(e) => setSecondaryCtaText(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8C8A84] mb-1">Secondary CTA Link</label>
            <input type="text" value={secondaryCtaLink} onChange={(e) => setSecondaryCtaLink(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
          </div>
        </div>

        <MediaField
          label="Optional Hero Backdrop Media Overlay"
          value={heroBgUrl}
          media={adminData.media}
          acceptTypes={['image']}
          folder="hero"
          onChange={setHeroBgUrl}
          onUploaded={reloadAdmin}
        />

        <div className="flex flex-wrap gap-6 pt-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showHeroSection} onChange={(e) => setShowHeroSection(e.target.checked)} className="accent-[#D4B475]" />
            <span>Hero Section Visible</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enable3D} onChange={(e) => setEnable3D(e.target.checked)} className="accent-[#D4B475]" />
            <span>Enable 3D Three.js Hero Sculpture</span>
          </label>
        </div>
      </div>
    </form>
  );
}

/* ABOUT SECTION EDITOR (/admin/about) */
function AboutInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [introduction, setIntroduction] = useState('');
  const [background, setBackground] = useState('');
  const [journey, setJourney] = useState('');
  const [careerObjective, setCareerObjective] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [portraitImageUrl, setPortraitImageUrl] = useState('');
  const [blocks, setBlocks] = useState<AboutInfoBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!adminData) return;
    const a = adminData.about;
    setIntroduction(a.introduction || '');
    setBackground(a.background || '');
    setJourney(a.journey || '');
    setCareerObjective(a.careerObjective || '');
    setInterestsText((a.interests || []).join(', '));
    setPortraitImageUrl(a.portraitImageUrl || '');
    try {
      const parsed = a.additionalBlocksJson ? JSON.parse(a.additionalBlocksJson) : [];
      setBlocks(Array.isArray(parsed) ? parsed : []);
    } catch {
      setBlocks([]);
    }
  }, [adminData]);

  if (loading || !adminData) return <div className="text-sm text-[#8C8A84]">Loading about narrative...</div>;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await saveContentVersion(
        'about',
        'main',
        `About snapshot (${new Date().toLocaleTimeString()})`,
        adminData.about,
        user?.email
      );
      const interests = interestsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await saveDocument('about_sections', 'main', {
        introduction,
        background,
        journey,
        careerObjective,
        interests,
        portraitImageUrl,
        additionalBlocksJson: JSON.stringify(blocks),
      });
      await logAdminActivity(user?.email, 'update', 'about', 'main', 'Updated About narrative, journey, and portrait');
      await reloadAdmin();
      setNotice('About section updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">Story &amp; Direction</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold">About Page &amp; Biography</h1>
        </div>
        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold hover:bg-[#E8D2A0]">
          {saving ? 'Saving...' : 'Save About Section'}
        </button>
      </div>

      <AdminNoticeBanner message={notice} />

      <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-5">
        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Biography / Introduction</label>
          <textarea rows={3} value={introduction} onChange={(e) => setIntroduction(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
        </div>
        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Background</label>
          <textarea rows={3} value={background} onChange={(e) => setBackground(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
        </div>
        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Professional Journey (Optional)</label>
          <textarea rows={3} value={journey} onChange={(e) => setJourney(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Career Goals &amp; Objective</label>
          <textarea rows={2} value={careerObjective} onChange={(e) => setCareerObjective(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" required />
        </div>
        <div>
          <label className="block text-xs text-[#8C8A84] mb-1">Interests (comma-separated)</label>
          <input type="text" value={interestsText} onChange={(e) => setInterestsText(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#070708] border border-white/12 text-sm" />
        </div>
        <MediaField
          label="Editorial Portrait Image"
          value={portraitImageUrl}
          media={adminData.media}
          acceptTypes={['image']}
          folder="about"
          onChange={setPortraitImageUrl}
          onUploaded={reloadAdmin}
        />
      </div>

      {/* Additional Info Blocks */}
      <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#D4B475]">Additional Info Blocks</h2>
            <p className="text-xs text-[#8C8A84]">Extra structured editorial paragraphs or highlights shown on the About page.</p>
          </div>
          <button
            type="button"
            onClick={() => setBlocks((prev) => [...prev, { id: slugifyId('blk', 'about'), heading: '', body: '' }])}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 text-xs hover:border-[#D4B475]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Block</span>
          </button>
        </div>

        {blocks.map((blk, i) => (
          <div key={blk.id} className="p-4 rounded-xl bg-[#070708] border border-white/10 space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Block heading"
                value={blk.heading}
                onChange={(e) => setBlocks((p) => p.map((b, idx) => (idx === i ? { ...b, heading: e.target.value } : b)))}
                className="flex-1 px-3 py-2 rounded-lg bg-[#111114] border border-white/10 text-xs"
              />
              <button
                type="button"
                onClick={() => setBlocks((p) => p.filter((_, idx) => idx !== i))}
                className="p-2 rounded-lg border border-rose-500/30 text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              rows={2}
              placeholder="Block details"
              value={blk.body}
              onChange={(e) => setBlocks((p) => p.map((b, idx) => (idx === i ? { ...b, body: e.target.value } : b)))}
              className="w-full px-3 py-2 rounded-lg bg-[#111114] border border-white/10 text-xs"
            />
          </div>
        ))}
      </div>
    </form>
  );
}

export function AdminHeroPage() {
  return (
    <AdminLayout>
      <HeroInner />
    </AdminLayout>
  );
}

export function AdminAboutPage() {
  return (
    <AdminLayout>
      <AboutInner />
    </AdminLayout>
  );
}
