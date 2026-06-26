import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminDepartments from './pages/AdminDepartments.jsx';
import AdminIssues from './pages/AdminIssues.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import CitizenIssues from './pages/CitizenIssues.jsx';
import CreateIssue from './pages/CreateIssue.jsx';
import Dashboard from './pages/Dashboard.jsx';
import HomePage from './pages/HomePage.jsx';
import IssueDetail from './pages/IssueDetail.jsx';
import Login from './pages/Login.jsx';
import AdminAccess from './pages/AdminAccess.jsx';
import TrackIssues from './pages/TrackIssues.jsx';
import OfficerIssues from './pages/OfficerIssues.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-access" element={<AdminAccess />} />
        <Route path="/register" element={<Register />} />
        <Route path="/track" element={<TrackIssues />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute roles={['citizen']} />}>
              <Route path="/citizen" element={<CitizenIssues />} />
              <Route path="/citizen/issues/new" element={<CreateIssue />} />
              <Route path="/citizen/issues/:id" element={<IssueDetail />} />
            </Route>
            <Route element={<ProtectedRoute roles={['officer']} />}>
              <Route path="/officer" element={<OfficerIssues />} />
              <Route path="/officer/issues/:id" element={<IssueDetail />} />
            </Route>
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/issues" element={<AdminIssues />} />
              <Route path="/admin/issues/:id" element={<IssueDetail />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/departments" element={<AdminDepartments />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
