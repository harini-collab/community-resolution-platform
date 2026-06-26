import {
  Activity, ArrowRight, Bell, Bot, Building2, Camera, CheckCircle2, Clock3,
  Facebook, Flame, HeartPulse, Image as ImageIcon, Layers, LocateFixed, Mail,
  MapPinned, Menu, MessageSquareText, Phone, Shield, ShieldAlert, ShieldCheck,
  Sparkles, Target, Users, X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import IssueMap from '../components/IssueMap.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPathForRole } from '../utils/routes.js';

const quickActions = [
  ['Report Issue', 'Submit with photo, address, ward & pincode.', Camera, 'emerald'],
  ['Track Issue', 'Follow resolution timeline and verify fixes.', Target, 'blue'],
  ['Track by Pincode', 'Search live reports in your area.', MapPinned, 'violet'],
  ['Emergency Contacts', '112, 101, 108 — reach help fast.', Phone, 'rose'],
  ['Community Map', 'Explore real reports by pincode & ward.', MapPinned, 'teal'],
  ['Support Issues', 'Vote priority on community concerns.', Bell, 'amber']
];

const howItWorks = [
  ['Capture photo', 'Document the problem with clear before evidence.', Camera],
  ['Enter address & pincode', 'Use house number, area, ward, landmark — not just GPS.', MapPinned],
  ['AI suggests category', 'Review predicted category, confidence & department.', Bot],
  ['Officer assigned', 'Tagged officers and departments receive alerts.', Building2],
  ['Track resolution', 'Timeline, progress photos, and status updates.', Activity],
  ['Verify completion', 'Confirm fixed or report still not fixed.', CheckCircle2]
];

const categories = [
  'Roads & Potholes', 'Drainage', 'Sanitation', 'Street Lighting',
  'Electricity', 'Water Supply', 'Public Property', 'Emergency'
];

const contacts = [
  ['Police', '112', Shield],
  ['Fire', '101', Flame],
  ['Ambulance', '108', HeartPulse],
  ['Women Helpline', '1091', Phone]
];

const contactIcons = { Police: Shield, Fire: Flame, Ambulance: HeartPulse, Support: Phone, Emergency: ShieldAlert, General: Phone };

const navItems = [
  ['Home', '#home'], ['Report', '#report'], ['Track', '/track'], ['How It Works', '#how'],
  ['Map', '#map'], ['Resolved', '#resolved'], ['Contact', '#contact']
];

function SectionHeader({ eyebrow, title, copy, align = 'center' }) {
  return (
    <div className={`mx-auto max-w-3xl ${align === 'left' ? 'mx-0 text-left' : 'text-center'}`}>
      {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
      <h2 className="section-title">{title}</h2>
      {copy && <p className="mt-4 text-base leading-7 text-slate-600">{copy}</p>}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [publicStats, setPublicStats] = useState(null);
  const [recentResolved, setRecentResolved] = useState([]);
  const [mapIssues, setMapIssues] = useState([]);
  const [mapFilters, setMapFilters] = useState({ pincode: '', ward: '', landmark: '' });
  const [emergencyContacts, setEmergencyContacts] = useState(contacts.map(([name, phone]) => ({ name, phone })));
  const dashboardPath = user ? dashboardPathForRole(user.role) : '/login';
  const reportPath = user?.role === 'citizen' ? '/citizen/issues/new' : user ? dashboardPath : '/register';

  const displayStats = publicStats ? [
    ['Total Issues', publicStats.totalIssues, 'community reports logged', MessageSquareText],
    ['Resolved Issues', publicStats.resolvedIssues, `${publicStats.resolutionRate}% closure rate`, CheckCircle2],
    ['Avg Resolution', `${publicStats.avgResolutionDays || 0} days`, 'transparent accountability', Clock3],
    ['Citizen Satisfaction', `${publicStats.avgSatisfaction || '—'}`, 'verified completions', ShieldCheck]
  ] : [];

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/public'),
      api.get('/issues/public/recent-resolved'),
      api.get('/issues/public/map'),
      api.get('/dashboard/emergency-contacts')
    ]).then(([statsRes, resolvedRes, mapRes, contactsRes]) => {
      setPublicStats(statsRes.data);
      setRecentResolved(resolvedRes.data);
      setMapIssues(mapRes.data);
      if (contactsRes.data?.length) setEmergencyContacts(contactsRes.data);
    }).catch(() => {});
  }, []);

  async function searchMap() {
    const { data } = await api.get('/issues/public/map', { params: mapFilters });
    setMapIssues(data);
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-civic text-white shadow-md"><MapPinned size={28} /></span>
            <span>
              <span className="block text-xl font-extrabold text-green-800 sm:text-2xl">Community Resolution</span>
              <span className="block text-sm text-slate-500">Problems reported, tracked, verified & resolved</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map(([label, href]) => (
              href.startsWith('/')
                ? <Link key={label} className="nav-link" to={href}>{label}</Link>
                : <a key={label} className="nav-link" href={href}>{label}</a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <Link className="btn-primary" to={dashboardPath}>Open dashboard</Link>
            ) : (
              <>
                <Link className="btn-muted" to="/login">Sign in</Link>
                <Link className="btn-primary" to="/register">Register</Link>
              </>
            )}
          </div>
          <button className="btn-muted px-3 lg:hidden" type="button" onClick={() => setMenuOpen((o) => !o)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </header>

      <main id="home">
        <section className="hero-section">
          <div className="hero-overlay" />
          <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-center px-4 py-20 lg:px-6">
            <div className="max-w-4xl animate-rise">
              <p className="mb-5 inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur">India-first civic resolution platform</p>
              <h1 className="text-5xl font-extrabold text-white sm:text-6xl">Problems reported. Tracked. Verified. Resolved.</h1>
              <p className="mt-6 max-w-2xl text-lg text-white/90">Report with address & pincode, tag local officers, follow transparent timelines, and verify completed work.</p>
              <div className="mt-8 flex flex-wrap gap-3" id="report">
                <Link className="btn-hero-primary" to={reportPath}>Report issue <ArrowRight size={18} /></Link>
                <Link className="btn-hero-secondary" to="/track">Track issues</Link>
              </div>
            </div>
            {displayStats.length > 0 && (
              <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {displayStats.map(([label, value, note, Icon]) => (
                  <article key={label} className="stat-card">
                    <Icon className="text-amber-300" size={24} />
                    <p className="mt-4 text-4xl font-extrabold text-white">{value}</p>
                    <h2 className="mt-2 text-base font-bold text-white">{label}</h2>
                    <p className="mt-1 text-sm text-white/75">{note}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="section-band bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <SectionHeader eyebrow="Quick actions" title="Start here" copy="Report, track, verify — built for Indian municipalities and local communities." />
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {quickActions.map(([title, copy, Icon, tone]) => (
                <Link key={title} className="service-card group" to={title === 'Track by Pincode' || title === 'Track Issue' ? '/track' : title === 'Report Issue' ? reportPath : title === 'Community Map' ? '#map' : title === 'Emergency Contacts' ? '#contact' : dashboardPath}>
                  <span className={`icon-tile icon-${tone}`}><Icon size={30} /></span>
                  <span className="block text-xl font-extrabold">{title}</span>
                  <span className="mt-2 block text-slate-600">{copy}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section-band" id="how">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <SectionHeader eyebrow="How it works" title="Six steps to accountable resolution" />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {howItWorks.map(([title, copy, Icon], i) => (
                <article key={title} className="panel p-5">
                  <span className="text-sm font-bold text-civic">Step {i + 1}</span>
                  <Icon className="mt-3 text-civic" size={28} />
                  <h3 className="mt-3 text-lg font-extrabold">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-band bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <SectionHeader eyebrow="AI reporting" title="AI suggestion + human confirmation" copy="Predicted category, confidence score, suggested department and priority — you confirm before submit." />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[['Category detection', Bot], ['Image analysis', ImageIcon], ['Smart priority', Sparkles], ['Duplicate detection', Layers]].map(([t, Icon]) => (
                <article key={t} className="panel p-4"><Icon className="text-civic" size={24} /><h3 className="mt-3 font-bold">{t}</h3></article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-band">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <SectionHeader eyebrow="Categories" title="Issue categories" />
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {categories.map((c) => <span key={c} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold">{c}</span>)}
            </div>
          </div>
        </section>

        <section className="section-band bg-slate-50" id="map">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <SectionHeader align="left" eyebrow="Live map" title="Real community issue map" copy="Search by pincode, ward, or landmark. No fake markers — only live report data." />
            <div className="mt-6 grid gap-2 sm:grid-cols-4">
              <input className="input" placeholder="Pincode" value={mapFilters.pincode} onChange={(e) => setMapFilters({ ...mapFilters, pincode: e.target.value })} />
              <input className="input" placeholder="Ward" value={mapFilters.ward} onChange={(e) => setMapFilters({ ...mapFilters, ward: e.target.value })} />
              <input className="input" placeholder="Landmark" value={mapFilters.landmark} onChange={(e) => setMapFilters({ ...mapFilters, landmark: e.target.value })} />
              <button className="btn-primary" type="button" onClick={searchMap}><LocateFixed size={16} /> Search map</button>
            </div>
            <div className="map-shell mt-6"><IssueMap issues={mapIssues} emptyMessage="No mapped issues match your search. Try a different pincode or ward." /></div>
          </div>
        </section>

        <section className="section-band" id="resolved">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <SectionHeader eyebrow="Transparency" title="Recently resolved issues" />
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {recentResolved.length ? recentResolved.map((item) => (
                <article key={item.id} className="news-card">
                  {(item.after_image_url || item.image_url || item.before_image_url) ? (
                    <img
                      src={item.after_image_url || item.image_url || item.before_image_url}
                      alt=""
                      className="h-48 w-full object-cover"
                      loading="lazy"
                      onError={(e) => { e.target.onerror = null; e.target.parentElement.style.display='none'; }}
                    />
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">No image</span>
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-sm text-slate-500">{item.department_name || 'Department'} · {new Date(item.completion_date || item.updated_at).toLocaleDateString()}</p>
                    <h3 className="mt-2 text-xl font-extrabold">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{item.resolution_notes || item.description}</p>
                  </div>
                </article>
              )) : <p className="text-center text-slate-500">Resolved issues will appear here as officers complete work.</p>}
            </div>
          </div>
        </section>

        <section className="section-band bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <SectionHeader eyebrow="Community impact" title="Public trust dashboard" />
            {displayStats.length > 0 && (
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {displayStats.map(([label, value, note, Icon]) => (
                  <article key={label} className="metric-card">
                    <Icon className="text-civic" size={28} />
                    <p className="mt-5 text-4xl font-extrabold">{value}</p>
                    <h3 className="mt-2 font-bold">{label}</h3>
                    <p className="mt-2 text-sm text-slate-500">{note}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="emergency-section section-band" id="contact">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <SectionHeader eyebrow="Emergency" title="Emergency contacts (India)" copy="For immediate danger, call emergency services before filing a civic report." />
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {emergencyContacts.map((item) => {
                const Icon = contactIcons[item.category] || contactIcons[item.name] || Phone;
                return (
                  <article key={item.id || item.name} className="hotline-card">
                    <Icon size={38} />
                    <h3 className="mt-5 text-xl font-extrabold">{item.name}</h3>
                    <a href={`tel:${item.phone}`} className="mt-3 block text-2xl font-extrabold text-amber-300 hover:underline">{item.phone}</a>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-green-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
          <p className="text-lg font-extrabold">Community Resolution Platform</p>
          <p className="mt-2 text-white/75">Transparency · Accountability · Citizen trust</p>
          <p className="mt-4 text-sm text-white/60">support@communityresolution.gov · Municipal Support Center</p>
        </div>
      </footer>
    </div>
  );
}
