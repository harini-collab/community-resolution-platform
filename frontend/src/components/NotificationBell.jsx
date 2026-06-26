import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPathForRole } from '../utils/routes.js';

export default function NotificationBell() {
  const { user, socket } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    if (!user) return;
    const [listRes, countRes] = await Promise.all([
      api.get('/notifications'),
      api.get('/notifications/unread-count')
    ]);
    setItems(listRes.data);
    setUnread(countRes.data.count);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => load().catch(() => {});
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket]);

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    await load();
  }

  if (!user) return null;

  const base = dashboardPathForRole(user.role);

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-muted relative px-3"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-semibold">Notifications</p>
            {unread > 0 && (
              <button type="button" className="text-xs font-bold text-civic" onClick={markAllRead}>Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">No notifications yet.</p>
            ) : items.map((item) => (
              <Link
                key={item.id}
                to={item.issue_id ? `${base}/issues/${item.issue_id}` : base}
                className={`block border-b border-slate-50 px-4 py-3 hover:bg-slate-50 ${item.read_at ? 'opacity-70' : 'bg-emerald-50/40'}`}
                onClick={() => setOpen(false)}
              >
                <p className="text-sm font-semibold">{item.title}</p>
                {item.body && <p className="mt-1 text-xs text-slate-600">{item.body}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
