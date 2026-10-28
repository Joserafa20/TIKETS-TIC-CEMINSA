'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

interface Metrics {
  totalTickets: number;
  byStatus: { estado: string; count: number }[];
  byCategory: { categoria: string; count: number }[];
  byPriority: { prioridad: string; count: number }[];
  byTechnician: { tecnico: string; count: number }[];
  avgResolutionHours: number | null;
  avgRating: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  ABIERTO:    '#3b82f6',
  EN_PROCESO: '#f59e0b',
  PENDIENTE:  '#f97316',
  RESUELTO:   '#22c55e',
  CERRADO:    '#94a3b8',
};

const PRIORITY_COLORS: Record<string, string> = {
  BAJA:    '#22c55e',
  MEDIA:   '#3b82f6',
  ALTA:    '#f97316',
  CRITICA: '#ef4444',
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#f97316', '#ef4444', '#06b6d4'];

export default function ReportesPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  useEffect(() => {
    api.get('/dashboard').then((r) => setMetrics(r.data)).finally(() => setLoading(false));
  }, []);

  async function downloadReport(type: 'pdf' | 'excel') {
    setExporting(type);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api.get(`/reports/${type}?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-tickets.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Cargando métricas...</div>;
  if (!metrics) return <div className="p-8 text-red-500">Error al cargar métricas.</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes y Métricas</h1>
          <p className="text-sm text-slate-500 mt-1">Indicadores del sistema de tickets TIC</p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Desde</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="px-2 py-1.5 rounded border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Hasta</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="px-2 py-1.5 rounded border border-slate-200 text-sm" />
          </div>
          <button onClick={() => downloadReport('pdf')} disabled={exporting !== null}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60">
            {exporting === 'pdf' ? 'Generando...' : '📄 PDF'}
          </button>
          <button onClick={() => downloadReport('excel')} disabled={exporting !== null}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60">
            {exporting === 'excel' ? 'Generando...' : '📊 Excel'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Total tickets" value={metrics.totalTickets} color="blue" />
        <KpiCard label="Abiertos" value={metrics.byStatus.find((s) => s.estado === 'ABIERTO')?.count ?? 0} color="blue" />
        <KpiCard
          label="Tiempo prom. resolución"
          value={metrics.avgResolutionHours != null ? `${metrics.avgResolutionHours}h` : '—'}
          color="amber"
        />
        <KpiCard
          label="Satisfacción"
          value={metrics.avgRating != null ? `${metrics.avgRating} / 5` : '—'}
          color="green"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Tickets por estado">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={metrics.byStatus} dataKey="count" nameKey="estado" cx="50%" cy="50%" outerRadius={80} label={({ estado, count }) => `${estado} (${count})`}>
                {metrics.byStatus.map((s) => (
                  <Cell key={s.estado} fill={STATUS_COLORS[s.estado] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tickets por prioridad">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={metrics.byPriority} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="prioridad" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
                {metrics.byPriority.map((p) => (
                  <Cell key={p.prioridad} fill={PRIORITY_COLORS[p.prioridad] ?? '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Tickets por categoría">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={metrics.byCategory} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="categoria" type="category" tick={{ fontSize: 11 }} width={130} />
              <Tooltip />
              <Bar dataKey="count" name="Tickets" radius={[0, 4, 4, 0]}>
                {metrics.byCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Carga por técnico">
          {metrics.byTechnician.length === 0 ? (
            <p className="text-slate-400 text-sm text-center mt-8">Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics.byTechnician} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="tecnico" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Tickets" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue:  'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] ?? colorMap.blue}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}
