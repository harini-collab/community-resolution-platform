import { ArrowLeft, Bell, CalendarClock, Image as ImageIcon, MapPinned, ShieldAlert, ThumbsUp, UserRound, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import IssueTimeline from '../components/IssueTimeline.jsx';
import StatusBadge, { AvailabilityBadge } from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPathForRole } from '../utils/routes.js';

function formatDate(value) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [officers, setOfficers] = useState([]);
  const [tagging, setTagging] = useState(false);
  const backPath = dashboardPathForRole(user?.role);

  async function loadIssue() {
    try {
      setLoading(true);
      const { data } = await api.get(`/issues/${id}`);
      setIssue(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load this issue.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadIssue(); }, [id]);

  useEffect(() => {
    if (!issue?.pincode && !issue?.ward) return;
    api.get('/officers/for-issue', { params: { pincode: issue.pincode, ward: issue.ward, area: issue.area } })
      .then(({ data }) => setOfficers(data))
      .catch(() => setOfficers([]));
  }, [issue?.pincode, issue?.ward, issue?.area]);

  async function vote() {
    await api.post(`/issues/${id}/vote`);
    await loadIssue();
  }

  async function follow() {
    await api.post(`/issues/${id}/follow`);
    await loadIssue();
  }

  async function escalate() {
    await api.patch(`/issues/${id}/escalate`, { notes: 'Emergency escalation from issue detail.', emergency_category: 'Medical Emergency' });
    await loadIssue();
  }

  async function verify() {
    await api.patch(`/issues/${id}/verify`, { rating: 5, notes: 'Citizen confirmed the issue is fixed.' });
    await loadIssue();
  }

  async function rejectVerification() {
    await api.patch(`/issues/${id}/reject-verification`, { notes: rejectNotes || 'Issue is still not fixed.' });
    await loadIssue();
  }

  async function tagOfficer(officerId) {
    setTagging(true);
    try {
      await api.patch(`/issues/${id}/tag-officer`, { officer_ids: [officerId] });
      await loadIssue();
    } finally {
      setTagging(false);
    }
  }

  if (loading) return <div className="panel p-6"><p className="text-sm text-slate-500">Loading…</p></div>;
  if (error) return (
    <div className="panel p-6">
      <p className="font-semibold text-rose-700">{error}</p>
      <Link className="btn-muted mt-4" to={backPath}><ArrowLeft size={16} /> Back</Link>
    </div>
  );

  const isEmergency = issue.priority_level === 'Emergency' || issue.emergency_escalated;

  return (
    <div className="space-y-6">
      <Link className="btn-muted w-fit" to={backPath}><ArrowLeft size={16} /> Back</Link>

      <section className={`panel overflow-hidden ${isEmergency ? 'ring-2 ring-rose-400' : ''}`}>
        {issue.image_url ? (
          <img src={issue.image_url} alt="" className="h-72 w-full object-cover" />
        ) : (
          <div className="flex h-56 items-center justify-center bg-slate-100 text-slate-500"><ImageIcon size={28} /></div>
        )}
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-civic">{issue.category}</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">{issue.title}</h1>
              {isEmergency && <p className="mt-2 text-sm font-bold text-rose-700">Emergency — {issue.emergency_category || 'Priority response'}</p>}
            </div>
            <StatusBadge status={issue.status} />
          </div>
          <p className="max-w-4xl leading-7 text-slate-700">{issue.description}</p>

          <div className="grid gap-4 md:grid-cols-4">
            <Info icon={UserRound} label="Reported by" value={issue.citizen_name} />
            <Info icon={MapPinned} label="Location" value={[issue.address, issue.area, issue.ward ? `Ward ${issue.ward}` : null, issue.pincode ? `PIN ${issue.pincode}` : null].filter(Boolean).join(', ') || 'N/A'} />
            <Info icon={MapPinned} label="Landmark" value={issue.landmark || 'Not provided'} />
            <Info icon={CalendarClock} label="Last update" value={formatDate(issue.updated_at)} />
          </div>

          <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <p><strong>AI category:</strong> {issue.predicted_category || issue.category}</p>
            <p><strong>Confidence:</strong> {issue.confidence_score || 'N/A'}%</p>
            <p><strong>Department:</strong> {issue.department_name || issue.suggested_department || 'Unassigned'}</p>
            <p><strong>Priority:</strong> {issue.priority_level || 'Medium'}</p>
          </div>

          {issue.taggedOfficers?.length > 0 && (
            <div className="text-sm">
              <strong>Tagged officers:</strong>{' '}
              {issue.taggedOfficers.map((o) => o.name).join(', ')}
            </div>
          )}

          {user?.role === 'citizen' && officers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Tag additional officers</p>
              <div className="flex flex-wrap gap-2">
                {officers.filter((o) => !issue.taggedOfficers?.some((t) => t.id === o.id)).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    disabled={tagging}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-civic"
                    onClick={() => tagOfficer(o.id)}
                  >
                    @{o.name.split(' ')[0]} · <AvailabilityBadge status={o.availability_status} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {user?.role === 'citizen' && (
              <button className="btn-muted" type="button" onClick={vote} disabled={issue.userVoted}>
                <ThumbsUp size={16} /> {issue.userVoted ? 'Supported' : 'Support'} ({issue.votes_count || 0})
              </button>
            )}
            {user?.role === 'citizen' && (
              <button className="btn-muted" type="button" onClick={follow} disabled={issue.userFollowing}>
                <Bell size={16} /> {issue.userFollowing ? 'Following' : 'Follow'} ({issue.followers_count || 0})
              </button>
            )}
            <button className="btn-muted border-rose-200 text-rose-700" type="button" onClick={escalate}>
              <ShieldAlert size={16} /> Emergency escalation
            </button>
          </div>
        </div>
      </section>

      {user?.role === 'citizen' && issue.status === 'Resolved' && (
        <section className="panel p-6">
          <h2 className="text-xl font-bold">Citizen verification</h2>
          <p className="mt-2 text-sm text-slate-600">Review the resolution evidence below, then confirm or reject.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="btn-primary" type="button" onClick={verify}>Confirm fixed</button>
            <button className="btn-muted border-rose-200 text-rose-700" type="button" onClick={rejectVerification}>
              <XCircle size={16} /> Still not fixed
            </button>
          </div>
          <textarea className="input mt-3 min-h-20" placeholder="Optional notes if still not fixed" value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} />
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <h2 className="text-xl font-bold">Before / after evidence</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Evidence title="Before" image={issue.before_image_url || issue.image_url} />
            <Evidence title="After" image={issue.after_image_url || issue.resolution_photo} />
          </div>
          {issue.progress_photo_url && (
            <figure className="mt-4 rounded-lg border border-slate-200 p-3">
              <figcaption className="mb-2 text-sm font-bold">Progress photo</figcaption>
              <img src={issue.progress_photo_url} alt="" className="h-44 w-full rounded-md object-cover" />
            </figure>
          )}
          <p className="mt-4 text-sm text-slate-600">Resolved: {formatDate(issue.resolution_timestamp || issue.completion_date)}</p>
          {issue.resolution_notes && <p className="mt-2 text-sm text-slate-600">{issue.resolution_notes}</p>}
        </div>
        <div className="panel p-6">
          <h2 className="text-xl font-bold">Nearby similar reports</h2>
          <div className="mt-4 space-y-3">
            {issue.nearbyIssues?.length ? issue.nearbyIssues.map((n) => (
              <Link key={n.id} className="block rounded-lg border border-slate-200 p-3 hover:border-civic" to={`/${user.role}/issues/${n.id}`}>
                <p className="font-semibold">{n.title}</p>
                <StatusBadge status={n.status} />
              </Link>
            )) : <p className="text-sm text-slate-500">No nearby reports.</p>}
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="text-xl font-bold">Resolution timeline</h2>
        <IssueTimeline events={issue.timeline} />
      </section>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <Icon className="mb-2 text-civic" size={20} />
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Evidence({ title, image }) {
  return (
    <figure className="rounded-lg border border-slate-200 p-3">
      <figcaption className="mb-2 text-sm font-bold">{title}</figcaption>
      {image ? <img src={image} alt="" className="h-44 w-full rounded-md object-cover" /> : <div className="flex h-44 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500">Not uploaded</div>}
    </figure>
  );
}
