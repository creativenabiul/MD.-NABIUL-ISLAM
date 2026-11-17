import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Link, Navigate, NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Award,
  BarChart3,
  Briefcase,
  Compass,
  ExternalLink,
  FolderKanban,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  Layers,
  LogOut,
  Menu,
  MessageSquareQuote,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Trophy,
  UserCheck,
  UserCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { fetchAdminAllData } from '../../lib/portfolioService';

export type AdminDataset = Awaited<ReturnType<typeof fetchAdminAllData>>;

interface AdminDataContextValue {
  adminData: AdminDataset | null;
  loading: boolean;
  error: string | null;
  reloadAdmin: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextValue>({
  adminData: null,
  loading: true,
  error: null,
  reloadAdmin: async () => {},
});

export function useAdminData() {
  return useContext(AdminDataContext);
}

const ADMIN_NAV_GROUPS = [
  {
    group: 'Overview',
    items: [{ to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    group: 'Identity & Pages',
    items: [
      { to: '/admin/profile', label: 'Profile & CV', icon: UserCheck },
      { to: '/admin/hero', label: 'Hero', icon: Sparkles },
      { to: '/admin/about', label: 'About', icon: UserCircle2 },
    ],
  },
  {
    group: 'Portfolio Content',
    items: [
      { to: '/admin/services', label: 'Services', icon: Layers },
      { to: '/admin/skills', label: 'Skills', icon: Sparkles },
      { to: '/admin/statistics', label: 'Statistics', icon: BarChart3 },
      { to: '/admin/experience', label: 'Experience', icon: Briefcase },
      { to: '/admin/education', label: 'Education', icon: GraduationCap },
      { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
      { to: '/admin/certifications', label: 'Certifications', icon: Award },
      { to: '/admin/achievements', label: 'Achievements', icon: Trophy },
      { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
    ],
  },
  {
    group: 'Builder & Media',
    items: [
      { to: '/admin/sections', label: 'Section Builder', icon: LayoutTemplate },
      { to: '/admin/media', label: 'Media Library', icon: ImageIcon },
      { to: '/admin/navigation', label: 'Navigation', icon: Compass },
    ],
  },
  {
    group: 'Growth & Inbox',
    items: [
      { to: '/admin/messages', label: 'Messages', icon: Inbox },
      { to: '/admin/seo', label: 'SEO', icon: Globe },
      { to: '/admin/design', label: 'Design Settings', icon: Palette },
    ],
  },
  {
    group: 'System & Audit',
    items: [
      { to: '/admin/security', label: 'Security', icon: ShieldCheck },
      { to: '/admin/logs', label: 'Activity Logs', icon: Activity },
      { to: '/admin/settings', label: 'Website Settings', icon: Settings },
    ],
  },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading: authLoading, logout, idleMinutes, setIdleMinutes } = useAuth();
  const { refresh: refreshPublic } = usePortfolio();
  const [adminData, setAdminData] = useState<AdminDataset | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [lightAdminUi, setLightAdminUi] = useState(false);
  const location = useLocation();

  const reloadAdmin = useCallback(async () => {
    setDataLoading(true);
    setError(null);
    try {
      const res = await fetchAdminAllData();
      setAdminData(res);
      if (res.settings.sessionTimeoutMinutes) {
        setIdleMinutes(res.settings.sessionTimeoutMinutes);
      }
      await refreshPublic();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin database records.');
    } finally {
      setDataLoading(false);
    }
  }, [refreshPublic, setIdleMinutes]);

  useEffect(() => {
    if (isAdmin) {
      reloadAdmin();
    }
  }, [isAdmin, reloadAdmin]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070708] text-[#F5F2EB] flex items-center justify-center text-sm">
        Verifying administrator session...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const unreadCount = adminData?.messages.filter((m) => m.status === 'unread').length ?? 0;

  return (
    <AdminDataContext.Provider value={{ adminData, loading: dataLoading, error, reloadAdmin }}>
      <div
        className={`min-h-screen flex flex-col lg:flex-row transition-colors ${
          lightAdminUi ? 'bg-[#F5F4F0] text-[#141417]' : 'bg-[#070708] text-[#F5F2EB]'
        }`}
      >
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#0d0d10] text-[#F5F2EB]">
          <span className="font-serif text-lg font-semibold text-[#D4B475]">
            Portfolio CMS
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen((p) => !p)}
            aria-label="Toggle admin navigation"
            className="p-2 rounded-lg border border-white/15 text-[#F5F2EB]"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Independent Admin Sidebar (22 Modules) */}
        <aside
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } lg:flex lg:w-72 lg:shrink-0 flex-col justify-between border-r border-white/10 bg-[#0b0b0e] text-[#F5F2EB] p-5 lg:max-h-screen lg:sticky lg:top-0 lg:overflow-y-auto`}
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#D4B475]">
                  CMS Studio
                </p>
                <p className="mt-0.5 font-serif text-xl font-semibold text-[#F5F2EB] truncate">
                  {adminData?.profile.fullName || 'Md. Nabiul Islam'}
                </p>
                <p className="mt-0.5 text-[11px] text-[#8C8A84] truncate">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setLightAdminUi((p) => !p)}
                title="Toggle Admin Panel Contrast"
                className="p-1.5 rounded-lg border border-white/10 text-[#8C8A84] hover:text-[#D4B475]"
              >
                <SunMedium className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sidebar quick search */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141418] border border-white/10">
              <Search className="w-3.5 h-3.5 text-[#8C8A84] shrink-0" />
              <input
                type="text"
                placeholder="Filter modules..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-[#F5F2EB] focus:outline-none"
              />
            </div>

            <nav aria-label="Admin sections" className="space-y-4">
              {ADMIN_NAV_GROUPS.map((grp) => {
                const visibleItems = grp.items.filter(
                  (item) => !navSearch.trim() || item.label.toLowerCase().includes(navSearch.toLowerCase())
                );
                if (visibleItems.length === 0) return null;
                return (
                  <div key={grp.group} className="space-y-1">
                    <p className="px-3 text-[10px] font-mono uppercase tracking-[0.18em] text-[#8C8A84]/80">
                      {grp.group}
                    </p>
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            `flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isActive
                                ? 'bg-[#D4B475] text-[#070708]'
                                : 'text-[#F5F2EB]/75 hover:text-[#F5F2EB] hover:bg-white/5'
                            }`
                          }
                        >
                          <span className="flex items-center gap-2.5 truncate">
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.to === '/admin/messages' && unreadCount > 0 && (
                            <span className="font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-black/30">
                              {unreadCount}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="pt-5 mt-5 border-t border-white/10 space-y-2">
            <div className="px-3 text-[10px] font-mono text-[#8C8A84] flex items-center justify-between">
              <span>Idle timeout</span>
              <span>{idleMinutes}m</span>
            </div>
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#D4B475] hover:bg-white/5 transition-colors"
            >
              <span>Preview Live Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10 max-w-6xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-sm text-rose-200">
              {error}
            </div>
          )}
          {children}
        </main>
      </div>
    </AdminDataContext.Provider>
  );
}
