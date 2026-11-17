import type {
  AboutData,
  AchievementItem,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  PortfolioBundle,
  ProfileData,
  ProjectCategoryItem,
  ProjectItem,
  ServiceItem,
  SiteSettingsData,
  SkillItem,
  SocialLinkItem,
  StatisticItem,
} from '../types/portfolio';
import { BUNDLED_ASSETS } from '../lib/assetUrl';

export const DEFAULT_PROFILE: ProfileData = {
  id: 'main',
  fullName: 'Md. Nabiul Islam',
  headline: 'Graphic Designer, Digital Marketer, AI Automation Enthusiast and Chemistry Student',
  heroDescription:
    'I transform creative ideas into meaningful digital experiences through graphic design, strategic marketing, and intelligent automation. I combine visual creativity with technology to help brands communicate better, grow faster, and work smarter.',
  location: 'Kanchipara, Fulchhari, Gaibandha, Rangpur, Bangladesh',
  email: 'nabi_ul@yahoo.com',
  phone: '01795110021',
  availability: 'Available for freelance projects and full-time opportunities.',
  isAvailable: true,
  profileImageUrl: BUNDLED_ASSETS.portrait,
  cvUrl: '/api/cv/download',
  cvFilename: 'Md_Nabiul_Islam_CV.pdf',
};

export const DEFAULT_ABOUT: AboutData = {
  id: 'main',
  introduction:
    'I am a creative graphic designer and B.Sc Chemistry student from Gaibandha, Bangladesh. My interests extend beyond visual design into digital marketing, artificial intelligence, automation, programming, and emerging technologies.',
  background:
    'I enjoy transforming ideas into meaningful visual communication and developing practical digital solutions. I am hardworking, responsible, a quick learner, and committed to continuous improvement.',
  careerObjective:
    'My goal is to combine creativity, strategic thinking, and technology to deliver impactful results.',
  interests: [
    'Graphic Design & Visual Systems',
    'Digital & Social Media Marketing',
    'AI Automation & n8n Workflows',
    'Web Analytics & Data Tracking',
    'Programming & Creative Technology',
    'Chemical Sciences',
  ],
  portraitImageUrl: BUNDLED_ASSETS.portrait,
};

export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'srv-graphic-design',
    title: 'Graphic Design',
    description:
      'Visual identity systems and precision marketing collateral built to communicate brand clarity across print and digital surfaces.',
    deliverables: [
      'Brand identity',
      'Logo design',
      'Social media graphics',
      'Advertising creatives',
      'Marketing posters',
      'Product mockups',
    ],
    sortOrder: 1,
    status: 'published',
  },
  {
    id: 'srv-social-strategy',
    title: 'Social Media Strategy',
    description:
      'Structured content architecture and platform-native campaign direction engineered for consistent audience engagement.',
    deliverables: [
      'Content planning',
      'Campaign creative strategy',
      'Social media optimization',
      'Brand communication',
    ],
    sortOrder: 2,
    status: 'published',
  },
  {
    id: 'srv-ai-marketing',
    title: 'AI for Marketing',
    description:
      'Integrating generative and analytical AI pipelines into campaign ideation, content scaling, and creative iteration.',
    deliverables: [
      'AI-assisted marketing workflows',
      'Creative automation',
      'AI-powered content processes',
    ],
    sortOrder: 3,
    status: 'published',
  },
  {
    id: 'srv-ai-automation',
    title: 'AI Automation',
    description:
      'End-to-end operational automation connecting messaging bots, spreadsheets, webhooks, and custom APIs with n8n.',
    deliverables: [
      'n8n workflow development',
      'API integrations',
      'Webhook automation',
      'Email automation',
      'Telegram bots',
      'Google Sheets automation',
    ],
    sortOrder: 4,
    status: 'published',
  },
  {
    id: 'srv-web-analytics',
    title: 'Web Analytics',
    description:
      'Instrumenting reliable event tracking and marketing attribution dashboards so creative decisions follow verified signals.',
    deliverables: [
      'Data tracking',
      'Marketing performance analysis',
      'Reporting dashboards',
    ],
    sortOrder: 5,
    status: 'published',
  },
  {
    id: 'srv-training',
    title: 'Training',
    description:
      'Hands-on mentoring and structured workshops empowering students and teams with practical design and automation fluency.',
    deliverables: [
      'Graphic design fundamentals',
      'AI tools',
      'Digital productivity',
      'Automation basics',
    ],
    sortOrder: 6,
    status: 'published',
  },
];

