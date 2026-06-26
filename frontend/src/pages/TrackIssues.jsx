import { Clock3, MapPin, Search, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';

const STATUS_OPTIONS = ['', 'Reported', 'Assigned', 'Accepted', 'In Progress', 'Resolved', 'Citizen Verified', 'Closed'];

export default function TrackIssues() {
  const [filters, setFilters] = useState({ pincode: '', ward: '', q: '', status: '' });
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  async function search(overrides = {}) {
    setLoading(true);
    try {
      const params = { ...filters, ...overrides };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const { data } = await api.get('/issues/public/track', { params });
      setIssues(data);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  async function openIssue(id) {
    const { data } = await api.get(`/issues/public/${id}`);
    setSelected(data);
  }

  useEffect(() => { search(); }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-civic">Public transparency</p>
          <h1 className="mt-2 text-3xl font-extrabold text-green-900 sm:text-4xl">Track community issues</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Search by pincode, ward, or keyword. See live status, department updates, and resolution progress — no login required.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-6">
        <div className="panel grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className="input"
            placeholder="Pincode (e.g. 801106)"
            value={filters.pincode}
            onChange={(e) => setFilters({ ...filters, pincode: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <input
            className="input"
            placeholder="Ward"
            value={filters.ward}
            onChange={(e) => setFilters({ ...filters, ward: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <input
            className="input lg:col-span-2"
            placeholder="Search title, area, landmark…"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            {STATUS_OPTIONS.map((s) => <option key={s || 'all'} value={s}>{s || 'All statuses'}</option>)}
          </select>
          <button className="btn-primary sm:col-span-2 lg:col-span-5" type="button" onClick={() => search()} disabled={loading}>
            <Search size={16} /> {loading ? 'Searching…' : 'Search issues'}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {issues.map((issue) => (
              <article
                key={issue.id}
                className={`panel cursor-pointer overflow-hidden transition hover:border-civic/40 hover:shadow-md ${selected?.id === issue.id ? 'ring-2 ring-civic/30' : ''}`}
                onClick={() => openIssue(issue.id)}
              >
                <div className="flex flex-col sm:flex-row">
                  {issue.image_url && (
                    <div className="h-36 w-full shrink-0 bg-slate-100 sm:h-auto sm:w-40">
                      <img src={issue.image_url} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.closest('.img-wrapper')?.classList.add('hidden'); }} />
                    </div>
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="font-bold text-slate-900">{issue.title}</h2>
                      <StatusBadge status={issue.status} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{issue.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><MapPin size={12} /> {issue.area}, {issue.pincode}</span>
                      <span>Ward {issue.ward}</span>
                      {issue.department_name && <span>{issue.department_name}</span>}
                      <span className="inline-flex items-center gap-1"><Clock3 size={12} /> {new Date(issue.updated_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!loading && issues.length === 0 && (
              <div className="panel p-10 text-center">
                <Target className="mx-auto text-slate-300" size={40} />
                <p className="mt-4 font-semibold text-slate-700">No issues match your search</p>
                <p className="mt-1 text-sm text-slate-500">Try a different pincode — e.g. 560034, 400001, 801106, or 110001.</p>
              </div>
            )}
          </div>

          <aside className="panel h-fit space-y-4 p-5 lg:sticky lg:top-24">
            {selected ? (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Issue detail</p>
                  <h3 className="mt-1 text-lg font-bold">{selected.title}</h3>
                  <StatusBadge status={selected.status} />
                </div>
                {selected.image_url && (
                  <img src={selected.image_url} alt="" className="w-full rounded-md object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display='none'; }} />
                )}
                <p className="text-sm text-slate-600">{selected.description}</p>
                <dl className="space-y-2 text-sm">
                  <div><dt className="font-semibold text-slate-500">Location</dt><dd>{selected.address}, {selected.area}, {selected.pincode}</dd></div>
                  {selected.landmark && <div><dt className="font-semibold text-slate-500">Landmark</dt><dd>{selected.landmark}</dd></div>}
                  {selected.department_name && <div><dt className="font-semibold text-slate-500">Department</dt><dd>{selected.department_name}</dd></div>}
                  {selected.assigned_officer_name && <div><dt className="font-semibold text-slate-500">Officer</dt><dd>{selected.assigned_officer_name}</dd></div>}
                </dl>
                {selected.timeline?.length > 0 && (
                  <div>
                    <p className="label mb-2">Timeline</p>
                    <ol className="space-y-2 border-l-2 border-civic/20 pl-3 text-xs">
                      {selected.timeline.slice(-5).map((ev, i) => (
                        <li key={i}>
                          <span className="font-semibold text-slate-700">{ev.status || ev.event_type}</span>
                          <span className="text-slate-400"> · {new Date(ev.created_at).toLocaleDateString('en-IN')}</span>
                          {ev.notes && <p className="text-slate-500">{ev.notes}</p>}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {selected.after_image_url && (
                  <div>
                    <p className="label mb-1">After resolution</p>
                    <img src={selected.after_image_url} alt="" className="w-full rounded-md object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display='none'; }} />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-sm text-slate-500">
                <Target className="mx-auto text-slate-300" size={32} />
                <p className="mt-3">Select an issue to view its timeline and details.</p>
              </div>
            )}
            <Link className="btn-muted w-full" to="/">← Back to home</Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
