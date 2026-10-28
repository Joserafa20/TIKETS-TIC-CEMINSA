'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const PUBLIC_ROUTES = ['/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

    api.get('/auth/me')
      .then((res) => {
        setUser(res.data);
        if (isPublic) {
          const dest = res.data.rol === 'SOLICITANTE' ? '/mis-tickets' : '/dashboard';
          router.replace(dest);
        }
      })
      .catch(() => {
        setUser(null);
        if (!isPublic) router.replace('/login');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <>{children}</>;
}
