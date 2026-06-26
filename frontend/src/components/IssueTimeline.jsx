import StatusBadge from './StatusBadge.jsx';

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function IssueTimeline({ events = [], compact = false }) {
  if (!events.length) {
    return <p className="text-sm text-slate-500">No timeline updates yet.</p>;
  }

  return (
    <div className={`space-y-3 ${compact ? '' : 'mt-4'}`}>
      {events.map((event, index) => (
        <article key={event.id || index} className="relative rounded-lg border border-slate-200 p-4 pl-8">
          <span className="absolute left-3 top-5 h-2.5 w-2.5 rounded-full bg-civic" aria-hidden="true" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold capitalize">{event.actor_name || 'System'} — {event.event_type?.replaceAll('_', ' ')}</p>
            {event.status && <StatusBadge status={event.status} />}
          </div>
          {event.notes && <p className="mt-2 text-sm leading-6 text-slate-600">{event.notes}</p>}
          {event.proof_url && <img src={event.proof_url} alt="" className="mt-3 h-32 rounded-md object-cover" loading="lazy" />}
          <p className="mt-2 text-xs font-medium text-slate-500">{formatDate(event.created_at)}</p>
        </article>
      ))}
    </div>
  );
}
