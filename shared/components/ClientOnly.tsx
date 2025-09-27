'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que solo renderiza su contenido en el cliente.
 * Solución para errores de hidratación en componentes que dependen
 * de APIs del navegador o que son dinámicos.
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Si estamos en servidor o durante la primera renderización en el cliente,
  // mostramos el fallback o nada para evitar discrepancias de hidratación
  if (!isMounted) {
    return <>{fallback}</>;
  }

  // Una vez montado en el cliente, mostramos los children
  return <>{children}</>;
}
