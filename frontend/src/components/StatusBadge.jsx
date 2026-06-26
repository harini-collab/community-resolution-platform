const classes = {
  Reported: 'bg-amber-100 text-amber-800',
  Assigned: 'bg-indigo-100 text-indigo-800',
  Accepted: 'bg-violet-100 text-violet-800',
  'In Progress': 'bg-sky-100 text-sky-800',
  Resolved: 'bg-emerald-100 text-emerald-800',
  'Citizen Verified': 'bg-teal-100 text-teal-800',
  Closed: 'bg-slate-200 text-slate-800',
  Emergency: 'bg-rose-100 text-rose-800'
};

const availabilityClasses = {
  Available: 'bg-emerald-100 text-emerald-800',
  Busy: 'bg-amber-100 text-amber-800',
  'On Leave': 'bg-slate-200 text-slate-700'
};

export default function StatusBadge({ status, className = '' }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status] || classes.Reported} ${className}`}>
      {status}
    </span>
  );
}

export function AvailabilityBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${availabilityClasses[status] || availabilityClasses.Available}`}>
      {status}
    </span>
  );
}
