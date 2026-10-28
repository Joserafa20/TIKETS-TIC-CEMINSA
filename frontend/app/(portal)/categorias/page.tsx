'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Category {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  activo: boolean;
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', icono: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => null).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startEdit(c: Category) {
    setEditId(c.id);
    setForm({ nombre: c.nombre, descripcion: c.descripcion ?? '', icono: c.icono ?? '' });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm({ nombre: '', descripcion: '', icono: '' });
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editId) {
        await api.patch(`/categories/${editId}`, form);
      } else {
        await api.post('/categories', form);
      }
      cancelForm();
      await load();
    } catch {
      setError('No se pudo guardar la categoría.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    await api.delete(`/categories/${id}`).catch(() => null);
    await load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Categorías de soporte</h1>
          <p className="text-slate-500 text-sm mt-1">{categories.length} categorías configuradas.</p>
        </div>
        <button
          onClick={() => { cancelForm(); setShowForm(!showForm); }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
        >
          {showForm ? '✕ Cancelar' : '➕ Nueva categoría'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <h2 className="font-semibold text-slate-700 mb-4">{editId ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Ícono (emoji)</label>
                <input value={form.icono} onChange={(e) => setForm({ ...form, icono: e.target.value })} placeholder="💻"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre <span className="text-red-500">*</span></label>
                <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label>
              <input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={cancelForm} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60">
                {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear categoría'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400">Cargando...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <div key={c.id} className={`bg-white rounded-xl border p-4 flex items-start justify-between gap-3 ${!c.activo ? 'opacity-50' : 'border-slate-100'}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{c.icono ?? '📁'}</span>
                <div>
                  <p className="font-medium text-slate-800 text-sm">{c.nombre}</p>
                  {c.descripcion && <p className="text-xs text-slate-400 mt-0.5">{c.descripcion}</p>}
                  {!c.activo && <span className="text-xs text-red-400">Inactiva</span>}
                </div>
              </div>
              {c.activo && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(c)} className="text-xs text-blue-500 hover:text-blue-700 transition">Editar</button>
                  <button onClick={() => handleDeactivate(c.id)} className="text-xs text-red-400 hover:text-red-600 transition">Desactivar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