export const DEFAULT_SKILLS: SkillItem[] = [
  // Graphic Design
  { id: 'sk-1', name: 'Brand Identity Systems', category: 'Graphic Design', proficiencyLabel: 'Primary Practice', hasLevel: false, sortOrder: 1, status: 'published' },
  { id: 'sk-2', name: 'Logo & Typography Direction', category: 'Graphic Design', proficiencyLabel: 'Primary Practice', hasLevel: false, sortOrder: 2, status: 'published' },
  { id: 'sk-3', name: 'Social Media & Ad Creatives', category: 'Graphic Design', proficiencyLabel: 'Primary Practice', hasLevel: false, sortOrder: 3, status: 'published' },
  { id: 'sk-4', name: 'Product Mockups & Print Posters', category: 'Graphic Design', proficiencyLabel: 'Primary Practice', hasLevel: false, sortOrder: 4, status: 'published' },
  // Social Media Marketing
  { id: 'sk-5', name: 'Content Planning & Calendars', category: 'Social Media Marketing', proficiencyLabel: 'Strategic', hasLevel: false, sortOrder: 5, status: 'published' },
  { id: 'sk-6', name: 'Campaign Creative Strategy', category: 'Social Media Marketing', proficiencyLabel: 'Strategic', hasLevel: false, sortOrder: 6, status: 'published' },
  { id: 'sk-7', name: 'Social Media Optimization', category: 'Social Media Marketing', proficiencyLabel: 'Strategic', hasLevel: false, sortOrder: 7, status: 'published' },
  // Digital Marketing
  { id: 'sk-8', name: 'Brand Communication', category: 'Digital Marketing', proficiencyLabel: 'Applied', hasLevel: false, sortOrder: 8, status: 'published' },
  { id: 'sk-9', name: 'Performance Analysis & Reporting', category: 'Digital Marketing', proficiencyLabel: 'Applied', hasLevel: false, sortOrder: 9, status: 'published' },
  { id: 'sk-10', name: 'Web Analytics & Tracking', category: 'Digital Marketing', proficiencyLabel: 'Applied', hasLevel: false, sortOrder: 10, status: 'published' },
  // AI and Automation
  { id: 'sk-11', name: 'n8n Workflow Architecture', category: 'AI and Automation', proficiencyLabel: 'Specialized', hasLevel: false, sortOrder: 11, status: 'published' },
  { id: 'sk-12', name: 'API & Webhook Integrations', category: 'AI and Automation', proficiencyLabel: 'Specialized', hasLevel: false, sortOrder: 12, status: 'published' },
  { id: 'sk-13', name: 'Telegram Bots & Email Automation', category: 'AI and Automation', proficiencyLabel: 'Specialized', hasLevel: false, sortOrder: 13, status: 'published' },
  { id: 'sk-14', name: 'AI-Assisted Marketing Systems', category: 'AI and Automation', proficiencyLabel: 'Specialized', hasLevel: false, sortOrder: 14, status: 'published' },
  // Office Productivity
  { id: 'sk-15', name: 'Google Sheets Automation', category: 'Office Productivity', proficiencyLabel: 'Certified Baseline', hasLevel: false, sortOrder: 15, status: 'published' },
  { id: 'sk-16', name: 'Basic Computer Operations & Docs', category: 'Office Productivity', proficiencyLabel: 'Certified Baseline', hasLevel: false, sortOrder: 16, status: 'published' },
  // Technology
  { id: 'sk-17', name: 'Web Technologies & Programming', category: 'Technology', proficiencyLabel: 'Expanding', hasLevel: false, sortOrder: 17, status: 'published' },
  { id: 'sk-18', name: 'Reporting Dashboards', category: 'Technology', proficiencyLabel: 'Applied', hasLevel: false, sortOrder: 18, status: 'published' },
];

