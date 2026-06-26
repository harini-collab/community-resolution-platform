import { Camera, CheckCircle2, Clock3, PlayCircle, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import IssueMap from '../components/IssueMap.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function OfficerIssues() {
  const { socket } = useAuth();
  const [issues, setIssues] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [availability, setAvailability] = useState('Available');
  const [updates, setUpdates] = useState({});
  const [errors, setErrors] = useState({});

  async function loadIssues() {
    const [{ data: issueData }, { data: metricData }] = await Promise.all([
      api.get('/issues'),
      api.get('/officers/me/metrics')
    ]);
    setIssues(issueData);
    setMetrics(metricData);
  }

  useEffect(() => { loadIssues(); }, []);
  useEffect(() => {
    if (!socket) return;
    socket.on('issue:updated', loadIssues);
    return () => socket.off('issue:updated', loadIssues);
  }, [socket]);

  async function acceptIssue(issueId) {
    await api.patch(`/issues/${issueId}/accept`);
    await loadIssues();
  }

  async function updateAvailability(status) {
    await api.patch('/officers/me/availability', { availability_status: status });
    setAvailability(status);
  }

  async function uploadProgress(issueId) {
    const update = updates[issueId] || {};
    if (!update.progressPhoto) {
      setErrors((p) => ({ ...p, [issueId]: 'Progress photo is required.' }));
      return;
    }
    setErrors((p) => ({ ...p, [issueId]: '' }));
    const body = new FormData();
    body.append('proof', update.progressPhoto);
    body.append('remark', update.progressRemark || 'Progress photo uploaded.');
    try {
      await api.patch(`/issues/${issueId}/progress`, body);
      setUpdates((c) => ({ ...c, [issueId]: { ...c[issueId], progressPhoto: null, progressRemark: '' } }));
      await loadIssues();
    } catch (err) {
      setErrors((p) => ({ ...p, [issueId]: err.response?.data?.message || 'Progress upload failed' }));
    }
  }

  async function submitResolution(issueId) {
    const update = updates[issueId] || {};
    if (!update.resolutionPhoto || !update.resolutionRemark || !update.resolution_timestamp) {
      setErrors((p) => ({ ...p, [issueId]: 'Resolution photo, notes, and timestamp are required.' }));
      return;
    }
    setErrors((p) => ({ ...p, [issueId]: '' }));
    const body = new FormData();
    body.append('status', 'Resolved');
    body.append('remark', update.resolutionRemark);
    body.append('resolution_timestamp', update.resolution_timestamp);
    body.append('proof', update.resolutionPhoto);
    try {
      await api.patch(`/issues/${issueId}/status`, body);
      setUpdates((c) => ({ ...c, [issueId]: {} }));
      await loadIssues();
    } catch (err) {
      setErrors((p) => ({ ...p, [issueId]: err.response?.data?.message || 'Resolution failed' }));
    }
  }

  async function requestVerification(issueId) {
    await submitResolution(issueId);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Officer workspace</h2>
          <p className="text-sm text-slate-500">Accept issues, upload progress & resolution proof, request citizen verification.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Availability:</span>
          {['Available', 'Busy', 'On Leave'].map((s) => (
            <button key={s} type="button" className={`btn-muted text-xs ${availability === s ? 'border-civic text-civic' : ''}`} onClick={() => updateAvailability(s)}>{s}</button>
          ))}
        </div>
      </div>

      {metrics && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="panel p-4"><p className="text-sm text-slate-500">Assigned</p><p className="text-3xl font-bold">{metrics.assigned}</p></div>
          <div className="panel p-4"><p className="text-sm text-slate-500">Completed</p><p className="text-3xl font-bold">{metrics.completed}</p></div>
          <div className="panel p-4"><p className="text-sm text-slate-500">Avg resolution</p><p className="text-3xl font-bold">{metrics.avgResolutionDays || 0}d</p></div>
        </div>
      )}

      <IssueMap issues={issues} />
      <div className="grid gap-4">
        {issues.length === 0 && <p className="panel p-6 text-center text-sm text-slate-500">No issues in your jurisdiction yet.</p>}
        {issues.map((issue) => {
          const update = updates[issue.id] || {};
          return (
            <article key={issue.id} className="panel grid gap-4 p-4 lg:grid-cols-[180px_1fr_360px]">
              {issue.image_url ? (
                <img src={issue.image_url} alt="" className="h-40 w-full rounded-md object-cover lg:h-full" onError={(e)=>{e.target.onerror=null;e.target.style.display='none'}} />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500">No image</div>
              )}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link className="font-semibold hover:text-civic" to={`/officer/issues/${issue.id}`}>{issue.title}</Link>
                  <StatusBadge status={issue.status} />
                </div>
                <p className="text-sm text-slate-600">{issue.description}</p>
                <p className="text-xs text-slate-500">{issue.address} · Ward {issue.ward} · PIN {issue.pincode}</p>
                {issue.progress_photo_url && (
                  <img src={issue.progress_photo_url} alt="" className="h-24 rounded-md object-cover" onError={(e)=>{e.target.onerror=null;e.target.style.display='none'}} />
                )}
              </div>
              <div className="space-y-3">
                {issue.status === 'Assigned' && (
                  <button className="btn-primary w-full" type="button" onClick={() => acceptIssue(issue.id)}>
                    <PlayCircle size={16} /> Accept issue
                  </button>
                )}

                {['Accepted', 'In Progress'].includes(issue.status) && (
                  <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-bold uppercase text-slate-500">Progress update</p>
                    <textarea className="input min-h-16" placeholder="Progress notes" value={update.progressRemark || ''} onChange={(e) => setUpdates({ ...updates, [issue.id]: { ...update, progressRemark: e.target.value } })} />
                    <label className="block space-y-1">
                      <span className="label flex items-center gap-1"><Camera size={14} /> Progress photo</span>
                      <input className="input" type="file" accept="image/*" onChange={(e) => setUpdates({ ...updates, [issue.id]: { ...update, progressPhoto: e.target.files?.[0] } })} />
                    </label>
                    <button className="btn-muted w-full" type="button" onClick={() => uploadProgress(issue.id)}>
                      Upload progress photo
                    </button>
                  </div>
                )}

                {['Accepted', 'In Progress'].includes(issue.status) && (
                  <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                    <p className="text-xs font-bold uppercase text-emerald-800">Resolution & verification</p>
                    <textarea className="input min-h-16" placeholder="Resolution notes" value={update.resolutionRemark || ''} onChange={(e) => setUpdates({ ...updates, [issue.id]: { ...update, resolutionRemark: e.target.value } })} />
                    <label className="block space-y-1">
                      <span className="label flex items-center gap-1"><Clock3 size={14} /> Completion timestamp</span>
                      <input className="input" type="datetime-local" value={update.resolution_timestamp || ''} onChange={(e) => setUpdates({ ...updates, [issue.id]: { ...update, resolution_timestamp: e.target.value } })} />
                    </label>
                    <label className="block space-y-1">
                      <span className="label flex items-center gap-1"><Camera size={14} /> Resolution photo (after)</span>
                      <input className="input" type="file" accept="image/*" onChange={(e) => setUpdates({ ...updates, [issue.id]: { ...update, resolutionPhoto: e.target.files?.[0] } })} />
                    </label>
                    <button className="btn-primary w-full" type="button" onClick={() => requestVerification(issue.id)}>
                      <Send size={16} /> Request citizen verification
                    </button>
                  </div>
                )}

                {issue.status === 'Resolved' && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <CheckCircle2 className="mr-1 inline" size={14} /> Awaiting citizen verification
                  </p>
                )}

                {errors[issue.id] && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{errors[issue.id]}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
