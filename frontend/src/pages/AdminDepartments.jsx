import { Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });

  async function load() {
    const { data } = await api.get('/departments');
    setDepartments(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createDepartment(event) {
    event.preventDefault();
    await api.post('/departments', form);
    setForm({ name: '', description: '' });
    await load();
  }

  async function updateDepartment(department) {
    await api.put(`/departments/${department.id}`, department);
    await load();
  }

  async function deleteDepartment(id) {
    await api.delete(`/departments/${id}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Departments</h2>
        <p className="text-sm text-slate-500">Manage civic departments and officer capacity.</p>
      </div>
      <form onSubmit={createDepartment} className="panel grid gap-3 p-4 md:grid-cols-[240px_1fr_auto]">
        <input className="input" placeholder="Department name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn-primary" type="submit">Add department</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {departments.map((department) => (
          <article key={department.id} className="panel space-y-3 p-4">
            <div className="grid gap-3">
              <input className="input font-semibold" value={department.name} onChange={(e) => setDepartments(departments.map((item) => item.id === department.id ? { ...item, name: e.target.value } : item))} />
              <textarea className="input min-h-20" value={department.description || ''} onChange={(e) => setDepartments(departments.map((item) => item.id === department.id ? { ...item, description: e.target.value } : item))} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">{department.officer_count} officers</span>
              <div className="flex gap-2">
                <button className="btn-muted px-3" type="button" onClick={() => updateDepartment(department)} title="Save department">
                  <Save size={16} />
                </button>
                <button className="btn-muted px-3 text-red-700" type="button" onClick={() => deleteDepartment(department.id)} title="Delete department">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