export const DEFAULT_STATISTICS: StatisticItem[] = [
  {
    id: 'stat-disciplines',
    value: 6,
    suffix: '',
    label: 'Core Disciplines',
    description: 'Graphic Design, Social Media, AI Marketing, Automation, Analytics & Training',
    isVisible: true,
    sortOrder: 1,
    status: 'published',
  },
  {
    id: 'stat-leadership',
    value: 5,
    suffix: '',
    label: 'Leadership Terms',
    description: 'Elected Class Captain across Classes 2, 3, 6, 7, and 9',
    isVisible: true,
    sortOrder: 2,
    status: 'published',
  },
  {
    id: 'stat-academic',
    value: 5,
    suffix: '',
    label: 'Academic Milestones',
    description: 'From Primary School Certificate through B.Sc (Honours) in Chemistry',
    isVisible: true,
    sortOrder: 3,
    status: 'published',
  },
  {
    id: 'stat-honors',
    value: 2,
    suffix: '',
    label: 'Talent Competition Honors',
    description: '1st at School Level & 2nd at Upazila Level (2018)',
    isVisible: true,
    sortOrder: 4,
    status: 'published',
  },
];

export const DEFAULT_EXPERIENCES: ExperienceItem[] = [
  {
    id: 'exp-asset',
    role: 'Graphic Design for Freelancing',
    organization: 'Uttarbanga Engineering Institute',
    context: 'ASSET Program — Level 3',
    period: 'Vocational & Technical Training',
    description:
      'Completed structured Level 3 competency training under the ASSET Program, mastering commercial graphic design production, branding systems, and freelance creative delivery standards.',
    sortOrder: 1,
    status: 'published',
  },
  {
    id: 'exp-tsc',
    role: 'Basic Computer Operation & Graphic Design',
    organization: 'Gaibandha Government Technical School and College',
    context: 'Technical Certification Track',
    period: 'Technical Training',
    description:
      'Built strong foundational proficiency in digital computing systems, office productivity software, and visual layout composition.',
    sortOrder: 2,
    status: 'published',
  },
  {
    id: 'exp-rabs',
    role: 'Teacher',
    organization: 'RABS Coaching Centre',
    context: 'Tuition mentor for Classes 5–10',
    period: 'Academic Mentoring',
    description:
      'Mentored secondary-level students (Classes 5–10), translating complex science and foundational topics into structured, approachable lessons while cultivating discipline and clarity.',
    sortOrder: 3,
    status: 'published',
  },
];

export const DEFAULT_EDUCATION: EducationItem[] = [
  {
    id: 'edu-bsc',
    degree: 'B.Sc (Honours) in Chemistry',
    institution: 'Gaibandha Government College',
    focus: 'Department of Chemistry',
    period: 'Undergraduate',
    sortOrder: 1,
    status: 'published',
  },
  {
    id: 'edu-hsc',
    degree: 'Higher Secondary Certificate (Science)',
    institution: 'Gaibandha Adarsha College',
    focus: 'Science Group',
    period: 'Higher Secondary',
    sortOrder: 2,
    status: 'published',
  },
  {
    id: 'edu-ssc',
    degree: 'Secondary School Certificate (Science)',
    institution: 'Kanchipara Mohammad Ali United Academy',
    focus: 'Science Group',
    period: 'Secondary',
    sortOrder: 3,
    status: 'published',
  },
  {
    id: 'edu-jsc',
    degree: 'Junior School Certificate',
    institution: 'Kanchipara Mohammad Ali United Academy',
    focus: 'General Studies',
    period: 'Junior Secondary',
    sortOrder: 4,
    status: 'published',
  },
  {
    id: 'edu-psc',
    degree: 'Primary School Certificate',
    institution: 'Medhakunja Vidda Niketon',
    focus: 'Primary Education',
    period: 'Primary',
    sortOrder: 5,
    status: 'published',
  },
];

export const DEFAULT_CATEGORIES: ProjectCategoryItem[] = [
  { id: 'cat-graphic-design', name: 'Graphic Design', slug: 'graphic-design', sortOrder: 1 },
  { id: 'cat-branding', name: 'Branding', slug: 'branding', sortOrder: 2 },
  { id: 'cat-social-media', name: 'Social Media Advertising', slug: 'social-media-advertising', sortOrder: 3 },
  { id: 'cat-digital-marketing', name: 'Digital Marketing', slug: 'digital-marketing', sortOrder: 4 },
  { id: 'cat-ai-automation', name: 'AI Automation', slug: 'ai-automation', sortOrder: 5 },
  { id: 'cat-web-development', name: 'Web Development', slug: 'web-development', sortOrder: 6 },
  { id: 'cat-creative-tech', name: 'Creative Technology', slug: 'creative-technology', sortOrder: 7 },
];

