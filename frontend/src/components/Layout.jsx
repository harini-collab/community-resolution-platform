import { Building2, ClipboardList, Home, LayoutDashboard, LogOut, MapPinned, PlusCircle, Users } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const navByRole = {
  citizen: [
    ['/citizen', 'My Issues', ClipboardList],
    ['/citizen/issues/new', 'Report', PlusCircle]
  ],
  officer: [['/officer', 'Assigned', MapPinned]],
  admin: [
    ['/admin', 'Dashboard', LayoutDashboard],
    ['/admin/issues', 'Issues', MapPinned],
    ['/admin/users', 'Users', Users],
    ['/admin/departments', 'Departments', Building2]
  ]
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = navByRole[user.role] || [];

  function onLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/" className="text-xl font-bold tracking-normal">Community Resolution Platform</Link>
            <p className="text-sm text-slate-500">{user.name} · {user.role}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link className="btn-muted px-3" to="/"><Home size={16} /> Home</Link>
            {nav.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `btn-muted px-3 ${isActive ? 'border-civic text-civic' : ''}`}>
                <Icon size={16} /> {label}
              </NavLink>
            ))}
            <NotificationBell />
            <button className="btn-muted px-3" onClick={onLogout} type="button">
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
