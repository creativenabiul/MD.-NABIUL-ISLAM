import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_ABOUT,
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_CATEGORIES,
  DEFAULT_CERTIFICATIONS,
  DEFAULT_EDUCATION,
  DEFAULT_EXPERIENCES,
  DEFAULT_NAVIGATION_ITEMS,
  DEFAULT_PORTFOLIO_BUNDLE,
  DEFAULT_PROFILE,
  DEFAULT_PROJECTS,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
  DEFAULT_SKILLS,
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_STATISTICS,
  DEFAULT_WEBSITE_SECTIONS,
} from '../data/seedDefaults';
import type {
  AboutData,
  AchievementItem,
  ActivityLogItem,
  CertificationItem,
  ContactMessageItem,
  ContentVersionItem,
  EducationItem,
  ExperienceItem,
  MediaAssetItem,
  NavigationItem,
  PortfolioBundle,
  ProfileData,
  ProjectCategoryItem,
  ProjectItem,
  ServiceItem,
  SiteSettingsData,
  SkillItem,
  SocialLinkItem,
  StatisticItem,
  TestimonialItem,
  WebsiteSectionItem,
} from '../types/portfolio';
import { normalizePortfolioBundle, normalizeProject } from './assetUrl';
import { db, handleFirestoreError, OperationType } from './firebase';

function sortByOrder<T extends { sortOrder?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

async function fetchPublishedCollection<T extends { id: string; sortOrder?: number }>(
  colName: string,
  fallback: T[]
): Promise<T[]> {
  try {
    const q = query(collection(db, colName), where('status', '==', 'published'));
    const snap = await getDocs(q);
    if (snap.empty) {
      return sortByOrder(fallback);
    }
    const items = snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
    return sortByOrder(items);
  } catch (error) {
    console.warn(`Public query fallback for ${colName}:`, error);
    return sortByOrder(fallback);
  }
}

async function fetchAllCollection<T extends { id: string; sortOrder?: number }>(
  colName: string
): Promise<T[]> {
  try {
    const snap = await getDocs(collection(db, colName));
    const items = snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
    return sortByOrder(items);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colName);
  }
}

export async function fetchPublicPortfolio(): Promise<PortfolioBundle> {
  try {
    const [
      profileSnap,
      aboutSnap,
      settingsSnap,
      categoriesSnap,
      socialSnap,
      navSnap,
      services,
      skills,
      statistics,
      experiences,
      education,
      projects,
      certifications,
      achievements,
      testimonials,
      websiteSections,
    ] = await Promise.all([
      getDoc(doc(db, 'profiles', 'main')).catch(() => null),
      getDoc(doc(db, 'about_sections', 'main')).catch(() => null),
      getDoc(doc(db, 'site_settings', 'main')).catch(() => null),
      getDocs(collection(db, 'project_categories')).catch(() => null),
      getDocs(collection(db, 'social_links')).catch(() => null),
      getDocs(collection(db, 'navigation_items')).catch(() => null),
      fetchPublishedCollection<ServiceItem>('services', DEFAULT_SERVICES),
      fetchPublishedCollection<SkillItem>('skills', DEFAULT_SKILLS),
      fetchPublishedCollection<StatisticItem>('statistics', DEFAULT_STATISTICS),
      fetchPublishedCollection<ExperienceItem>('experiences', DEFAULT_EXPERIENCES),
      fetchPublishedCollection<EducationItem>('education', DEFAULT_EDUCATION),
      fetchPublishedCollection<ProjectItem>('projects', DEFAULT_PROJECTS),
      fetchPublishedCollection<CertificationItem>('certifications', DEFAULT_CERTIFICATIONS),
      fetchPublishedCollection<AchievementItem>('achievements', DEFAULT_ACHIEVEMENTS),
      fetchPublishedCollection<TestimonialItem>('testimonials', []),
      fetchPublishedCollection<WebsiteSectionItem>('website_sections', DEFAULT_WEBSITE_SECTIONS),
    ]);

    const profile: ProfileData =
      profileSnap && profileSnap.exists()
        ? { ...DEFAULT_PROFILE, ...(profileSnap.data() as ProfileData), id: profileSnap.id }
        : DEFAULT_PROFILE;

    const about: AboutData =
      aboutSnap && aboutSnap.exists()
        ? { ...DEFAULT_ABOUT, ...(aboutSnap.data() as AboutData), id: aboutSnap.id }
        : DEFAULT_ABOUT;

    const settings: SiteSettingsData =
      settingsSnap && settingsSnap.exists()
        ? { ...DEFAULT_SETTINGS, ...(settingsSnap.data() as SiteSettingsData), id: settingsSnap.id }
        : DEFAULT_SETTINGS;

    const categories: ProjectCategoryItem[] =
      categoriesSnap && !categoriesSnap.empty
        ? sortByOrder(categoriesSnap.docs.map((d) => ({ ...(d.data() as ProjectCategoryItem), id: d.id })))
        : sortByOrder(DEFAULT_CATEGORIES);

    const socialLinks: SocialLinkItem[] =
      socialSnap && !socialSnap.empty
        ? sortByOrder(socialSnap.docs.map((d) => ({ ...(d.data() as SocialLinkItem), id: d.id })))
        : sortByOrder(DEFAULT_SOCIAL_LINKS);

    const navigationItems: NavigationItem[] =
      navSnap && !navSnap.empty
        ? sortByOrder(navSnap.docs.map((d) => ({ ...(d.data() as NavigationItem), id: d.id })))
        : sortByOrder(DEFAULT_NAVIGATION_ITEMS);

    return normalizePortfolioBundle({
      profile,
      about,
      services,
      skills,
      statistics,
      experiences,
      education,
      categories,
      projects,
      certifications,
      achievements,
      testimonials,
      socialLinks,
      websiteSections: websiteSections.filter((s) => s.isVisible),
      navigationItems,
      settings,
    });
  } catch (error) {
    console.warn('Using verified default portfolio bundle:', error);
    return normalizePortfolioBundle(DEFAULT_PORTFOLIO_BUNDLE);
  }
}

