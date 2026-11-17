export type PublishStatus = 'published' | 'draft';

export interface ProfileData {
  id: string;
  fullName: string;
  headline: string;
  shortIntro?: string;
  aboutSummary?: string;
  tagline?: string;
  careerObjective?: string;
  dateOfBirth?: string;
  heroDescription: string;
  location: string;
  email: string;
  phone: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  availability: string;
  isAvailable: boolean;
  profileImageUrl: string;
  coverImageUrl?: string;
  cvUrl: string;
  cvFilename: string;
  cvButtonText?: string;
  cvVisible?: boolean;
  updatedAt?: unknown;
}

export interface AboutInfoBlock {
  id: string;
  heading: string;
  body: string;
}

export interface AboutData {
  id: string;
  introduction: string;
  background: string;
  journey?: string;
  careerObjective: string;
  interests: string[];
  portraitImageUrl: string;
  additionalBlocksJson?: string;
  updatedAt?: unknown;
}

export interface ServiceItem {
  id: string;
  title: string;
  category?: string;
  iconName?: string;
  imageUrl?: string;
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
  description?: string;
  iconUrl?: string;
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
  employmentType?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking?: boolean;
  logoUrl?: string;
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
  department?: string;
  focusGroup?: string;
  startYear?: string;
  endYear?: string;
  result?: string;
  description?: string;
  certificateUrl?: string;
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
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
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
  description?: string;
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
  evidenceImageUrl?: string;
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
  caption?: string;
  folder?: string;
  mimeType: string;
  sizeBytes: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type SectionTemplateType =
  | 'editorial_text'
  | 'feature_cards'
  | 'stats_grid'
  | 'media_showcase'
  | 'gallery_grid'
  | 'cta_banner'
  | 'list_highlights';

export type ContentBlockType =
  | 'text'
  | 'image'
  | 'video'
  | 'button'
  | 'link'
  | 'list'
  | 'card'
  | 'stat';

export interface SectionContentBlock {
  id: string;
  type: ContentBlockType;
  title?: string;
  body?: string;
  mediaUrl?: string;
  altText?: string;
  href?: string;
  linkLabel?: string;
  external?: boolean;
  items?: string[];
  statValue?: string;
  statLabel?: string;
}

export interface WebsiteSectionItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  template: SectionTemplateType;
  blocksJson: string;
  backgroundTone: 'obsidian' | 'charcoal' | 'accent';
  isVisible: boolean;
  sortOrder: number;
  status: PublishStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface NavigationItem {
  id: string;
  label: string;
  destination: string;
  sectionId?: string;
  parentLabel?: string;
  isExternal: boolean;
  isVisible: boolean;
  sortOrder: number;
  updatedAt?: unknown;
}

export interface ActivityLogItem {
  id: string;
  actorEmail: string;
  action:
    | 'login'
    | 'logout'
    | 'create'
    | 'update'
    | 'delete'
    | 'publish'
    | 'unpublish'
    | 'media_upload'
    | 'settings_change'
    | 'restore_version'
    | 'backup_export';
  entityType: string;
  entityId: string;
  summary: string;
  createdAt?: unknown;
}

export interface ContentVersionItem {
  id: string;
  entityType: string;
  entityId: string;
  label: string;
  snapshotJson: string;
  actorEmail: string;
  createdAt?: unknown;
}

export interface SiteSettingsData {
  id: string;
  siteTitle: string;
  tagline: string;
  seoDescription: string;
  seoKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl: string;
  canonicalUrl?: string;
  robotsMeta?: string;
  pageSeoJson?: string;
  showcaseVideoUrl: string;
  showcasePosterUrl: string;
  marqueeText: string;
  accentGoldHex: string;
  primaryBgHex?: string;
  secondaryBgHex?: string;
  textColorHex?: string;
  headingFont?: 'cormorant' | 'playfair' | 'jakarta';
  bodyFont?: 'jakarta' | 'inter' | 'system';
  themeMode?: 'dark' | 'light';
  buttonStyle?: 'sweep' | 'solid' | 'outline';
  borderRadiusStyle?: 'sharp' | 'rounded' | 'soft';
  sectionSpacing?: 'compact' | 'standard' | 'airy';
  headerStyle?: 'glass' | 'solid' | 'minimal';
  footerStyle?: 'editorial' | 'compact';
  heroHeadlineLines?: string[];
  heroSubtitle?: string;
  heroPrimaryCtaText?: string;
  heroPrimaryCtaLink?: string;
  heroSecondaryCtaText?: string;
  heroSecondaryCtaLink?: string;
  heroBackgroundImageUrl?: string;
  showHeroSection?: boolean;
  heroAnimationIntensity?: 'full' | 'subtle' | 'minimal';
  enable3D: boolean;
  enableCustomCursor: boolean;
  contactFormEnabled?: boolean;
  contactAvailabilityNote?: string;
  showAdminFooterLink?: boolean;
  sessionTimeoutMinutes?: number;
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
  websiteSections: WebsiteSectionItem[];
  navigationItems: NavigationItem[];
  settings: SiteSettingsData;
}
