'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Category {
  id: string;
  nombre: string;
  icono?: string;
}

const PRIORITIES = [
  { value: 'BAJA', label: 'Baja', color: 'text-green-600' },
  { value: 'MEDIA', label: 'Media', color: 'text-yellow-600' },
  { value: 'ALTA', label: 'Alta', color: 'text-orange-600' },
  { value: 'CRITICA', label: 'Crítica', color: 'text-red-600' },
];

export default function NuevoTicketPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoriaId: '',
    prioridad: 'MEDIA',
  });

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => null);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoriaId) { setError('Seleccioná una categoría.'); return; }
    setError('');
    setLoading(true);

    try {
      await api.post('/tickets', form);
      router.push('/mis-tickets');
    } catch {
      setError('No se pudo crear el ticket. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Nuevo ticket de soporte</h1>
        <p className="text-slate-500 text-sm mt-1">Completá el formulario y el equipo TIC lo atenderá a la brevedad.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título <span className="text-red-500">*</span></label>
            <input
              name="titulo"
              required
              value={form.titulo}
              onChange={handleChange}
              placeholder="Ej: La impresora no imprime en color"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción <span className="text-red-500">*</span></label>
            <textarea
              name="descripcion"
              required
              rows={4}
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Describí el problema con el mayor detalle posible..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría <span className="text-red-500">*</span></label>
              <select
                name="categoriaId"
                value={form.categoriaId}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">Seleccioná...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icono ? `${c.icono} ` : ''}{c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
              <select
                name="prioridad"
                value={form.prioridad}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-60"
            >
              {loading ? 'Creando...' : 'Crear ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
