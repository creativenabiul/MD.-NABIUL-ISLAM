import { useMemo, useState } from 'react';
import { Archive, Check, Mail, MailOpen, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logAdminActivity, removeDocument, updateMessageStatus } from '../../lib/portfolioService';
import type { ContactMessageItem } from '../../types/portfolio';
import { ConfirmModal, formatFirestoreTime } from '../../components/admin/AdminUi';
import { AdminLayout, useAdminData } from './AdminLayout';

function getDateValue(ts: unknown): Date | null {
  if (!ts) return null;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate();
  }
  const d = new Date(String(ts));
  return Number.isNaN(d.getTime()) ? null : d;
}

function MessagesInner() {
  const { adminData, loading, reloadAdmin } = useAdminData();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ContactMessageItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessageItem | null>(null);

  const filtered = useMemo(() => {
    if (!adminData) return [];
    const now = Date.now();
    return adminData.messages.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (dateFilter !== 'all') {
        const dt = getDateValue(m.createdAt);
        if (dt) {
          const days = dateFilter === '7d' ? 7 : 30;
          if (now - dt.getTime() > days * 24 * 3600 * 1000) return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [adminData, statusFilter, dateFilter, search]);

  if (loading || !adminData) {
    return <div className="text-sm text-[#8C8A84]">Loading inbox...</div>;
  }

  const changeStatus = async (msg: ContactMessageItem, nextStatus: 'unread' | 'read' | 'archived') => {
    await updateMessageStatus(msg.id, nextStatus);
    await logAdminActivity(user?.email, 'update', 'contact_messages', msg.id, `Marked message "${msg.subject}" as ${nextStatus}`);
    if (selected?.id === msg.id) {
      setSelected({ ...msg, status: nextStatus });
    }
    await reloadAdmin();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await removeDocument('contact_messages', deleteTarget.id);
    await logAdminActivity(user?.email, 'delete', 'contact_messages', deleteTarget.id, `Deleted message "${deleteTarget.subject}"`);
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
    await reloadAdmin();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">
            Private Inbox
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold">Contact Messages</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#111114] border border-white/10">
            {(['all', 'unread', 'read', 'archived'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${
                  statusFilter === st ? 'bg-[#D4B475] text-[#070708]' : 'text-[#8C8A84] hover:text-[#F5F2EB]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | '7d' | '30d')}
            className="px-3 py-2 rounded-lg bg-[#111114] border border-white/10 text-xs text-[#F5F2EB]"
          >
            <option value="all">All Dates</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111114] border border-white/10 max-w-md">
        <Search className="w-4 h-4 text-[#8C8A84]" />
        <input
          type="text"
          placeholder="Search sender, email, subject, or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-[#F5F2EB] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#111114] border border-white/10 text-sm text-[#8C8A84]">
              No messages match the current filters.
            </div>
          ) : (
            filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelected(m);
                  if (m.status === 'unread') {
                    void changeStatus(m, 'read');
                  }
                }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selected?.id === m.id
                    ? 'bg-[#17171c] border-[#D4B475]'
                    : 'bg-[#111114] border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[#F5F2EB] truncate">{m.name}</span>
                  <span className="text-[11px] font-mono uppercase text-[#D4B475] shrink-0">
                    {m.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#F5F2EB]/80 mt-1 truncate">{m.subject}</p>
                <p className="text-[11px] text-[#8C8A84] mt-1">{formatFirestoreTime(m.createdAt)}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-7">
          {selected ? (
            <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#F5F2EB]">
                    {selected.subject}
                  </h2>
                  <p className="text-sm text-[#D4B475] mt-1">
                    {selected.name} &lt;{selected.email}&gt;
                  </p>
                  <p className="text-xs text-[#8C8A84] mt-1">{formatFirestoreTime(selected.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2">
                  {selected.status !== 'read' ? (
                    <button
                      type="button"
                      onClick={() => changeStatus(selected, 'read')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-xs hover:border-[#D4B475]"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Read
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => changeStatus(selected, 'unread')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-xs hover:border-[#D4B475]"
                    >
                      <Mail className="w-3.5 h-3.5" /> Mark Unread
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => changeStatus(selected, 'archived')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-xs hover:border-[#D4B475]"
                  >
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selected)}
                    aria-label="Delete message"
                    className="p-2 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-[#F5F2EB]/90 leading-relaxed whitespace-pre-wrap">
                {selected.message}
              </div>

              <div className="pt-4 border-t border-white/10">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold"
                >
                  <MailOpen className="w-3.5 h-3.5" />
                  Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[#111114] border border-white/10 text-center text-sm text-[#8C8A84]">
              Select a message from the inbox to inspect details.
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Contact Message?"
        message={`Permanently delete the message "${deleteTarget?.subject}" from ${deleteTarget?.name}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export function AdminMessagesPage() {
  return (
    <AdminLayout>
      <MessagesInner />
    </AdminLayout>
  );
}
