import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import IssueMap from '../components/IssueMap.jsx';
import IssueTimeline from '../components/IssueTimeline.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TABS = ['My Issues', 'Followed', 'Pending Verification'];

export default function CitizenIssues() {
  const { socket } = useAuth();
  const [issues, setIssues] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [tab, setTab] = useState(TABS[0]);
  const [loading, setLoading] = useState(true);

  async function loadIssues() {
    try {
      const [mine, fol] = await Promise.all([api.get('/issues'), api.get('/issues/followed')]);
      setIssues(mine.data);
      setFollowed(fol.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadIssues(); }, []);
  useEffect(() => {
    if (!socket) return;
    socket.on('issue:updated', loadIssues);
    return () => socket.off('issue:updated', loadIssues);
  }, [socket]);

  const stats = useMemo(() => ({
    filed: issues.length,
    resolved: issues.filter((i) => ['Resolved', 'Citizen Verified', 'Closed'].includes(i.status)).length,
    pending: issues.filter((i) => !['Resolved', 'Citizen Verified', 'Closed'].includes(i.status)).length,
    awaitingVerification: issues.filter((i) => i.status === 'Resolved').length
  }), [issues]);

  const displayed = useMemo(() => {
    if (tab === 'Followed') return followed;
    if (tab === 'Pending Verification') return issues.filter((i) => i.status === 'Resolved');
    return issues;
  }, [tab, issues, followed]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Citizen dashboard</h2>
          <p className="text-sm text-slate-500">Track resolution, follow community issues, and verify completed work.</p>
        </div>
        <Link className="btn-primary" to="/citizen/issues/new">Report issue</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-4"><p className="text-sm text-slate-500">Issues filed</p><p className="text-3xl font-bold">{stats.filed}</p></div>
        <div className="panel p-4"><p className="text-sm text-slate-500">Resolved</p><p className="text-3xl font-bold text-emerald-700">{stats.resolved}</p></div>
        <div className="panel p-4"><p className="text-sm text-slate-500">Pending</p><p className="text-3xl font-bold text-amber-700">{stats.pending}</p></div>
      </div>

      {stats.awaitingVerification > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold">{stats.awaitingVerification} issue{stats.awaitingVerification > 1 ? 's' : ''} awaiting your verification</p>
            <p className="mt-1">Officers marked these as resolved — review before/after evidence and confirm or reject.</p>
            <button type="button" className="mt-2 font-bold text-civic" onClick={() => setTab('Pending Verification')}>Review now →</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((name) => (
          <button key={name} type="button" className={`btn-muted ${tab === name ? 'border-civic text-civic' : ''}`} onClick={() => setTab(name)}>
            {name}
            {name === 'Pending Verification' && stats.awaitingVerification > 0 && (
              <span className="ml-1 rounded-full bg-amber-200 px-1.5 text-xs">{stats.awaitingVerification}</span>
            )}
          </button>
        ))}
        <Link className="btn-muted" to="/track">Track issues</Link>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading…</p> : (
        <>
          <IssueMap issues={displayed} />
          {displayed.length === 0 ? (
            <div className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-500">No issues in this view.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {displayed.map((issue) => (
                <article key={issue.id} className="panel overflow-hidden">
                  {(issue.before_image_url || issue.image_url) && (
                    <img src={issue.before_image_url || issue.image_url} alt="" className="h-40 w-full object-cover" onError={(e)=>{e.target.onerror=null;e.target.style.display='none'}} />
                  )}
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link className="font-semibold hover:text-civic" to={`/citizen/issues/${issue.id}`}>{issue.title}</Link>
                      <StatusBadge status={issue.status} />
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-600">{issue.address}{issue.pincode ? ` · PIN ${issue.pincode}` : ''}</p>
                    <div className="text-xs text-slate-500">
                      <span>{issue.department_name || 'Unassigned'} · Votes {issue.votes_count || 0}</span>
                    </div>
                    {(issue.after_image_url || issue.resolution_photo) && (
                      <div className="grid grid-cols-2 gap-2">
                        <figure className="rounded border border-slate-200 p-1">
                          <figcaption className="text-[10px] font-bold uppercase text-slate-500">Before</figcaption>
                          {(issue.before_image_url || issue.image_url) ? (
                            <img src={issue.before_image_url || issue.image_url} alt="" className="mt-1 h-16 w-full rounded object-cover" onError={(e)=>{e.target.onerror=null;e.target.style.display='none'}} />
                          ) : <div className="mt-1 flex h-16 items-center justify-center rounded bg-slate-100 text-[10px] text-slate-400">N/A</div>}
                        </figure>
                        <figure className="rounded border border-slate-200 p-1">
                          <figcaption className="text-[10px] font-bold uppercase text-slate-500">After</figcaption>
                          <img src={issue.after_image_url || issue.resolution_photo} alt="" className="mt-1 h-16 w-full rounded object-cover" onError={(e)=>{e.target.onerror=null;e.target.style.display='none'}} />
                        </figure>
                      </div>
                    )}
                    {issue.last_timeline_event && (
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="flex items-center gap-1 text-xs font-semibold text-slate-600"><Clock3 size={12} /> Latest update</p>
                        <IssueTimeline events={[issue.last_timeline_event]} compact />
                      </div>
                    )}
                    {issue.status === 'Resolved' && (
                      <Link className="inline-flex items-center gap-1 text-xs font-bold text-civic" to={`/citizen/issues/${issue.id}`}>
                        <CheckCircle2 size={14} /> Verification requested →
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