export const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-aurelien-identity',
    slug: 'aurelien-monogram-brand-identity',
    title: 'Aurélien Editorial Brand Identity System',
    category: 'Branding',
    shortDescription:
      'A cohesive luxury visual identity featuring bespoke monogram geometry, tactile stationery mockups, and structured typographic guidelines.',
    overview:
      'Designed an architectural visual identity system focused on restrained luxury, modular layout proportions, and high-contrast metallic foil print specifications.',
    objective:
      'Establish a timeless visual language capable of scaling effortlessly from embossed physical stationery to minimalist digital touchpoints.',
    challenges:
      'Maintaining crisp typographic legibility at micro print sizes while preserving dramatic serif contrast and negative space discipline.',
    approach:
      'Constructed a strict grid ratio system paired with calibrated champagne-gold accents against matte obsidian stock.',
    designProcess:
      'Logo grid geometry exploration, serif/sans pairing trials, physical paper mockup calibration, and comprehensive brand guideline documentation.',
    finalOutput:
      'Complete logo suite, stationery system, editorial grid specification sheet, and print-ready packaging templates.',
    results: '',
    tools: ['Brand Identity', 'Editorial Grid', 'Typography', 'Print Mockups'],
    coverImageUrl: BUNDLED_ASSETS.brandIdentity,
    galleryImages: [
      BUNDLED_ASSETS.brandIdentity,
      BUNDLED_ASSETS.showcasePoster,
    ],
    liveUrl: '',
    sourceUrl: '',
    featured: true,
    status: 'published',
    sortOrder: 1,
  },
  {
    id: 'proj-aurore-campaign',
    slug: 'aurore-social-advertising-suite',
    title: 'Aurore Social Media & Ad Campaign Suite',
    category: 'Social Media Advertising',
    shortDescription:
      'Campaign creative strategy and high-impact mobile-first advertising layouts engineered for luxury fashion storytelling.',
    overview:
      'Developed an integrated social media visual framework uniting editorial portrait direction with crisp mobile carousel compositions.',
    objective:
      'Deliver thumb-stopping social advertising creatives that preserve refined brand authority on small smartphone screens.',
    challenges:
      'Balancing atmospheric editorial photography with concise, readable callouts within strict social feed aspect ratios.',
    approach:
      'Applied high-contrast scrims, minimal serif headlines, and consistent golden-ratio focal framing across every ad variant.',
    designProcess:
      'Audience visual audit, campaign storyboard mapping, mobile device mockup testing, and multi-format creative exports.',
    finalOutput:
      'Multi-ratio social advertising templates, story frames, and unified campaign creative playbook.',
    results: '',
    tools: ['Social Media Strategy', 'Ad Creatives', 'Product Mockups', 'Art Direction'],
    coverImageUrl: BUNDLED_ASSETS.socialCampaign,
    galleryImages: [
      BUNDLED_ASSETS.socialCampaign,
    ],
    liveUrl: '',
    sourceUrl: '',
    featured: true,
    status: 'published',
    sortOrder: 2,
  },
  {
    id: 'proj-n8n-orchestrator',
    slug: 'n8n-ai-marketing-automation-hub',
    title: 'Intelligent n8n Marketing & Lead Automation Hub',
    category: 'AI Automation',
    shortDescription:
      'Modular n8n workflow uniting webhooks, AI content classification, Telegram alerts, and Google Sheets reporting.',
    overview:
      'Architected a connected automation pipeline linking inbound web leads, AI summarization, instant Telegram notifications, and structured Google Sheets logs.',
    objective:
      'Eliminate manual copy-pasting across marketing channels and provide real-time visibility into incoming campaign inquiries.',
    challenges:
      'Ensuring graceful webhook error handling, schema normalization across heterogeneous APIs, and clean data deduplication.',
    approach:
      'Designed decoupled n8n sub-workflows with strict Zod-style payload checks, retry boundaries, and automated email confirmations.',
    designProcess:
      'Process mapping, API contract definition, n8n node orchestration, webhook stress validation, and dashboard metric wiring.',
    finalOutput:
      'Production-ready n8n workflow blueprint, Telegram bot notifier, and automated Google Sheets analytics ledger.',
    results: '',
    tools: ['n8n Workflows', 'API Integrations', 'Webhooks', 'Telegram Bots', 'Google Sheets'],
    coverImageUrl: BUNDLED_ASSETS.aiAutomation,
    galleryImages: [
      BUNDLED_ASSETS.aiAutomation,
    ],
    liveUrl: '',
    sourceUrl: '',
    featured: true,
    status: 'published',
    sortOrder: 3,
  },
];

