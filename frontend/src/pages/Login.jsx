import { ArrowRight, Eye, EyeOff, LogIn, MapPinned, User, Shield, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPathForRole } from '../utils/routes.js';

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'admin') {
        logout();
        setError('Administrators must sign in at /admin-access — not on this page.');
        return;
      }
      navigate(dashboardPathForRole(user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not sign in. Check email and password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page flex min-h-screen">
      <section className="login-hero hidden w-1/2 flex-col justify-between p-12 text-white lg:flex">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-white/90 hover:text-white">
            <MapPinned size={22} />
            <span className="font-bold">Community Resolution</span>
          </Link>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">Report. Track. Verify.</h1>
          <p className="mt-4 max-w-md text-lg text-white/85">
            Citizens and municipal officers use this portal to file reports, assign work, and close the loop with photo evidence.
          </p>
          <Link to="/track" className="mt-8 inline-flex items-center gap-2 rounded-md border border-white/40 px-5 py-3 text-sm font-semibold hover:bg-white/10">
            Track issues without signing in <ArrowRight size={16} />
          </Link>
        </div>
        <p className="text-sm text-white/60">Municipal support · support@communityresolution.gov</p>
      </section>

      <section className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-green-800"><MapPinned size={20} /> Community Resolution</Link>
          </div>

          <form onSubmit={onSubmit} className="panel space-y-5 p-7 shadow-md">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">For citizens and ward officers. You&apos;ll land on your dashboard automatically.</p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
            )}

            <label className="block space-y-1.5">
              <span className="label">Email address</span>
              <input
                className="input"
                type="email"
                autoComplete="email"
                required
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="label">Password</span>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button className="btn-primary w-full py-3" type="submit" disabled={busy}>
              <LogIn size={18} /> {busy ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-center text-sm text-slate-600">
              New here? <Link className="font-semibold text-civic hover:underline" to="/register">Create a citizen account</Link>
            </p>
          </form>

          {/* Role format guide */}
          <div className="mt-6 panel p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Who signs in here?</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                <User size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Citizen</p>
                  <p className="text-xs text-slate-500 mt-0.5">Register with your name, email &amp; password. Use this page to sign in after registration.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                <Building2 size={18} className="mt-0.5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Ward Officer</p>
                  <p className="text-xs text-slate-500 mt-0.5">Officer accounts are created by the administrator. Use your assigned email &amp; password to sign in here.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
                <Shield size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Administrator</p>
                  <p className="text-xs text-slate-500 mt-0.5">Use the dedicated <Link className="font-semibold text-amber-700 hover:underline" to="/admin-access">admin sign-in page</Link> — not this form.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
