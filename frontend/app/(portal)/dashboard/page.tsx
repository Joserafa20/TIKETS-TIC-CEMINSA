'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Ticket {
  id: string;
  titulo: string;
  estado: string;
  prioridad: string;
  fechaApertura: string;
  categoria: { nombre: string };
  solicitante: { nombre: string };
  tecnico?: { nombre: string };
}

const STATUS_COLORS: Record<string, string> = {
  ABIERTO:    'bg-blue-100 text-blue-700',
  EN_PROCESO: 'bg-yellow-100 text-yellow-700',
  PENDIENTE:  'bg-orange-100 text-orange-700',
  RESUELTO:   'bg-green-100 text-green-700',
  CERRADO:    'bg-slate-100 text-slate-600',
};

const PRIORITY_DOT: Record<string, string> = {
  BAJA:    'bg-green-400',
  MEDIA:   'bg-yellow-400',
  ALTA:    'bg-orange-400',
  CRITICA: 'bg-red-500',
};

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = filter ? `?estado=${filter}` : '';
    api.get(`/tickets${params}`)
      .then((r) => setTickets(r.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [filter]);

  const counts = {
    ABIERTO:    tickets.filter((t) => t.estado === 'ABIERTO').length,
    EN_PROCESO: tickets.filter((t) => t.estado === 'EN_PROCESO').length,
    PENDIENTE:  tickets.filter((t) => t.estado === 'PENDIENTE').length,
    RESUELTO:   tickets.filter((t) => t.estado === 'RESUELTO').length,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de tickets</h1>
          <p className="text-slate-500 text-sm mt-1">Gestioná todas las solicitudes de soporte.</p>
        </div>
        <Link
          href="/nuevo-ticket"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
        >
          ➕ Nuevo ticket
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { key: 'ABIERTO', label: 'Abiertos', color: 'text-blue-600' },
          { key: 'EN_PROCESO', label: 'En proceso', color: 'text-yellow-600' },
          { key: 'PENDIENTE', label: 'Pendientes', color: 'text-orange-600' },
          { key: 'RESUELTO', label: 'Resueltos', color: 'text-green-600' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(filter === s.key ? '' : s.key)}
            className={`bg-white rounded-xl border p-4 text-left transition hover:shadow-sm ${filter === s.key ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-100'}`}
          >
            <p className="text-2xl font-bold text-slate-800">{counts[s.key as keyof typeof counts]}</p>
            <p className={`text-sm font-medium mt-0.5 ${s.color}`}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Cargando tickets...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Prioridad</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Ticket</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Solicitante</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Técnico</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No hay tickets para mostrar.</td></tr>
              ) : tickets.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[t.prioridad] ?? 'bg-slate-300'}`} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${t.id}`} className="font-medium text-slate-800 hover:text-blue-600 transition">
                      {t.titulo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.solicitante.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{t.categoria.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[t.estado] ?? ''}`}>
                      {t.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.tecnico?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(t.fechaApertura).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