export const DEFAULT_CERTIFICATIONS: CertificationItem[] = [
  {
    id: 'cert-asset-l3',
    name: 'Graphic Design for Freelancing (ASSET Program — Level 3)',
    organization: 'Uttarbanga Engineering Institute',
    issueDate: 'Verified Program',
    credentialId: '',
    imageUrl: '',
    verificationUrl: '',
    sortOrder: 1,
    status: 'published',
  },
  {
    id: 'cert-basic-comp',
    name: 'Basic Computer Operation & Graphic Design',
    organization: 'Gaibandha Government Technical School and College',
    issueDate: 'Verified Program',
    credentialId: '',
    imageUrl: '',
    verificationUrl: '',
    sortOrder: 2,
    status: 'published',
  },
];

export const DEFAULT_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'ach-talent-2018',
    title: 'Creative Talent Exploration Competition (2018)',
    organization: 'School & Upazila Level — Junior Secondary Category',
    year: '2018',
    details: 'Secured 1st Place at School Level and 2nd Place at Upazila Level in the Junior Secondary category.',
    category: 'Academic & Creative Competition',
    sortOrder: 1,
    status: 'published',
  },
  {
    id: 'ach-class-captain',
    title: 'Leadership — Elected Class Captain',
    organization: 'School Leadership Record',
    year: 'Classes 2, 3, 6, 7 & 9',
    details: 'Trusted by peers and faculty to serve as Class Captain across five academic years (Classes 2, 3, 6, 7, and 9).',
    category: 'Leadership',
    sortOrder: 2,
    status: 'published',
  },
];

export const DEFAULT_SOCIAL_LINKS: SocialLinkItem[] = [
  { id: 'soc-linkedin', platform: 'LinkedIn', url: '', isVisible: false, sortOrder: 1 },
  { id: 'soc-facebook', platform: 'Facebook', url: '', isVisible: false, sortOrder: 2 },
  { id: 'soc-instagram', platform: 'Instagram', url: '', isVisible: false, sortOrder: 3 },
  { id: 'soc-x', platform: 'X / Twitter', url: '', isVisible: false, sortOrder: 4 },
  { id: 'soc-github', platform: 'GitHub', url: '', isVisible: false, sortOrder: 5 },
  { id: 'soc-behance', platform: 'Behance', url: '', isVisible: false, sortOrder: 6 },
  { id: 'soc-dribbble', platform: 'Dribbble', url: '', isVisible: false, sortOrder: 7 },
  { id: 'soc-youtube', platform: 'YouTube', url: '', isVisible: false, sortOrder: 8 },
];

export const DEFAULT_SETTINGS: SiteSettingsData = {
  id: 'main',
  siteTitle: 'Md. Nabiul Islam | Graphic Designer, Digital Marketer & AI Automation Specialist',
  tagline: 'Creative Thinking. Strategic Design. Intelligent Automation.',
  seoDescription:
    'Portfolio of Md. Nabiul Islam — Graphic Designer, Digital Marketer, AI Automation Enthusiast and Chemistry Student from Gaibandha, Bangladesh.',
  ogImageUrl: BUNDLED_ASSETS.portrait,
  showcaseVideoUrl: '/media/creative-showcase.mp4',
  showcasePosterUrl: BUNDLED_ASSETS.showcasePoster,
  marqueeText:
    'GRAPHIC DESIGN — BRAND IDENTITY — DIGITAL MARKETING — AI AUTOMATION — N8N WORKFLOWS — SOCIAL MEDIA STRATEGY — WEB ANALYTICS — CREATIVE TECHNOLOGY',
  accentGoldHex: '#D4B475',
  enable3D: true,
  enableCustomCursor: true,
};

export const DEFAULT_PORTFOLIO_BUNDLE: PortfolioBundle = {
  profile: DEFAULT_PROFILE,
  about: DEFAULT_ABOUT,
  services: DEFAULT_SERVICES,
  skills: DEFAULT_SKILLS,
  statistics: DEFAULT_STATISTICS,
  experiences: DEFAULT_EXPERIENCES,
  education: DEFAULT_EDUCATION,
  categories: DEFAULT_CATEGORIES,
  projects: DEFAULT_PROJECTS,
  certifications: DEFAULT_CERTIFICATIONS,
  achievements: DEFAULT_ACHIEVEMENTS,
  testimonials: [],
  socialLinks: DEFAULT_SOCIAL_LINKS,
  settings: DEFAULT_SETTINGS,
};