export async function fetchPublicProjectBySlug(slug: string): Promise<ProjectItem | null> {
  try {
    const q = query(
      collection(db, 'projects'),
      where('status', '==', 'published'),
      where('slug', '==', slug)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return normalizeProject({ ...(d.data() as ProjectItem), id: d.id });
    }
  } catch (error) {
    console.warn('Project slug lookup fallback:', error);
  }
  const fallback = DEFAULT_PROJECTS.find((p) => p.slug === slug) ?? null;
  return fallback ? normalizeProject(fallback) : null;
}

export async function ensureAdminSeeded(uid: string, email: string): Promise<void> {
  try {
    const adminRef = doc(db, 'admins', uid);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        uid,
        email,
        role: 'super_admin',
        createdAt: serverTimestamp(),
      });
    }

    const ts = serverTimestamp();

    // Ensure navigation_items exist even on upgraded databases
    const navSnap = await getDocs(query(collection(db, 'navigation_items'), limit(1)));
    if (navSnap.empty) {
      const navBatch = writeBatch(db);
      for (const nav of DEFAULT_NAVIGATION_ITEMS) {
        const { id, ...rest } = nav;
        navBatch.set(doc(db, 'navigation_items', id), { ...rest, updatedAt: ts });
      }
      await navBatch.commit();
    }

    const profileSnap = await getDoc(doc(db, 'profiles', 'main'));
    if (profileSnap.exists()) return;

    const batch = writeBatch(db);

    const { id: _pId, ...profileBody } = DEFAULT_PROFILE;
    batch.set(doc(db, 'profiles', 'main'), { ...profileBody, updatedAt: ts });

    const { id: _aId, ...aboutBody } = DEFAULT_ABOUT;
    batch.set(doc(db, 'about_sections', 'main'), { ...aboutBody, updatedAt: ts });

    const { id: _sId, ...settingsBody } = DEFAULT_SETTINGS;
    batch.set(doc(db, 'site_settings', 'main'), { ...settingsBody, updatedAt: ts });

    for (const item of DEFAULT_SERVICES) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'services', id), { ...rest, updatedAt: ts });
    }
    for (const item of DEFAULT_SKILLS) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'skills', id), { ...rest, updatedAt: ts });
    }
    for (const item of DEFAULT_STATISTICS) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'statistics', id), { ...rest, updatedAt: ts });
    }
    for (const item of DEFAULT_EXPERIENCES) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'experiences', id), { ...rest, updatedAt: ts });
    }
    for (const item of DEFAULT_EDUCATION) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'education', id), { ...rest, updatedAt: ts });
    }
    for (const item of DEFAULT_CATEGORIES) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'project_categories', id), { ...rest, updatedAt: ts });
    }
    for (const item of DEFAULT_PROJECTS) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'projects', id), { ...rest, createdAt: ts, updatedAt: ts });
    }
    for (const item of DEFAULT_CERTIFICATIONS) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'certifications', id), { ...rest, updatedAt: ts });
    }
    for (const item of DEFAULT_ACHIEVEMENTS) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'achievements', id), { ...rest, updatedAt: ts });
    }
    for (const item of DEFAULT_SOCIAL_LINKS) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'social_links', id), { ...rest, updatedAt: ts });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'initial_seed');
  }
}

