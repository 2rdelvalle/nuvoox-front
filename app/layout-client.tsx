'use client';
import { useEffect, useState } from 'react';
import Layout from '@/layout/layout';

/**
 * Componente cliente envoltorio para el layout
 * Solución para problemas de hidratación - renderiza el layout exclusivamente en el cliente
 */
export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Durante el renderizado del servidor, mostrar un contenedor simple
  // para evitar cualquier problema de hidratación
  if (!mounted) {
    return (
      <div id="layout-loading" className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-6 max-w-sm mx-auto">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }
  
  // Una vez en el cliente, renderizar el layout completo
  return <Layout>{children}</Layout>;
}
