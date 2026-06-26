import { LogIn, MapPinned, Shield } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPathForRole } from '../utils/routes.js';

export default function AdminAccess() {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const signedIn = await login(email, password);
      if (signedIn.role !== 'admin') {
        logout();
        setError('This entry point is restricted to administrators only.');
        return;
      }
      navigate(dashboardPathForRole(signedIn.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <form onSubmit={onSubmit} className="panel space-y-5 border-slate-800 bg-slate-900 p-7 text-white shadow-2xl">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1.5 text-sm font-semibold text-amber-300">
              <Shield size={15} /> Restricted access
            </p>
            <h1 className="mt-4 text-2xl font-extrabold">Administrator sign in</h1>
            <p className="mt-1 text-sm text-slate-400">
              Authorized municipal staff only. Citizens and ward officers should use the{' '}
              <Link className="font-semibold text-teal-400 hover:underline" to="/login">public sign-in page</Link>.
            </p>
          </div>
          {error && <div className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">{error}</div>}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Admin email</span>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-900"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@municipality.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Password</span>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-900"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
            type="submit"
            disabled={busy}
          >
            <LogIn size={18} /> {busy ? 'Signing in…' : 'Sign in as admin'}
          </button>
          <p className="text-center text-sm text-slate-500">
            <Link className="hover:text-slate-300 transition" to="/">
              <MapPinned size={13} className="inline mr-1" />Back to homepage
            </Link>
          </p>
        </form>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin credentials</p>
          <p className="mt-2 text-xs text-slate-400">
            Admin accounts are provisioned by your municipal IT department. Contact{' '}
            <span className="text-slate-300">it-support@municipality.gov.in</span> if you need access.
          </p>
        </div>
      </div>
    </main>
  );
}
