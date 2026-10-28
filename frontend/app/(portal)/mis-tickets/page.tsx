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
  tecnico?: { nombre: string };
}

const STATUS_COLORS: Record<string, string> = {
  ABIERTO:     'bg-blue-100 text-blue-700',
  EN_PROCESO:  'bg-yellow-100 text-yellow-700',
  PENDIENTE:   'bg-orange-100 text-orange-700',
  RESUELTO:    'bg-green-100 text-green-700',
  CERRADO:     'bg-slate-100 text-slate-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  BAJA:    'bg-green-50 text-green-700',
  MEDIA:   'bg-yellow-50 text-yellow-700',
  ALTA:    'bg-orange-50 text-orange-700',
  CRITICA: 'bg-red-50 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  ABIERTO: 'Abierto', EN_PROCESO: 'En proceso', PENDIENTE: 'Pendiente',
  RESUELTO: 'Resuelto', CERRADO: 'Cerrado',
};

export default function MisTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tickets')
      .then((r) => setTickets(r.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis tickets</h1>
          <p className="text-slate-500 text-sm mt-1">Historial de todas tus solicitudes de soporte.</p>
        </div>
        <Link
          href="/nuevo-ticket"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
        >
          ➕ Nuevo ticket
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Cargando tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎫</p>
          <p className="text-slate-600 font-medium">No tenés tickets aún</p>
          <p className="text-slate-400 text-sm mt-1">Creá uno cuando necesites soporte técnico.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Ticket</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Prioridad</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Técnico</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <Link href={`/mis-tickets/${t.id}`} className="font-medium text-slate-800 hover:text-blue-600 transition">
                      {t.titulo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.categoria.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[t.estado] ?? ''}`}>
                      {STATUS_LABELS[t.estado] ?? t.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[t.prioridad] ?? ''}`}>
                      {t.prioridad.charAt(0) + t.prioridad.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.tecnico?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(t.fechaApertura).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
