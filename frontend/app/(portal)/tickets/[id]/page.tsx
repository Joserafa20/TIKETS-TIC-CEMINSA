'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface User { id: string; nombre: string; }

interface Comment {
  id: string;
  contenido: string;
  esInterno: boolean;
  createdAt: string;
  autor: { nombre: string; rol: string };
}

interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  calificacion?: number;
  fechaApertura: string;
  fechaCierre?: string;
  categoria: { nombre: string };
  solicitante: { nombre: string; email: string; area?: string };
  tecnico?: { id: string; nombre: string };
  comentarios: Comment[];
}

const STATUSES = ['ABIERTO', 'EN_PROCESO', 'PENDIENTE', 'RESUELTO', 'CERRADO'];

const STATUS_COLORS: Record<string, string> = {
  ABIERTO:    'bg-blue-100 text-blue-700',
  EN_PROCESO: 'bg-yellow-100 text-yellow-700',
  PENDIENTE:  'bg-orange-100 text-orange-700',
  RESUELTO:   'bg-green-100 text-green-700',
  CERRADO:    'bg-slate-100 text-slate-600',
};

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState('');
  const [esInterno, setEsInterno] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [tr, ur] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get('/users'),
      ]);
      setTicket(tr.data);
      setTechnicians((ur.data as Array<User & { rol: string }>).filter((u) => u.rol === 'TECNICO' || u.rol === 'ADMIN'));
    } catch { router.push('/dashboard'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function handleUpdate(patch: Record<string, unknown>) {
    setSaving(true);
    await api.patch(`/tickets/${id}`, patch).catch(() => null);
    await load();
    setSaving(false);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comentario.trim()) return;
    setSending(true);
    await api.post(`/tickets/${id}/comments`, { contenido: comentario, esInterno }).catch(() => null);
    setComentario('');
    await load();
    setSending(false);
  }

  if (loading) return <div className="p-6 text-slate-400">Cargando...</div>;
  if (!ticket) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1">
        ← Volver al panel
      </button>

      <div className="grid grid-cols-3 gap-5">
        {/* Main */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-xl font-bold text-slate-800">{ticket.titulo}</h1>
              <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[ticket.estado] ?? ''}`}>
                {ticket.estado.replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-600 text-sm whitespace-pre-line">{ticket.descripcion}</p>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-700 mb-4">Comentarios</h2>

            {ticket.comentarios.length === 0 && (
              <p className="text-slate-400 text-sm mb-4">Sin comentarios aún.</p>
            )}

            <div className="space-y-3 mb-5">
              {ticket.comentarios.map((c) => (
                <div key={c.id} className={`rounded-xl p-3 text-sm ${c.esInterno ? 'bg-yellow-50 border border-yellow-100' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-700">{c.autor.nombre}</span>
                    {c.esInterno && <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Interno</span>}
                    <span className="text-slate-400 text-xs ml-auto">{new Date(c.createdAt).toLocaleDateString('es-CO')}</span>
                  </div>
                  <p className="text-slate-600">{c.contenido}</p>
                </div>
              ))}
            </div>

            {ticket.estado !== 'CERRADO' && (
              <form onSubmit={handleComment} className="space-y-2">
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Escribí un comentario..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                    <input type="checkbox" checked={esInterno} onChange={(e) => setEsInterno(e.target.checked)} className="rounded" />
                    Comentario interno (solo técnicos)
                  </label>
                  <button
                    type="submit"
                    disabled={sending || !comentario.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
                  >
                    {sending ? '...' : 'Enviar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Solicitante</p>
              <p className="text-sm font-medium text-slate-700">{ticket.solicitante.nombre}</p>
              <p className="text-xs text-slate-400">{ticket.solicitante.email}</p>
              {ticket.solicitante.area && <p className="text-xs text-slate-400">{ticket.solicitante.area}</p>}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Categoría</p>
              <p className="text-sm text-slate-700">{ticket.categoria.nombre}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Prioridad</p>
              <p className="text-sm text-slate-700">{ticket.prioridad}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Estado</p>
              <select
                value={ticket.estado}
                disabled={saving}
                onChange={(e) => handleUpdate({ estado: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>

            {user?.rol === 'ADMIN' && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Técnico asignado</p>
                <select
                  value={ticket.tecnico?.id ?? ''}
                  disabled={saving}
                  onChange={(e) => handleUpdate({ tecnicoId: e.target.value || null })}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin asignar</option>
                  {technicians.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            )}

            {ticket.calificacion && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Calificación</p>
                <p className="text-sm">{'⭐'.repeat(ticket.calificacion)} ({ticket.calificacion}/5)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
