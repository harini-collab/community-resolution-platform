import { Save, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: 'password123', role: 'citizen', department_id: '' });

  async function load() {
    const [usersRes, deptRes] = await Promise.all([api.get('/users'), api.get('/departments')]);
    setUsers(usersRes.data);
    setDepartments(deptRes.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(event) {
    event.preventDefault();
    await api.post('/users', { ...newUser, department_id: newUser.department_id || null });
    setNewUser({ name: '', email: '', password: 'password123', role: 'citizen', department_id: '' });
    await load();
  }

  async function updateUser(user) {
    await api.put(`/users/${user.id}`, {
      name: user.name,
      role: user.role,
      department_id: user.role === 'officer' ? user.department_id : null,
      ward: user.ward || null,
      pincode_coverage: user.pincode_coverage?.join?.(',') || user.pincode_coverage || '',
      area_coverage: user.area_coverage?.join?.(',') || user.area_coverage || '',
      availability_status: user.availability_status
    });
    await load();
  }

  async function deleteUser(id) {
    await api.delete(`/users/${id}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Users</h2>
        <p className="text-sm text-slate-500">Create officers/admins and assign officers to departments.</p>
      </div>
      <form onSubmit={createUser} className="panel grid gap-3 p-4 md:grid-cols-5">
        <input className="input" placeholder="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
        <input className="input" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
        <select className="input" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
          <option value="citizen">Citizen</option>
          <option value="officer">Officer</option>
          <option value="admin">Admin</option>
        </select>
        <select className="input" value={newUser.department_id} onChange={(e) => setNewUser({ ...newUser, department_id: e.target.value })}>
          <option value="">No department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
        <button className="btn-primary" type="submit">
          <UserPlus size={16} />
          Add
        </button>
      </form>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Ward</th>
              <th className="px-4 py-3">Pincodes</th>
              <th className="px-4 py-3">Areas</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <input className="input" value={user.name} onChange={(e) => setUsers(users.map((item) => item.id === user.id ? { ...item, name: e.target.value } : item))} />
                </td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <select className="input" value={user.role} onChange={(e) => setUsers(users.map((item) => item.id === user.id ? { ...item, role: e.target.value } : item))}>
                    <option value="citizen">Citizen</option>
                    <option value="officer">Officer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select className="input" value={user.department_id || ''} onChange={(e) => setUsers(users.map((item) => item.id === user.id ? { ...item, department_id: e.target.value } : item))}>
                    <option value="">No department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input className="input w-16" value={user.ward || ''} onChange={(e) => setUsers(users.map((item) => item.id === user.id ? { ...item, ward: e.target.value } : item))} />
                </td>
                <td className="px-4 py-3">
                  <input className="input" placeholder="560001,560002" value={Array.isArray(user.pincode_coverage) ? user.pincode_coverage.join(',') : (user.pincode_coverage || '')} onChange={(e) => setUsers(users.map((item) => item.id === user.id ? { ...item, pincode_coverage: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } : item))} />
                </td>
                <td className="px-4 py-3">
                  <input className="input" placeholder="Indiranagar,Koramangala" value={Array.isArray(user.area_coverage) ? user.area_coverage.join(',') : (user.area_coverage || '')} onChange={(e) => setUsers(users.map((item) => item.id === user.id ? { ...item, area_coverage: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } : item))} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="btn-muted px-3" type="button" onClick={() => updateUser(user)} title="Save user">
                      <Save size={16} />
                    </button>
                    <button className="btn-muted px-3 text-red-700" type="button" onClick={() => deleteUser(user.id)} title="Delete user">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
