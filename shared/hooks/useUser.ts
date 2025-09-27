'use client';
import { useState, useEffect } from 'react';

/**
 * Hook personalizado que simula datos de usuario para prototipado
 * Esto permite que el dashboard funcione mientras se implementa la autenticación real
 * @returns Objeto con datos simulados del usuario y estado de carga
 */
export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulamos una carga de datos del usuario (reemplazar con lógica real de autenticación)
    const timer = setTimeout(() => {
      // Datos de usuario de ejemplo para desarrollo
      setUser({
        userId: 1,
        name: 'Usuario Demo',
        company: {
          companyId: 2,  // Este es el ID que usará el componente de balance
          name: 'Empresa Demo'
        }
      });
      setIsLoading(false);
    }, 500); // Simula tiempo de carga

    return () => clearTimeout(timer);
  }, []);

  return {
    user,
    isLoading
  };
}
