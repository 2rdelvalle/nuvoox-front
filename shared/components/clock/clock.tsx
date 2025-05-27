'use client';
import { useEffect, useState } from "react";
import { DateTime } from "luxon";

/**
 * Componente Clock que renderiza la hora actual
 * Diseñado para renderizarse exclusivamente en el cliente para evitar errores de hidratación
 */
const Clock = () => {
  // Valores iniciales seguros para SSR
  const [time, setTime] = useState<DateTime | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Efecto para marcar el componente como montado en el cliente
  useEffect(() => {
    setMounted(true);
    setVisible(true);
    // Inicializar el tiempo solo en el cliente
    setTime(DateTime.now().setZone(Intl.DateTimeFormat().resolvedOptions().timeZone));
  }, []);

  // Actualizar el tiempo cada segundo, pero solo cuando estamos en el cliente
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      setTime(DateTime.now().setZone(Intl.DateTimeFormat().resolvedOptions().timeZone));
    }, 1000);

    return () => clearInterval(interval);
  }, [mounted]);

  // Para mantener visible después de cierto tiempo
  useEffect(() => {
    if (!mounted) return;
    
    const intervalId = setInterval(() => {
      setVisible(true);
    }, 300000); // 5 minutos
    
    return () => clearInterval(intervalId);
  }, [mounted])

  // Si no está montado en el cliente o no es visible, retornar un placeholder
  if (!mounted || !visible || !time) {
    return (
      <div className="flex flex-row align-items-center cursor-pointer gap-2">
        <p className="text-xl font-mono m-0 p-0">--:--:-- --</p>
        <p className="text-xs text-gray-400 m-0 p-0">...</p>
      </div>
    );
  }

  // Solo renderizar la hora real cuando estamos en el cliente
  return (
    <div onClick={() => setVisible(false)} className="flex flex-row align-items-center cursor-pointer gap-2">
      <p className="text-xl font-mono m-0 p-0">{time.toFormat("hh:mm:ss a")}</p>
      <p className="text-xs text-gray-400 m-0 p-0">{time.zoneName}</p>
    </div>
  )
}

export default Clock
