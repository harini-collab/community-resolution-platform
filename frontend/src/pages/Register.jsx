import { Building2, Shield, User, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPathForRole } from '../utils/routes.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      const user = await register(form);
      navigate(dashboardPathForRole(user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <form onSubmit={onSubmit} className="panel space-y-4 p-7 shadow-md">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Create citizen account</h1>
            <p className="mt-1 text-sm text-slate-500">Start reporting neighborhood issues with location and photos.</p>
          </div>
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <label className="block space-y-1.5">
            <span className="label">Full name</span>
            <input className="input" placeholder="Ravi Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="block space-y-1.5">
            <span className="label">Email address</span>
            <input className="input" type="email" placeholder="you@gmail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="block space-y-1.5">
            <span className="label">Password</span>
            <input className="input" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </label>
          <button className="btn-primary w-full py-3" type="submit">
            <UserPlus size={18} />
            Create account
          </button>
          <p className="text-center text-sm text-slate-600">
            Already registered? <Link className="font-semibold text-civic hover:underline" to="/login">Sign in</Link>
          </p>
        </form>

        {/* Account type guide */}
        <div className="panel p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Account types explained</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
              <User size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-slate-800">Citizen <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Register here</span></p>
                <p className="text-xs text-slate-500 mt-0.5">Report issues, vote on community problems, track resolutions, and verify completed work.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
              <Building2 size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-bold text-slate-800">Ward Officer</p>
                <p className="text-xs text-slate-500 mt-0.5">Officer accounts are created by your administrator. <Link className="font-semibold text-blue-700 hover:underline" to="/login">Sign in here</Link> once your account is set up.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
              <Shield size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-slate-800">Administrator</p>
                <p className="text-xs text-slate-500 mt-0.5">Admin credentials are issued by your municipal IT team. Use the <Link className="font-semibold text-amber-700 hover:underline" to="/admin-access">admin sign-in page</Link>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
