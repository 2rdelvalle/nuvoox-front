import { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import MetricsCard from './MetricsCard';
import DateRangeFilter, { DateRange } from '../filters/DateRangeFilter';
import { CompanyStatsService, CompanyStats as CompanyStatsType } from '@/shared/services/stats/company-stats.service';

interface CompanyStatsProps {
  companyId: number;
  className?: string;
}

/**
 * Componente para mostrar estadísticas de la empresa con filtros de fecha
 */
export default function CompanyStats({ companyId, className = '' }: CompanyStatsProps) {
  // Estado para el rango de fechas
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    return {
      startDate: thirtyDaysAgo,
      endDate: now
    };
  });
  
  // Estado para los datos de estadísticas
  const [stats, setStats] = useState<CompanyStatsType | null>(null);
  
  // Estado para manejar carga y errores
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar estadísticas cuando cambia el rango de fechas o el ID de la empresa
  useEffect(() => {
    const fetchStats = async () => {
      if (!companyId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Usar el servicio para obtener las estadísticas
        const data = await CompanyStatsService.getCompanyStats(companyId, dateRange);
        setStats(data);
      } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        setError('No se pudieron cargar las estadísticas. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [companyId, dateRange]);
  
  // Manejar cambio en el rango de fechas
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };
  
  // Mostrar indicador de carga
  if (loading && !stats) {
    return (
      <Card className={`stats-card ${className}`}>
        <div className="flex items-center justify-center p-6 h-40">
          <ProgressSpinner style={{width: '40px', height: '40px'}} strokeWidth="6" />
          <span className="ml-3 text-gray-600">Cargando estadísticas...</span>
        </div>
      </Card>
    );
  }
  
  // Mostrar mensaje de error
  if (error && !stats) {
    return (
      <Card className={`stats-card ${className}`}>
        <div className="p-6">
          <div className="text-center text-red-500 mb-2">{error}</div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={`stats-card ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-6 py-4">
        <h3 className="text-lg font-semibold">Estadísticas de la Empresa</h3>
      </div>
      <div className="px-6 py-4">
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricsCard
              title="Mensajes Enviados"
              value={stats.messagesSent || 0}
              data={stats.dailySentMessages || []}
              labels={stats.daysLabels || []}
              metricType="sent"
            />
            <MetricsCard
              title="Mensajes Recibidos"
              value={stats.messagesReceived || 0}
              data={stats.dailyReceivedMessages || []}
              labels={stats.daysLabels || []}
              metricType="received"
            />
            <MetricsCard
              title="Total Plantillas"
              value={stats.templates?.total || 0}
              data={[stats.templates?.marketing || 0, stats.templates?.utility || 0, stats.templates?.authentication || 0]}
              labels={['Marketing', 'Utilidad', 'Autenticación']}
              metricType="templateCategory"
            />
            <MetricsCard
              title="Mensajes Total"
              value={(stats.messagesSent || 0) + (stats.messagesReceived || 0)}
              data={[stats.messagesSent || 0, stats.messagesReceived || 0]}
              labels={['Enviados', 'Recibidos']}
              metricType="pie"
            />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No hay estadísticas disponibles para el período seleccionado.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
