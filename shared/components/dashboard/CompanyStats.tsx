import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Spinner } from '@nextui-org/react';
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
        <CardBody className="flex items-center justify-center p-6 h-40">
          <Spinner label="Cargando estadísticas..." color="primary" />
        </CardBody>
      </Card>
    );
  }
  
  // Mostrar mensaje de error
  if (error && !stats) {
    return (
      <Card className={`stats-card ${className}`}>
        <CardBody className="p-6">
          <div className="text-center text-red-500 mb-2">{error}</div>
        </CardBody>
      </Card>
    );
  }
  
  return (
    <Card className={`stats-card ${className}`}>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-6 py-4">
        <h3 className="text-lg font-semibold">Estadísticas de la Empresa</h3>
        
        <DateRangeFilter 
          onChange={handleDateRangeChange} 
          className="ml-auto" 
          showApplyButton={false}
        />
      </CardHeader>
      
      <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats ? (
          <>
            <MetricsCard
              title="Mensajes Enviados vs Recibidos"
              value={stats.messagesSent + stats.messagesReceived}
              data={[stats.messagesSent, stats.messagesReceived]}
              labels={["Enviados", "Recibidos"]}
              metricType="pie"
            />
            
            <MetricsCard
              title="Plantillas por Categoría"
              value={stats.templates?.total || 0}
              data={[
                stats.templates?.marketing || 0,
                stats.templates?.utility || 0,
                stats.templates?.authentication || 0
              ]}
              labels={["Marketing", "Utilidad", "Autenticación"]}
              metricType="templateCategory"
            />
            
            <MetricsCard
              title="Mensajes Enviados por Día"
              value={stats.messagesSent || 0}
              data={stats.dailySentMessages || [0, 0, 0, 0, 0, 0, 0]}
              labels={stats.daysLabels || ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]}
              metricType="sent"
            />
            
            <MetricsCard
              title="Mensajes Recibidos por Día"
              value={stats.messagesReceived || 0}
              data={stats.dailyReceivedMessages || [0, 0, 0, 0, 0, 0, 0]}
              labels={stats.daysLabels || ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]}
              metricType="received"
            />
          </>
        ) : (
          <div className="col-span-2 text-center text-gray-500">
            No hay datos disponibles para el período seleccionado
          </div>
        )}
      </CardBody>
    </Card>
  );
}
