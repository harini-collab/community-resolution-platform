import { Bot, CheckCircle2, Send, Sparkles, TriangleAlert, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import LocationPicker from '../components/LocationPicker.jsx';
import { AvailabilityBadge } from '../components/StatusBadge.jsx';

const SEVERITIES = ['Low', 'Medium', 'High', 'Emergency'];
const EMERGENCY_CATS = ['Accident', 'Fire', 'Crime', 'Conflict', 'Medical Emergency'];

export default function CreateIssue() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [image, setImage] = useState(null);
  const [ai, setAi] = useState(null);
  const [aiConfirmed, setAiConfirmed] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [taggedOfficers, setTaggedOfficers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    latitude: '', longitude: '', address: '', area: '', ward: '', pincode: '', landmark: '',
    assigned_department: '', severity_level: 'Medium', emergency_category: ''
  });

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.pincode && !form.ward) return;
    api.get('/officers/for-issue', { params: { pincode: form.pincode, ward: form.ward, area: form.area } })
      .then(({ data }) => setOfficers(data))
      .catch(() => setOfficers([]));
  }, [form.pincode, form.ward, form.area]);

  useEffect(() => {
    if (!form.description || form.description.length < 20) return;
    const timer = setTimeout(() => {
      api.get('/issues/check-duplicates', {
        params: {
          pincode: form.pincode, ward: form.ward, category: form.category || ai?.predictedCategory,
          description: form.description, latitude: form.latitude, longitude: form.longitude
        }
      }).then(({ data }) => setDuplicates(data)).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [form.description, form.pincode, form.ward, form.category, ai?.predictedCategory]);

  async function analyzeImage(fileOverride) {
    const file = fileOverride || image;
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('image', file);
      body.append('title', form.title);
      body.append('description', form.description);
      const { data } = await api.post('/ai/analyze-image', body);
      setAi(data);
      setAiConfirmed(false);
      setForm((c) => ({
        ...c,
        title: c.title || data.generatedTitle,
        description: c.description || (data.needsManualReview ? c.description : data.generatedDescription),
        category: data.predictedCategory || data.category,
        severity_level: data.severity || c.severity_level
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Photo analysis failed — you can still fill the form and submit manually.');
    } finally {
      setBusy(false);
    }
  }

  function onImageSelect(event) {
    const file = event.target.files?.[0] || null;
    setImage(file);
    if (file) analyzeImage(file);
  }

  async function classifyText() {
    setBusy(true);
    try {
      const { data } = await api.post('/ai/classify', { title: form.title, description: form.description });
      setAi(data);
      setAiConfirmed(false);
      setForm((c) => ({ ...c, category: data.predictedCategory, severity_level: data.severity || c.severity_level }));
    } catch {
      setError('Classification failed.');
    } finally {
      setBusy(false);
    }
  }

  function toggleOfficer(id) {
    setTaggedOfficers((current) =>
      current.includes(id) ? current.filter((o) => o !== id) : [...current, id]
    );
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.address || !form.area || !form.ward || !form.pincode) {
      setError('Address, area, ward, and pincode are required.');
      return;
    }
    if (ai && !aiConfirmed) {
      setError('Please review and confirm AI suggestions before submitting.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (ai) {
        body.append('predicted_category', ai.predictedCategory);
        body.append('confidence_score', ai.confidenceScore);
        body.append('suggested_department', ai.suggestedDepartment);
        body.append('priority_level', ai.priorityLevel || form.severity_level);
      }
      body.append('tagged_officers', JSON.stringify(taggedOfficers));
      if (image) body.append('image', image);
      await api.post('/issues', body);
      navigate('/citizen');
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="panel space-y-4 p-5">
        <div>
          <h2 className="text-2xl font-bold">Report a community issue</h2>
          <p className="text-sm text-slate-500">Capture photo, enter address & pincode, confirm AI suggestions, tag officers.</p>
        </div>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <label className="block space-y-1">
          <span className="label">Before photo</span>
          <input className="input" type="file" accept="image/jpeg,image/png,image/webp,image/*" onChange={onImageSelect} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="btn-muted" type="button" onClick={() => analyzeImage()} disabled={!image || busy}><Bot size={16} /> {busy ? 'Analyzing…' : 'Re-analyze photo'}</button>
          <button className="btn-muted" type="button" onClick={classifyText} disabled={!form.description || busy}><Sparkles size={16} /> Classify text</button>
        </div>

        {ai && (
          <div className="space-y-3 rounded-lg border border-civic/20 bg-emerald-50 p-4 text-sm">
            <p><strong>Predicted category:</strong> {ai.predictedCategory}</p>
            <p><strong>Confidence:</strong> {ai.confidenceScore}%</p>
            <p><strong>Suggested department:</strong> {ai.suggestedDepartment}</p>
            <p><strong>Suggested priority:</strong> {ai.priorityLevel || form.severity_level}</p>
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" checked={aiConfirmed} onChange={(e) => setAiConfirmed(e.target.checked)} />
              I confirm these AI suggestions (or I have corrected them manually)
            </label>
          </div>
        )}

        {duplicates.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="flex items-center gap-2 font-semibold text-amber-900"><TriangleAlert size={16} /> Similar reports nearby</p>
            <ul className="mt-2 space-y-1">
              {duplicates.map((d) => (
                <li key={d.id}><Link className="font-medium text-civic hover:underline" to={`/citizen/issues/${d.id}`}>{d.title}</Link> — {d.status}</li>
              ))}
            </ul>
          </div>
        )}

        <label className="block space-y-1">
          <span className="label">Issue title *</span>
          <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className="label">Description *</span>
          <textarea className="input min-h-32" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="label">Category *</span>
            <input className="input" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </label>
          <label className="block space-y-1">
            <span className="label">Severity</span>
            <select className="input" value={form.severity_level} onChange={(e) => setForm({ ...form, severity_level: e.target.value })}>
              {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
        {form.severity_level === 'Emergency' && (
          <label className="block space-y-1">
            <span className="label text-rose-700">Emergency category *</span>
            <select className="input border-rose-200" required value={form.emergency_category} onChange={(e) => setForm({ ...form, emergency_category: e.target.value })}>
              <option value="">Select type</option>
              {EMERGENCY_CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        )}
        <label className="block space-y-1">
          <span className="label">Department (optional)</span>
          <select className="input" value={form.assigned_department} onChange={(e) => setForm({ ...form, assigned_department: e.target.value })}>
            <option value="">Auto-route</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>

        {officers.length > 0 && (
          <div className="space-y-2">
            <p className="label flex items-center gap-1"><UserRound size={14} /> Tag responsible officers</p>
            <div className="flex flex-wrap gap-2">
              {officers.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${taggedOfficers.includes(o.id) ? 'border-civic bg-emerald-50 text-civic' : 'border-slate-200'}`}
                  onClick={() => toggleOfficer(o.id)}
                >
                  @{o.name.split(' ')[0]} Officer · <AvailabilityBadge status={o.availability_status} />
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="btn-primary" disabled={busy} type="submit">
          <Send size={16} /> {busy ? 'Submitting…' : 'Submit report'}
        </button>
      </section>

      <aside className="panel h-fit space-y-4 p-5">
        <h3 className="font-semibold">Location (India-first)</h3>
        <LocationPicker value={form} onChange={(next) => setForm({ ...form, ...next })} />
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <CheckCircle2 className="mb-1 inline text-civic" size={14} /> Officers use ward & pincode to respond. Map pin is optional.
        </div>
      </aside>
    </form>
  );
}
