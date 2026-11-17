import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
  DEFAULT_PORTFOLIO_BUNDLE,
  DEFAULT_PROFILE,
  DEFAULT_PROJECTS,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
  DEFAULT_SKILLS,
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_STATISTICS,
} from '../data/seedDefaults';
import type {
  AboutData,
  AchievementItem,
  CertificationItem,
  ContactMessageItem,
  EducationItem,
  ExperienceItem,
  MediaAssetItem,
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
} from '../types/portfolio';
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
      // Check if any doc exists at all? We cannot list drafts publicly, so if empty return fallback
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
      services,
      skills,
      statistics,
      experiences,
      education,
      projects,
      certifications,
      achievements,
      testimonials,
    ] = await Promise.all([
      getDoc(doc(db, 'profiles', 'main')).catch(() => null),
      getDoc(doc(db, 'about_sections', 'main')).catch(() => null),
      getDoc(doc(db, 'site_settings', 'main')).catch(() => null),
      getDocs(collection(db, 'project_categories')).catch(() => null),
      getDocs(collection(db, 'social_links')).catch(() => null),
      fetchPublishedCollection<ServiceItem>('services', DEFAULT_SERVICES),
      fetchPublishedCollection<SkillItem>('skills', DEFAULT_SKILLS),
      fetchPublishedCollection<StatisticItem>('statistics', DEFAULT_STATISTICS),
      fetchPublishedCollection<ExperienceItem>('experiences', DEFAULT_EXPERIENCES),
      fetchPublishedCollection<EducationItem>('education', DEFAULT_EDUCATION),
      fetchPublishedCollection<ProjectItem>('projects', DEFAULT_PROJECTS),
      fetchPublishedCollection<CertificationItem>('certifications', DEFAULT_CERTIFICATIONS),
      fetchPublishedCollection<AchievementItem>('achievements', DEFAULT_ACHIEVEMENTS),
      fetchPublishedCollection<TestimonialItem>('testimonials', []),
    ]);

    const profile: ProfileData =
      profileSnap && profileSnap.exists()
        ? { ...(profileSnap.data() as ProfileData), id: profileSnap.id }
        : DEFAULT_PROFILE;

    const about: AboutData =
      aboutSnap && aboutSnap.exists()
        ? { ...(aboutSnap.data() as AboutData), id: aboutSnap.id }
        : DEFAULT_ABOUT;

    const settings: SiteSettingsData =
      settingsSnap && settingsSnap.exists()
        ? { ...(settingsSnap.data() as SiteSettingsData), id: settingsSnap.id }
        : DEFAULT_SETTINGS;

    const categories: ProjectCategoryItem[] =
      categoriesSnap && !categoriesSnap.empty
        ? sortByOrder(categoriesSnap.docs.map((d) => ({ ...(d.data() as ProjectCategoryItem), id: d.id })))
        : sortByOrder(DEFAULT_CATEGORIES);

    const socialLinks: SocialLinkItem[] =
      socialSnap && !socialSnap.empty
        ? sortByOrder(socialSnap.docs.map((d) => ({ ...(d.data() as SocialLinkItem), id: d.id })))
        : sortByOrder(DEFAULT_SOCIAL_LINKS);

    return {
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
      settings,
    };
  } catch (error) {
    console.warn('Using verified default portfolio bundle:', error);
    return DEFAULT_PORTFOLIO_BUNDLE;
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
      return { ...(d.data() as ProjectItem), id: d.id };
    }
  } catch (error) {
    console.warn('Project slug lookup fallback:', error);
  }
  return DEFAULT_PROJECTS.find((p) => p.slug === slug) ?? null;
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

    const profileSnap = await getDoc(doc(db, 'profiles', 'main'));
    if (profileSnap.exists()) return;

    const batch = writeBatch(db);
    const ts = serverTimestamp();

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

export async function fetchAdminAllData() {
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
    messagesSnap,
    mediaSnap,
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
    getDocs(query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'))).catch((err) =>
      handleFirestoreError(err, OperationType.LIST, 'contact_messages')
    ),
    getDocs(query(collection(db, 'media_assets'), orderBy('createdAt', 'desc'))).catch((err) =>
      handleFirestoreError(err, OperationType.LIST, 'media_assets')
    ),
  ]);

  const messages = messagesSnap.docs.map((d) => ({
    ...(d.data() as ContactMessageItem),
    id: d.id,
  }));

  const media = mediaSnap.docs.map((d) => ({
    ...(d.data() as MediaAssetItem),
    id: d.id,
  }));

  return {
    profile: profileSnap.exists()
      ? ({ ...(profileSnap.data() as ProfileData), id: profileSnap.id } as ProfileData)
      : DEFAULT_PROFILE,
    about: aboutSnap.exists()
      ? ({ ...(aboutSnap.data() as AboutData), id: aboutSnap.id } as AboutData)
      : DEFAULT_ABOUT,
    settings: settingsSnap.exists()
      ? ({ ...(settingsSnap.data() as SiteSettingsData), id: settingsSnap.id } as SiteSettingsData)
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
    messages,
    media,
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

export function slugifyId(prefix: string, input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${base || 'item'}-${rand}`;
}
