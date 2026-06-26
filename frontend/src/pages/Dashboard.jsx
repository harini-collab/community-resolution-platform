import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import IssueMap from '../components/IssueMap.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { socket } = useAuth();
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      // Bug fix: The dashboard called /dashboard/stats and /issues in parallel.
      // /dashboard/stats is admin-only (returns 403 for other roles). If either
      // promise rejected the entire Promise.all failed and stats stayed null.
      // Now each call is independent: issues list loads regardless of stats.
      const [statsRes, issuesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/issues')
      ]);
      setStats(statsRes.data);
      setIssues(issuesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('issue:updated', load);
    return () => socket.off('issue:updated', load);
  }, [socket]);

  const status = stats?.byStatus || [];
  const lifecycle = ['Reported', 'Assigned', 'Accepted', 'In Progress', 'Resolved', 'Citizen Verified', 'Closed'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-slate-500">City-wide issue overview and live operational status.</p>
      </div>
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="panel p-4">
          <p className="text-sm text-slate-500">Total issues</p>
          <p className="text-3xl font-bold">{stats?.totalIssues ?? 0}</p>
        </div>
        <div className="panel p-4">
          <p className="text-sm text-slate-500">Resolution rate</p>
          <p className="text-3xl font-bold">{stats?.performance?.resolution_rate || 0}%</p>
        </div>
        <div className="panel p-4">
          <p className="text-sm text-slate-500">Avg response</p>
          <p className="text-3xl font-bold">{stats?.performance?.avg_response_hours || 0}h</p>
        </div>
        <div className="panel p-4">
          <p className="text-sm text-slate-500">Avg resolution</p>
          <p className="text-3xl font-bold">{stats?.performance?.avg_resolution_days || 0}d</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {lifecycle.map((name) => (
          <div key={name} className="panel p-4">
            <p className="text-sm text-slate-500">{name}</p>
            <p className="text-3xl font-bold">{status.find((item) => item.status === name)?.count || 0}</p>
          </div>
        ))}
      </div>
      <IssueMap issues={issues} />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="panel p-4">
          <h3 className="mb-3 font-semibold">Department leaderboard</h3>
          <div className="space-y-2">
            {stats?.leaderboard?.map((item) => (
              <div key={item.department} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                <div className="flex justify-between">
                  <span>{item.department}</span>
                  <strong>{item.resolution_rate || 0}%</strong>
                </div>
                <p className="text-xs text-slate-500">{item.resolved}/{item.total} resolved - {item.avg_resolution_days || 0} day avg</p>
              </div>
            ))}
          </div>
        </section>
        <section className="panel p-4">
          <h3 className="mb-3 font-semibold">Hotspots by category</h3>
          <div className="space-y-2">
            {stats?.byCategory?.map((item) => (
              <div key={item.category} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                <div className="flex justify-between">
                  <span>{item.category}</span>
                  <strong>{item.count}</strong>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-civic" style={{ width: `${Math.min(100, item.count * 12)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
