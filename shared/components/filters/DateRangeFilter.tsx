import { useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';

// Opciones predefinidas para rangos de fecha
const PREDEFINED_RANGES = [
  { label: 'Hoy', value: 'today' },
  { label: 'Ayer', value: 'yesterday' },
  { label: 'Esta semana', value: 'this_week' },
  { label: 'Semana pasada', value: 'last_week' },
  { label: 'Este mes', value: 'this_month' },
  { label: 'Mes pasado', value: 'last_month' },
  { label: 'Últimos 30 días', value: 'last_30_days' },
  { label: 'Este año', value: 'this_year' },
  { label: 'Personalizado', value: 'custom' }
];

// Obtener rango de fechas basado en una opción predefinida
const getRangeFromOption = (option: string): [Date, Date] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (option) {
    case 'today':
      return [today, now];
    
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return [yesterday, new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)];
    }
    
    case 'this_week': {
      const firstDay = new Date(today);
      const day = today.getDay() || 7; // Convertir 0 (domingo) a 7
      firstDay.setDate(today.getDate() - day + 1); // Lunes de esta semana
      return [firstDay, now];
    }
    
    case 'last_week': {
      const firstDay = new Date(today);
      const day = today.getDay() || 7;
      firstDay.setDate(today.getDate() - day - 6); // Lunes de la semana pasada
      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6); // Domingo de la semana pasada
      lastDay.setHours(23, 59, 59);
      return [firstDay, lastDay];
    }
    
    case 'this_month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return [firstDay, now];
    }
    
    case 'last_month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
      return [firstDay, lastDay];
    }
    
    case 'last_30_days': {
      const firstDay = new Date(today);
      firstDay.setDate(firstDay.getDate() - 30);
      return [firstDay, now];
    }
    
    case 'this_year': {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      return [firstDay, now];
    }
    
    default:
      return [
        new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
        now
      ];
  }
};

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangeFilterProps {
  onChange: (range: DateRange) => void;
  className?: string;
  showApplyButton?: boolean;
}

/**
 * Componente de filtro de rango de fechas
 * Permite seleccionar un rango predefinido o fechas personalizadas
 */
export default function DateRangeFilter({ onChange, className = '', showApplyButton = true }: DateRangeFilterProps) {
  // Estado para el rango seleccionado
  const [selectedRange, setSelectedRange] = useState<string>('last_30_days');
  
  // Estado para las fechas personalizadas
  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const [start, end] = getRangeFromOption('last_30_days');
    return [start, end];
  });
  
  // Manejar cambio en el rango predefinido
  const handleRangeChange = (e: { value: string }) => {
    const range = e.value;
    setSelectedRange(range);
    
    if (range !== 'custom') {
      const [startDate, endDate] = getRangeFromOption(range);
      setDateRange([startDate, endDate]);
      onChange({ startDate, endDate });
    }
  };
  
  // Manejar cambio en el calendario
  const handleDateRangeChange = (e: any) => {
    // PrimeReact Calendar retorna el valor directamente
    const dates = Array.isArray(e.value) ? e.value : [];
    setDateRange(dates);
    
    // Si no es rango personalizado, cambiar a personalizado
    if (selectedRange !== 'custom') {
      setSelectedRange('custom');
    }
    
    // Si hay dos fechas seleccionadas y no se requiere botón aplicar, actualizar inmediatamente
    if (dates.length === 2 && !showApplyButton) {
      const [startDate, endDate] = dates;
      // Establecer la hora del final del día para la fecha final
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59);
      onChange({ startDate, endDate: adjustedEndDate });
    }
  };
  
  // Aplicar el rango de fechas personalizado
  const applyCustomRange = () => {
    if (dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      // Establecer la hora del final del día para la fecha final
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59);
      onChange({ startDate, endDate: adjustedEndDate });
    }
  };
  
  return (
    <div className={`date-range-filter flex flex-wrap gap-2 align-items-center ${className}`}>
      <Dropdown
        value={selectedRange}
        options={PREDEFINED_RANGES}
        onChange={handleRangeChange}
        className="w-auto"
      />
      
      <Calendar
        value={dateRange}
        onChange={handleDateRangeChange}
        selectionMode="range"
        readOnlyInput
        showIcon
        maxDate={new Date()}
        dateFormat="dd/mm/yy"
        className="w-auto"
      />
      
      {showApplyButton && selectedRange === 'custom' && (
        <Button
          label="Aplicar"
          icon="pi pi-check"
          onClick={applyCustomRange}
          disabled={dateRange.length !== 2}
          className="p-button-sm"
        />
      )}
    </div>
  );
}
