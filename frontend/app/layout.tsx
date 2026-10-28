import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ErrorModal } from '@/components/ui/error-modal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Soporte TIC — ESE CEMINSA',
  description: 'Sistema interno de gestión de soporte técnico',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <ErrorModal />
        </AuthProvider>
      </body>
    </html>
  );
}