export interface AdminAllData {
  profile: ProfileData;
  about: AboutData;
  settings: SiteSettingsData;
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
  messages: ContactMessageItem[];
  media: MediaAssetItem[];
  activityLogs: ActivityLogItem[];
  contentVersions: ContentVersionItem[];
}

export async function fetchAdminAllData(): Promise<AdminAllData> {
  const [
    profileSnap,
    aboutSnap,
    settingsSnap,
    services,
    skills,
    statistics,
    experiences,
    education,
    categories,
    projects,
    certifications,
    achievements,
    testimonials,
    socialLinks,
    websiteSections,
    navigationItems,
    messagesSnap,
    mediaSnap,
    logsSnap,
    versionsSnap,
  ] = await Promise.all([
    getDoc(doc(db, 'profiles', 'main')),
    getDoc(doc(db, 'about_sections', 'main')),
    getDoc(doc(db, 'site_settings', 'main')),
    fetchAllCollection<ServiceItem>('services'),
    fetchAllCollection<SkillItem>('skills'),
    fetchAllCollection<StatisticItem>('statistics'),
    fetchAllCollection<ExperienceItem>('experiences'),
    fetchAllCollection<EducationItem>('education'),
    fetchAllCollection<ProjectCategoryItem>('project_categories'),
    fetchAllCollection<ProjectItem>('projects'),
    fetchAllCollection<CertificationItem>('certifications'),
    fetchAllCollection<AchievementItem>('achievements'),
    fetchAllCollection<TestimonialItem>('testimonials'),
    fetchAllCollection<SocialLinkItem>('social_links'),
    fetchAllCollection<WebsiteSectionItem>('website_sections'),
    fetchAllCollection<NavigationItem>('navigation_items'),
    getDocs(query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'))).catch((err) =>
      handleFirestoreError(err, OperationType.LIST, 'contact_messages')
    ),
    getDocs(query(collection(db, 'media_assets'), orderBy('createdAt', 'desc'))).catch((err) =>
      handleFirestoreError(err, OperationType.LIST, 'media_assets')
    ),
    getDocs(query(collection(db, 'activity_logs'), orderBy('createdAt', 'desc'), limit(120))).catch(() => null),
    getDocs(query(collection(db, 'content_versions'), orderBy('createdAt', 'desc'), limit(40))).catch(() => null),
  ]);

  const messages = messagesSnap.docs.map((d) => ({
    ...(d.data() as ContactMessageItem),
    id: d.id,
  }));

  const media = mediaSnap.docs.map((d) => ({
    ...(d.data() as MediaAssetItem),
    id: d.id,
  }));

  const activityLogs = logsSnap
    ? logsSnap.docs.map((d) => ({ ...(d.data() as ActivityLogItem), id: d.id }))
    : [];

  const contentVersions = versionsSnap
    ? versionsSnap.docs.map((d) => ({ ...(d.data() as ContentVersionItem), id: d.id }))
    : [];

  return {
    profile: profileSnap.exists()
      ? ({ ...DEFAULT_PROFILE, ...(profileSnap.data() as ProfileData), id: profileSnap.id } as ProfileData)
      : DEFAULT_PROFILE,
    about: aboutSnap.exists()
      ? ({ ...DEFAULT_ABOUT, ...(aboutSnap.data() as AboutData), id: aboutSnap.id } as AboutData)
      : DEFAULT_ABOUT,
    settings: settingsSnap.exists()
      ? ({ ...DEFAULT_SETTINGS, ...(settingsSnap.data() as SiteSettingsData), id: settingsSnap.id } as SiteSettingsData)
      : DEFAULT_SETTINGS,
    services,
    skills,
    statistics,
    experiences,
    education,
    categories,
    projects,
    certifications,
    achievements,
    testimonials,
    socialLinks,
    websiteSections,
    navigationItems,
    messages,
    media,
    activityLogs,
    contentVersions,
  };
}

