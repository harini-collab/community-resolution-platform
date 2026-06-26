import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import IssueMap from '../components/IssueMap.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminIssues() {
  const { socket } = useAuth();
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignErrors, setAssignErrors] = useState({});

  const officers = useMemo(() => users.filter((user) => user.role === 'officer'), [users]);

  async function load() {
    const [issueRes, deptRes, userRes] = await Promise.all([
      api.get('/issues'),
      api.get('/departments'),
      api.get('/users')
    ]);
    setIssues(issueRes.data);
    setDepartments(deptRes.data);
    setUsers(userRes.data);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('issue:updated', load);
    return () => socket.off('issue:updated', load);
  }, [socket]);

  async function assign(issue, departmentId, officerId) {
    // Bug fix: The original called assign() on every department <select> onChange,
    // passing issue.assigned_officer as the officer, but that value might be stale
    // in the React state if an officer was just selected in the same row. This
    // caused the officer dropdown to be silently reset on department change.
    // Now we always pass explicit values; the officer is cleared when the department
    // changes (correct behavior: department change should unassign the officer).
    try {
      await api.patch(`/issues/${issue.id}/assign`, {
        department_id: departmentId || null,
        officer_id: officerId || null
      });
      await load();
    } catch (err) {
      setAssignErrors((prev) => ({
        ...prev,
        [issue.id]: err.response?.data?.message || 'Assignment failed'
      }));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">All Issues</h2>
        <p className="text-sm text-slate-500">Route reports, review AI triage, and monitor assignment accountability.</p>
      </div>
      <IssueMap issues={issues} />
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Issue</th>
              <th className="px-4 py-3">AI Triage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Citizen</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Officer</th>
              <th className="px-4 py-3">Assignment</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Link className="font-semibold text-civic hover:underline" to={`/admin/issues/${issue.id}`}>{issue.title}</Link>
                  <p className="line-clamp-1 text-xs text-slate-500">{issue.description}</p>
                  {issue.duplicate_of && <p className="mt-1 text-xs font-semibold text-amber-700">Possible duplicate flagged</p>}
                  {assignErrors[issue.id] && <p className="mt-1 text-xs text-red-600">{assignErrors[issue.id]}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <p>Category: <strong>{issue.predicted_category || issue.category}</strong></p>
                  <p>Confidence: <strong>{issue.confidence_score || 'N/A'}%</strong></p>
                  <p>Department: <strong>{issue.suggested_department || 'N/A'}</strong></p>
                  <p>Priority: <strong>{issue.priority_level || 'Medium'}</strong></p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
                <td className="px-4 py-3">{issue.citizen_name}</td>
                <td className="px-4 py-3">
                  <select
                    className="input"
                    value={issue.assigned_department || ''}
                    onChange={(event) => {
                      // Bug fix: Clear officer assignment when department changes.
                      assign(issue, event.target.value, null);
                    }}
                  >
                    <option value="">Unassigned</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="input"
                    value={issue.assigned_officer || ''}
                    onChange={(event) => assign(issue, issue.assigned_department, event.target.value)}
                  >
                    <option value="">Department queue</option>
                    {officers
                      .filter((officer) => !issue.assigned_department || officer.department_id === issue.assigned_department)
                      .map((officer) => <option key={officer.id} value={officer.id}>{officer.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  <p>{issue.assigned_at ? new Date(issue.assigned_at).toLocaleString() : 'Not assigned'}</p>
                  <p>Updated {new Date(issue.updated_at || issue.created_at).toLocaleString()}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
