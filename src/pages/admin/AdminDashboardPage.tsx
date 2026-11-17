import { Link } from 'react-router-dom';
import {
  Activity,
  Award,
  Clock,
  Eye,
  FileText,
  FolderKanban,
  HardDrive,
  Image as ImageIcon,
  Inbox,
  Layers,
  LayoutTemplate,
  Plus,
} from 'lucide-react';
import { AdminLayout, useAdminData } from './AdminLayout';
import { formatFirestoreTime } from '../../components/admin/AdminUi';

function DashboardInner() {
  const { adminData, loading } = useAdminData();

  if (loading || !adminData) {
    return <div className="text-sm text-[#8C8A84]">Loading database overview...</div>;
  }

  const totalProjects = adminData.projects.length;
  const publishedProjects = adminData.projects.filter((p) => p.status === 'published').length;
  const draftProjects = adminData.projects.filter((p) => p.status === 'draft').length;
  const totalServices = adminData.services.length;
  const totalSections = adminData.websiteSections.length;
  const totalMessages = adminData.messages.length;
  const unreadMessages = adminData.messages.filter((m) => m.status === 'unread').length;
  const totalCertifications = adminData.certifications.length;
  const lastWebsiteUpdate = formatFirestoreTime(adminData.settings.updatedAt || adminData.profile.updatedAt);

  const totalMediaBytes = adminData.media.reduce((acc, m) => acc + (m.sizeBytes || 0), 0);
  const mediaImages = adminData.media.filter((m) => m.type === 'image').length;
  const mediaVideos = adminData.media.filter((m) => m.type === 'video').length;
  const mediaDocs = adminData.media.filter((m) => m.type === 'document').length;

  const cards = [
    { label: 'Total Projects', value: totalProjects, sub: 'All portfolio case studies', icon: FolderKanban, to: '/admin/projects' },
    { label: 'Published Projects', value: publishedProjects, sub: 'Visible on public site', icon: Eye, to: '/admin/projects' },
    { label: 'Draft Projects', value: draftProjects, sub: 'Hidden from public view', icon: FileText, to: '/admin/projects' },
    { label: 'Total Services', value: totalServices, sub: `${adminData.skills.length} managed skills`, icon: Layers, to: '/admin/services' },
    { label: 'Custom Sections', value: totalSections, sub: `${adminData.navigationItems.length} nav links`, icon: LayoutTemplate, to: '/admin/sections' },
    { label: 'Contact Messages', value: totalMessages, sub: 'All visitor inquiries', icon: Inbox, to: '/admin/messages' },
    { label: 'Unread Messages', value: unreadMessages, sub: 'Requires response', icon: Inbox, to: '/admin/messages' },
    { label: 'Certifications', value: totalCertifications, sub: `${adminData.achievements.length} honors`, icon: Award, to: '/admin/certifications' },
  ];

  const publishedSummary = [
    {
      name: 'Projects',
      pub: publishedProjects,
      draft: draftProjects,
      to: '/admin/projects',
    },
    {
      name: 'Services',
      pub: adminData.services.filter((s) => s.status === 'published').length,
      draft: adminData.services.filter((s) => s.status === 'draft').length,
      to: '/admin/services',
    },
    {
      name: 'Skills',
      pub: adminData.skills.filter((s) => s.status === 'published').length,
      draft: adminData.skills.filter((s) => s.status === 'draft').length,
      to: '/admin/skills',
    },
    {
      name: 'Custom Sections',
      pub: adminData.websiteSections.filter((s) => s.status === 'published').length,
      draft: adminData.websiteSections.filter((s) => s.status === 'draft').length,
      to: '/admin/sections',
    },
    {
      name: 'Testimonials',
      pub: adminData.testimonials.filter((s) => s.status === 'published').length,
      draft: adminData.testimonials.filter((s) => s.status === 'draft').length,
      to: '/admin/testimonials',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">
            Overview
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-[#F5F2EB]">
            Portfolio Command Dashboard
          </h1>
          <p className="mt-1 text-xs text-[#8C8A84] inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#D4B475]" />
            <span>Last Website Update: {lastWebsiteUpdate}</span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold hover:bg-[#E8D2A0]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Link>
          <Link
            to="/admin/sections"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#111114] border border-white/15 text-xs font-medium text-[#F5F2EB] hover:border-[#D4B475]/50"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-[#D4B475]" />
            <span>Add Section</span>
          </Link>
          <Link
            to="/admin/media"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#111114] border border-white/15 text-xs font-medium text-[#F5F2EB] hover:border-[#D4B475]/50"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#D4B475]" />
            <span>Upload Media</span>
          </Link>
        </div>
      </div>

      {/* 8 Stat Cards + Last Updated in Header = All 9 Required Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              to={c.to}
              className="p-5 rounded-2xl bg-[#111114] border border-white/10 hover:border-[#D4B475]/45 transition-colors space-y-2.5"
            >
              <div className="flex items-center justify-between text-[#D4B475]">
                <Icon className="w-4 h-4" />
                <span className="font-mono text-2xl font-semibold tabular-nums text-[#F5F2EB]">
                  {c.value}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F2EB]">{c.label}</p>
                <p className="text-xs text-[#8C8A84] mt-0.5">{c.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Publishing Status */}
        <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
          <h2 className="font-serif text-xl font-semibold">Publishing Status</h2>
          <div className="space-y-3">
            {publishedSummary.map((row) => (
              <Link
                key={row.name}
                to={row.to}
                className="flex items-center justify-between text-xs py-2 border-b border-white/8 hover:text-[#D4B475]"
              >
                <span>{row.name}</span>
                <span className="font-mono tabular-nums space-x-2">
                  <span className="text-emerald-400">{row.pub} live</span>
                  <span className="text-[#8C8A84]">·</span>
                  <span className="text-amber-300">{row.draft} draft</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Media Storage Overview */}
        <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">Media Storage</h2>
            <Link to="/admin/media" className="text-xs text-[#D4B475] hover:underline">
              Open Library
            </Link>
          </div>
          <div className="p-4 rounded-xl bg-[#070708] border border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-[#D4B475]" />
              <div>
                <p className="text-sm font-medium text-[#F5F2EB]">
                  {(totalMediaBytes / (1024 * 1024)).toFixed(2)} MB
                </p>
                <p className="text-xs text-[#8C8A84]">{adminData.media.length} managed assets</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-[#070708] border border-white/8">
              <p className="font-mono text-lg font-semibold text-[#F5F2EB]">{mediaImages}</p>
              <p className="text-[11px] text-[#8C8A84]">Images</p>
            </div>
            <div className="p-3 rounded-xl bg-[#070708] border border-white/8">
              <p className="font-mono text-lg font-semibold text-[#F5F2EB]">{mediaVideos}</p>
              <p className="text-[11px] text-[#8C8A84]">Videos</p>
            </div>
            <div className="p-3 rounded-xl bg-[#070708] border border-white/8">
              <p className="font-mono text-lg font-semibold text-[#F5F2EB]">{mediaDocs}</p>
              <p className="text-[11px] text-[#8C8A84]">PDF Docs</p>
            </div>
          </div>
        </div>

        {/* Recent Admin Activity */}
        <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">Recent Activities</h2>
            <Link to="/admin/logs" className="inline-flex items-center gap-1 text-xs text-[#D4B475] hover:underline">
              <Activity className="w-3.5 h-3.5" />
              <span>All Logs</span>
            </Link>
          </div>
          {adminData.activityLogs.length === 0 ? (
            <p className="text-xs text-[#8C8A84]">Actions performed in CMS appear here automatically.</p>
          ) : (
            <div className="divide-y divide-white/8">
              {adminData.activityLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono uppercase text-[#D4B475]">{log.action}</span>
                    <span className="text-[#8C8A84]">{formatFirestoreTime(log.createdAt)}</span>
                  </div>
                  <p className="text-xs text-[#F5F2EB] truncate">{log.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Inquiries & Recently Updated Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">Recent Inquiries</h2>
            <Link to="/admin/messages" className="text-xs text-[#D4B475] hover:underline">
              Open Inbox
            </Link>
          </div>
          {adminData.messages.length === 0 ? (
            <p className="text-sm text-[#8C8A84]">No contact messages received yet.</p>
          ) : (
            <div className="divide-y divide-white/8">
              {adminData.messages.slice(0, 5).map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#F5F2EB] truncate">{m.subject}</p>
                    <p className="text-xs text-[#8C8A84] truncate">
                      {m.name} · {m.email}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono uppercase text-[#D4B475] shrink-0">
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">Recently Updated Content</h2>
            <Link to="/admin/projects" className="text-xs text-[#D4B475] hover:underline">
              Manage Projects
            </Link>
          </div>
          <div className="divide-y divide-white/8">
            {adminData.projects.slice(0, 5).map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#F5F2EB] truncate">{p.title}</p>
                  <p className="text-xs text-[#8C8A84] truncate">
                    {p.category} · Updated {formatFirestoreTime(p.updatedAt)}
                  </p>
                </div>
                <span className="text-[11px] font-mono uppercase text-[#D4B475] shrink-0">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  return (
    <AdminLayout>
      <DashboardInner />
    </AdminLayout>
  );
}
