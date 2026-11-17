import { Link } from 'react-router-dom';
import { FolderKanban, Inbox, Layers, MessageSquareQuote, Image as ImageIcon } from 'lucide-react';
import { AdminLayout, useAdminData } from './AdminLayout';

function DashboardInner() {
  const { adminData, loading } = useAdminData();

  if (loading || !adminData) {
    return <div className="text-sm text-[#8C8A84]">Loading database overview...</div>;
  }

  const totalProjects = adminData.projects.length;
  const publishedProjects = adminData.projects.filter((p) => p.status === 'published').length;
  const totalMessages = adminData.messages.length;
  const unreadMessages = adminData.messages.filter((m) => m.status === 'unread').length;
  const totalServices = adminData.services.length;
  const publishedTestimonials = adminData.testimonials.filter((t) => t.status === 'published').length;

  const cards = [
    { label: 'Total Projects', value: totalProjects, sub: `${publishedProjects} Published`, icon: FolderKanban, to: '/admin/projects' },
    { label: 'Contact Messages', value: totalMessages, sub: `${unreadMessages} Unread`, icon: Inbox, to: '/admin/messages' },
    { label: 'Active Services', value: totalServices, sub: `${adminData.skills.length} Tracked Skills`, icon: Layers, to: '/admin/services' },
    { label: 'Published Testimonials', value: publishedTestimonials, sub: `${adminData.media.length} Media Assets`, icon: MessageSquareQuote, to: '/admin/testimonials' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">
          Overview
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-[#F5F2EB]">
          Portfolio Database Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              to={c.to}
              className="p-6 rounded-2xl bg-[#111114] border border-white/10 hover:border-[#D4B475]/45 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between text-[#D4B475]">
                <Icon className="w-5 h-5" />
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
            <h2 className="font-serif text-xl font-semibold">Latest Projects &amp; Media</h2>
            <Link to="/admin/media" className="inline-flex items-center gap-1.5 text-xs text-[#D4B475] hover:underline">
              <ImageIcon className="w-3.5 h-3.5" />
              Media Library
            </Link>
          </div>
          <div className="divide-y divide-white/8">
            {adminData.projects.slice(0, 5).map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#F5F2EB] truncate">{p.title}</p>
                  <p className="text-xs text-[#8C8A84] truncate">{p.category}</p>
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
