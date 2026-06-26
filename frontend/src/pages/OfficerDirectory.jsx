import { Search, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { AvailabilityBadge } from '../components/StatusBadge.jsx';

export default function OfficerDirectory() {
  const [filters, setFilters] = useState({ pincode: '', ward: '', area: '' });
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    try {
      const { data } = await api.get('/officers/public', { params: filters });
      setOfficers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { search(); }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Local officer directory</h1>
        <p className="mt-2 text-slate-600">Find responsible officers for your ward and pincode. Personal phone numbers are never shown.</p>
      </div>

      <div className="panel grid gap-3 p-4 sm:grid-cols-4">
        <input className="input" placeholder="Pincode" value={filters.pincode} onChange={(e) => setFilters({ ...filters, pincode: e.target.value })} />
        <input className="input" placeholder="Ward" value={filters.ward} onChange={(e) => setFilters({ ...filters, ward: e.target.value })} />
        <input className="input" placeholder="Area" value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })} />
        <button className="btn-primary" type="button" onClick={search} disabled={loading}><Search size={16} /> Search</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {officers.map((o) => (
          <article key={o.id} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-civic"><UserRound size={22} /></span>
                <div>
                  <h2 className="font-bold">{o.name}</h2>
                  <p className="text-sm text-slate-600">{o.department_name || 'Municipal'}</p>
                </div>
              </div>
              <AvailabilityBadge status={o.availability_status} />
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <div><dt className="font-semibold text-slate-500">Coverage</dt><dd>{o.coverage_label}</dd></div>
              <div className="flex gap-6">
                <div><dt className="font-semibold text-slate-500">Response rate</dt><dd>{o.response_rate || 0}%</dd></div>
                <div><dt className="font-semibold text-slate-500">Resolved cases</dt><dd>{o.resolved_cases || 0}</dd></div>
              </div>
            </dl>
          </article>
        ))}
      </div>
      {!loading && officers.length === 0 && <p className="text-center text-sm text-slate-500">No officers found for this area.</p>}
      <Link className="btn-muted w-fit" to="/">← Back to home</Link>
    </div>
  );
}
