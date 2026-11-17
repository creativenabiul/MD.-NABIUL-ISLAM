import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Link, Navigate, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  FolderKanban,
  Briefcase,
  BarChart3,
  GraduationCap,
  Award,
  MessageSquareQuote,
  Inbox,
  Image as ImageIcon,
  Settings,
  LogOut,
  ExternalLink,
  Layers,
  Sparkles,
  Menu,
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

const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/profile', label: 'Profile & About', icon: UserCheck },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/services', label: 'Services', icon: Layers },
  { to: '/admin/skills', label: 'Skills', icon: Sparkles },
  { to: '/admin/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/admin/experience', label: 'Experience & Awards', icon: Briefcase },
  { to: '/admin/education', label: 'Education', icon: GraduationCap },
  { to: '/admin/certifications', label: 'Certifications', icon: Award },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { to: '/admin/messages', label: 'Messages', icon: Inbox },
  { to: '/admin/media', label: 'Media Library', icon: ImageIcon },
  { to: '/admin/settings', label: 'Settings & Social', icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const { refresh: refreshPublic } = usePortfolio();
  const [adminData, setAdminData] = useState<AdminDataset | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const reloadAdmin = useCallback(async () => {
    setDataLoading(true);
    setError(null);
    try {
      const res = await fetchAdminAllData();
      setAdminData(res);
      await refreshPublic();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin database records.');
    } finally {
      setDataLoading(false);
    }
  }, [refreshPublic]);

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
      <div className="min-h-screen bg-[#070708] text-[#F5F2EB] flex flex-col lg:flex-row">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#0d0d10]">
          <span className="font-serif text-lg font-semibold text-[#D4B475]">
            Portfolio Admin
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

        {/* Independent Admin Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } lg:flex lg:w-64 lg:shrink-0 flex-col justify-between border-r border-white/10 bg-[#0b0b0e] p-5`}
        >
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#D4B475]">
                Content Studio
              </p>
              <p className="mt-1 font-serif text-xl font-semibold text-[#F5F2EB]">
                Md. Nabiul Islam
              </p>
              <p className="mt-0.5 text-xs text-[#8C8A84] truncate">{user.email}</p>
            </div>

            <nav aria-label="Admin sections" className="space-y-1">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#D4B475] text-[#070708]'
                          : 'text-[#F5F2EB]/75 hover:text-[#F5F2EB] hover:bg-white/5'
                      }`
                    }
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.to === '/admin/messages' && unreadCount > 0 && (
                      <span className="font-mono text-[11px] tabular-nums px-1.5 py-0.5 rounded bg-black/25">
                        {unreadCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10 space-y-2">
            <Link
              to="/"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#D4B475] hover:bg-white/5 transition-colors"
            >
              <span>Public Portfolio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={logout}
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
