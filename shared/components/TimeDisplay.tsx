'use client';
import { useState, useEffect, ReactNode } from 'react';

interface TimeDisplayProps {
  fallback?: ReactNode;
}

/**
 * Componente que muestra la hora actual
 * Diseñado para renderizarse exclusivamente en el cliente
 */
const TimeDisplay = ({ fallback }: TimeDisplayProps) => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Marcar como montado (solo ocurre en el cliente)
    setMounted(true);
    
    // Establecer la hora inicial
    setCurrentTime(new Date());
    
    // Actualizar la hora cada minuto
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Mientras no estemos en el cliente, mostrar el fallback proporcionado
  if (!mounted || !currentTime) {
    return <>{fallback}</> || null;
  }

  // Formatear la hora actual (solo en el cliente)
  const formattedTime = currentTime.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <span className="inline-block bg-gray-100 px-3 py-1 rounded-lg">
      <i className="pi pi-clock mr-2"></i>
      {formattedTime}
    </span>
  );
};

export default TimeDisplay;
