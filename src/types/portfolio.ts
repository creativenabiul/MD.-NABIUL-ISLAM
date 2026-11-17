export type PublishStatus = 'published' | 'draft';

export interface ProfileData {
  id: string;
  fullName: string;
  headline: string;
  heroDescription: string;
  location: string;
  email: string;
  phone: string;
  availability: string;
  isAvailable: boolean;
  profileImageUrl: string;
  cvUrl: string;
  cvFilename: string;
  updatedAt?: unknown;
}

export interface AboutData {
  id: string;
  introduction: string;
  background: string;
  careerObjective: string;
  interests: string[];
  portraitImageUrl: string;
  updatedAt?: unknown;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
  sortOrder: number;
  status: PublishStatus;
  updatedAt?: unknown;
}

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  proficiencyLabel: string;
  level?: number;
  hasLevel: boolean;
  sortOrder: number;
  status: PublishStatus;
  updatedAt?: unknown;
}

export interface StatisticItem {
  id: string;
  value: number;
  suffix: string;
  label: string;
  description: string;
  isVisible: boolean;
  sortOrder: number;
  status: PublishStatus;
  updatedAt?: unknown;
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  context: string;
  period: string;
  description: string;
  sortOrder: number;
  status: PublishStatus;
  updatedAt?: unknown;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  focus: string;
  period: string;
  sortOrder: number;
  status: PublishStatus;
  updatedAt?: unknown;
}

export interface ProjectCategoryItem {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  updatedAt?: unknown;
}

export interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  overview: string;
  objective: string;
  challenges: string;
  approach: string;
  designProcess: string;
  finalOutput: string;
  results: string;
  tools: string[];
  coverImageUrl: string;
  galleryImages: string[];
  liveUrl: string;
  sourceUrl: string;
  featured: boolean;
  status: PublishStatus;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CertificationItem {
  id: string;
  name: string;
  organization: string;
  issueDate: string;
  credentialId: string;
  imageUrl: string;
  verificationUrl: string;
  sortOrder: number;
  status: PublishStatus;
  updatedAt?: unknown;
}

export interface AchievementItem {
  id: string;
  title: string;
  organization: string;
  year: string;
  details: string;
  category: string;
  sortOrder: number;
  status: PublishStatus;
  updatedAt?: unknown;
}

export interface TestimonialItem {
  id: string;
  name: string;
  position: string;
  company: string;
  imageUrl: string;
  quote: string;
  rating?: number;
  hasRating: boolean;
  sortOrder: number;
  status: PublishStatus;
  updatedAt?: unknown;
}

export interface SocialLinkItem {
  id: string;
  platform: string;
  url: string;
  isVisible: boolean;
  sortOrder: number;
  updatedAt?: unknown;
}

export interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MediaAssetItem {
  id: string;
  title: string;
  url: string;
  type: 'image' | 'video' | 'document';
  altText: string;
  mimeType: string;
  sizeBytes: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SiteSettingsData {
  id: string;
  siteTitle: string;
  tagline: string;
  seoDescription: string;
  ogImageUrl: string;
  showcaseVideoUrl: string;
  showcasePosterUrl: string;
  marqueeText: string;
  accentGoldHex: string;
  enable3D: boolean;
  enableCustomCursor: boolean;
  updatedAt?: unknown;
}

export interface PortfolioBundle {
  profile: ProfileData;
  about: AboutData;
  services: ServiceItem[];
  skills: SkillItem[];
  statistics: StatisticItem[];
  experiences: ExperienceItem[];
  education: EducationItem[];
  categories: ProjectCategoryItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
  testimonials: TestimonialItem[];
  socialLinks: SocialLinkItem[];
  settings: SiteSettingsData;
}
