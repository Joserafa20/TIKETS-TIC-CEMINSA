'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

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
  comentarioCalif?: string;
  fechaApertura: string;
  fechaCierre?: string;
  categoria: { nombre: string };
  solicitante: { nombre: string; email: string };
  tecnico?: { nombre: string };
  comentarios: Comment[];
}

const STATUS_COLORS: Record<string, string> = {
  ABIERTO:    'bg-blue-100 text-blue-700',
  EN_PROCESO: 'bg-yellow-100 text-yellow-700',
  PENDIENTE:  'bg-orange-100 text-orange-700',
  RESUELTO:   'bg-green-100 text-green-700',
  CERRADO:    'bg-slate-100 text-slate-600',
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState('');
  const [sending, setSending] = useState(false);
  const [rating, setRating] = useState(0);
  const [comentarioCalif, setComentarioCalif] = useState('');
  const [rating_sending, setRatingSending] = useState(false);

  async function load() {
    try {
      const r = await api.get(`/tickets/${id}`);
      setTicket(r.data);
    } catch { router.push('/mis-tickets'); }
    finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comentario.trim()) return;
    setSending(true);
    await api.post(`/tickets/${id}/comments`, { contenido: comentario }).catch(() => null);
    setComentario('');
    await load();
    setSending(false);
  }

  async function handleRate(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setRatingSending(true);
    await api.patch(`/tickets/${id}`, { calificacion: rating, comentarioCalif }).catch(() => null);
    await load();
    setRatingSending(false);
  }

  if (loading) return <div className="p-6 text-slate-400">Cargando...</div>;
  if (!ticket) return null;

  const canRate = user?.rol === 'SOLICITANTE' && ticket.estado === 'RESUELTO' && !ticket.calificacion;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1">
        ← Volver
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-slate-800">{ticket.titulo}</h1>
          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[ticket.estado] ?? ''}`}>
            {ticket.estado.replace('_', ' ')}
          </span>
        </div>

        <p className="text-slate-600 text-sm mb-5 whitespace-pre-line">{ticket.descripcion}</p>

        <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
          <div><span className="font-medium text-slate-700">Categoría:</span> {ticket.categoria.nombre}</div>
          <div><span className="font-medium text-slate-700">Prioridad:</span> {ticket.prioridad}</div>
          <div><span className="font-medium text-slate-700">Técnico:</span> {ticket.tecnico?.nombre ?? 'Sin asignar'}</div>
          <div><span className="font-medium text-slate-700">Abierto el:</span> {new Date(ticket.fechaApertura).toLocaleDateString('es-CO')}</div>
          {ticket.calificacion && (
            <div><span className="font-medium text-slate-700">Calificación:</span> {'⭐'.repeat(ticket.calificacion)} ({ticket.calificacion}/5)</div>
          )}
        </div>
      </div>

      {/* Rating panel */}
      {canRate && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-green-800 mb-3">¿Cómo fue la atención?</h3>
          <form onSubmit={handleRate} className="space-y-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`text-2xl transition ${n <= rating ? 'opacity-100' : 'opacity-30'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <input
              value={comentarioCalif}
              onChange={(e) => setComentarioCalif(e.target.value)}
              placeholder="Comentario opcional..."
              className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              disabled={!rating || rating_sending}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
            >
              {rating_sending ? 'Enviando...' : 'Enviar calificación'}
            </button>
          </form>
        </div>
      )}

      {/* Comments */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Comentarios ({ticket.comentarios.length})</h2>

        {ticket.comentarios.length === 0 ? (
          <p className="text-slate-400 text-sm mb-4">Todavía no hay comentarios.</p>
        ) : (
          <div className="space-y-3 mb-5">
            {ticket.comentarios.map((c) => (
              <div key={c.id} className={`rounded-xl p-3 text-sm ${c.esInterno ? 'bg-yellow-50 border border-yellow-100' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-700">{c.autor.nombre}</span>
                  <span className="text-slate-400 text-xs">{c.autor.rol}</span>
                  {c.esInterno && <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Interno</span>}
                  <span className="text-slate-400 text-xs ml-auto">{new Date(c.createdAt).toLocaleDateString('es-CO')}</span>
                </div>
                <p className="text-slate-600">{c.contenido}</p>
              </div>
            ))}
          </div>
        )}

        {ticket.estado !== 'CERRADO' && (
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Agregar un comentario..."
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={sending || !comentario.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
            >
              {sending ? '...' : 'Enviar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