export async function saveDocument(
  colName: string,
  docId: string,
  payload: object,
  isNewWithCreatedAt = false
): Promise<void> {
  const path = `${colName}/${docId}`;
  try {
    const cleanPayload: Record<string, unknown> = { ...payload };
    delete cleanPayload.id;
    Object.keys(cleanPayload).forEach((k) => {
      if (cleanPayload[k] === undefined) {
        delete cleanPayload[k];
      }
    });
    if (isNewWithCreatedAt) {
      cleanPayload.createdAt = serverTimestamp();
    }
    cleanPayload.updatedAt = serverTimestamp();
    await setDoc(doc(db, colName, docId), cleanPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateMessageStatus(
  msgId: string,
  status: 'unread' | 'read' | 'archived'
): Promise<void> {
  const path = `contact_messages/${msgId}`;
  try {
    await updateDoc(doc(db, 'contact_messages', msgId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeDocument(colName: string, docId: string): Promise<void> {
  const path = `${colName}/${docId}`;
  try {
    await deleteDoc(doc(db, colName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function logAdminActivity(
  actorEmail: string | null | undefined,
  action: ActivityLogItem['action'],
  entityType: string,
  entityId: string,
  summary: string
): Promise<void> {
  if (!actorEmail) return;
  try {
    const logId = slugifyId('log', `${action}-${entityType}`);
    await setDoc(doc(db, 'activity_logs', logId), {
      actorEmail: actorEmail.slice(0, 180),
      action,
      entityType: entityType.slice(0, 60),
      entityId: entityId.slice(0, 128),
      summary: summary.slice(0, 400),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Activity log write skipped:', err);
  }
}

export async function saveContentVersion(
  entityType: string,
  entityId: string,
  label: string,
  snapshot: unknown,
  actorEmail: string | null | undefined
): Promise<void> {
  if (!actorEmail) return;
  try {
    const serialized = JSON.stringify(snapshot).slice(0, 39500);
    const versionId = slugifyId('ver', `${entityType}-${entityId}`);
    await setDoc(doc(db, 'content_versions', versionId), {
      entityType: entityType.slice(0, 60),
      entityId: entityId.slice(0, 128),
      label: label.slice(0, 180),
      snapshotJson: serialized,
      actorEmail: actorEmail.slice(0, 180),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Version snapshot skipped:', err);
  }
}

export async function restoreContentVersion(
  version: ContentVersionItem,
  actorEmail: string | null | undefined
): Promise<void> {
  const parsed = JSON.parse(version.snapshotJson) as Record<string, unknown>;
  const colMap: Record<string, string> = {
    profile: 'profiles',
    about: 'about_sections',
    settings: 'site_settings',
    project: 'projects',
    section: 'website_sections',
  };
  const colName = colMap[version.entityType] || version.entityType;
  const payload = { ...parsed };
  delete payload.createdAt;
  delete payload.updatedAt;
  await saveDocument(colName, version.entityId, payload, false);
  await logAdminActivity(
    actorEmail,
    'restore_version',
    version.entityType,
    version.entityId,
    `Restored snapshot "${version.label}"`
  );
}

export function buildPortfolioBackupPayload(adminData: AdminAllData) {
  return {
    exportedAt: new Date().toISOString(),
    owner: adminData.profile.fullName,
    profile: adminData.profile,
    about: adminData.about,
    settings: adminData.settings,
    services: adminData.services,
    skills: adminData.skills,
    statistics: adminData.statistics,
    experiences: adminData.experiences,
    education: adminData.education,
    categories: adminData.categories,
    projects: adminData.projects,
    certifications: adminData.certifications,
    achievements: adminData.achievements,
    testimonials: adminData.testimonials,
    socialLinks: adminData.socialLinks,
    websiteSections: adminData.websiteSections,
    navigationItems: adminData.navigationItems,
    media: adminData.media,
  };
}

export function slugifyId(prefix: string, input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${base || 'item'}-${rand}`;
}
