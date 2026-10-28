'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',    label: 'Panel',          icon: '📊', roles: ['ADMIN', 'TECNICO'] },
  { href: '/tickets',      label: 'Todos los tickets', icon: '📋', roles: ['ADMIN', 'TECNICO'] },
  { href: '/mis-tickets',  label: 'Mis tickets',    icon: '🎫', roles: ['SOLICITANTE'] },
  { href: '/nuevo-ticket', label: 'Nuevo ticket',   icon: '➕', roles: ['ADMIN', 'TECNICO', 'SOLICITANTE'] },
  { href: '/usuarios',     label: 'Usuarios',       icon: '👥', roles: ['ADMIN'] },
  { href: '/categorias',   label: 'Categorías',     icon: '🗂️',  roles: ['ADMIN'] },
  { href: '/reportes',     label: 'Reportes',       icon: '📈', roles: ['ADMIN', 'TECNICO'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await api.post('/auth/logout').catch(() => null);
    logout();
    router.replace('/login');
  }

  const visible = NAV_ITEMS.filter((item) => user && item.roles.includes(user.rol));

  return (
    <aside className="w-60 min-h-screen bg-slate-900 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎫</span>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Soporte TIC</p>
            <p className="text-slate-400 text-xs">ESE CEMINSA</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-slate-700">
        {user && (
          <div className="mb-3">
            <p className="text-white text-sm font-medium truncate">{user.nombre}</p>
            <p className="text-slate-400 text-xs truncate">{user.email}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
              {user.rol}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-slate-400 hover:text-red-400 transition-colors"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
