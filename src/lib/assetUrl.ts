import portraitImg from '../assets/images/nabiul_portrait_1794642359330.jpg';
import brandIdentityImg from '../assets/images/project_brand_identity_1794642358938.jpg';
import socialCampaignImg from '../assets/images/project_social_campaign_1794642358570.jpg';
import aiAutomationImg from '../assets/images/project_ai_automation_1794642360643.jpg';
import showcasePosterImg from '../assets/images/showcase_video_poster_1794642361264.jpg';
import type { PortfolioBundle, ProjectItem, SectionContentBlock, WebsiteSectionItem } from '../types/portfolio';

export const BUNDLED_ASSETS = {
  portrait: portraitImg,
  brandIdentity: brandIdentityImg,
  socialCampaign: socialCampaignImg,
  aiAutomation: aiAutomationImg,
  showcasePoster: showcasePosterImg,
};

const LEGACY_ASSET_MAP: Record<string, string> = {
  '/src/assets/images/nabiul_portrait_1794642359330.jpg': portraitImg,
  '/src/assets/images/project_brand_identity_1794642358938.jpg': brandIdentityImg,
  '/src/assets/images/project_social_campaign_1794642358570.jpg': socialCampaignImg,
  '/src/assets/images/project_ai_automation_1794642360643.jpg': aiAutomationImg,
  '/src/assets/images/showcase_video_poster_1794642361264.jpg': showcasePosterImg,
};

export function getBaseUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

export function isStaticGitHubHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('.github.io');
}

export function resolveAssetUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (LEGACY_ASSET_MAP[trimmed]) {
    return LEGACY_ASSET_MAP[trimmed];
  }

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed === '/api/cv/download' && isStaticGitHubHost()) {
    return `${getBaseUrl()}Md_Nabiul_Islam_CV.pdf`;
  }

  if (trimmed.startsWith('/api/')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    const base = getBaseUrl();
    if (base !== '/' && trimmed.startsWith(base)) {
      return trimmed;
    }
    return `${base}${trimmed.slice(1)}`;
  }

  return trimmed;
}

export function normalizeProject(project: ProjectItem): ProjectItem {
  return {
    ...project,
    coverImageUrl: resolveAssetUrl(project.coverImageUrl),
    ogImageUrl: resolveAssetUrl(project.ogImageUrl),
    galleryImages: (project.galleryImages || []).map((img) => resolveAssetUrl(img)).filter(Boolean),
  };
}

export function parseSectionBlocks(blocksJson: string | undefined): SectionContentBlock[] {
  if (!blocksJson) return [];
  try {
    const parsed = JSON.parse(blocksJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((b: SectionContentBlock) => ({
      ...b,
      mediaUrl: b.mediaUrl ? resolveAssetUrl(b.mediaUrl) : undefined,
    }));
  } catch {
    return [];
  }
}

export function normalizeWebsiteSection(section: WebsiteSectionItem): WebsiteSectionItem {
  const blocks = parseSectionBlocks(section.blocksJson);
  return {
    ...section,
    blocksJson: JSON.stringify(blocks),
  };
}

export function normalizePortfolioBundle(bundle: PortfolioBundle): PortfolioBundle {
  return {
    ...bundle,
    profile: {
      ...bundle.profile,
      profileImageUrl: resolveAssetUrl(bundle.profile.profileImageUrl),
      coverImageUrl: resolveAssetUrl(bundle.profile.coverImageUrl),
      cvUrl: resolveAssetUrl(bundle.profile.cvUrl),
    },
    about: {
      ...bundle.about,
      portraitImageUrl: resolveAssetUrl(bundle.about.portraitImageUrl),
    },
    services: bundle.services.map((s) => ({
      ...s,
      imageUrl: resolveAssetUrl(s.imageUrl),
    })),
    skills: bundle.skills.map((s) => ({
      ...s,
      iconUrl: resolveAssetUrl(s.iconUrl),
    })),
    experiences: bundle.experiences.map((e) => ({
      ...e,
      logoUrl: resolveAssetUrl(e.logoUrl),
    })),
    education: bundle.education.map((ed) => ({
      ...ed,
      certificateUrl: resolveAssetUrl(ed.certificateUrl),
    })),
    projects: bundle.projects.map(normalizeProject),
    certifications: bundle.certifications.map((c) => ({
      ...c,
      imageUrl: resolveAssetUrl(c.imageUrl),
    })),
    achievements: bundle.achievements.map((a) => ({
      ...a,
      evidenceImageUrl: resolveAssetUrl(a.evidenceImageUrl),
    })),
    testimonials: bundle.testimonials.map((t) => ({
      ...t,
      imageUrl: resolveAssetUrl(t.imageUrl),
    })),
    websiteSections: (bundle.websiteSections || []).map(normalizeWebsiteSection),
    navigationItems: bundle.navigationItems || [],
    settings: {
      ...bundle.settings,
      ogImageUrl: resolveAssetUrl(bundle.settings.ogImageUrl),
      showcaseVideoUrl: resolveAssetUrl(bundle.settings.showcaseVideoUrl),
      showcasePosterUrl: resolveAssetUrl(bundle.settings.showcasePosterUrl),
      heroBackgroundImageUrl: resolveAssetUrl(bundle.settings.heroBackgroundImageUrl),
    },
  };
}
