import { useEffect, useState } from 'react';
import { AgentTemplateStatsService } from '@/shared/services/template/agent-template-stats.service';
import type { AgentTemplateStats, DateFilter } from '@/shared/services/template/agent-template-stats.service';
import { Chart } from 'chart.js/auto';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Skeleton } from 'primereact/skeleton';
import DateRangeFilter, { DateRange } from '../filters/DateRangeFilter';

/**
 * Props para el componente AgentTemplateStats
 */
interface AgentTemplateStatsProps {
  companyId: number | string;
  showDateFilter?: boolean;
}

/**
 * Componente que muestra estadísticas de plantillas enviadas por cada agente, clasificadas por categoría
 * @param companyId - ID de la empresa para la cual mostrar estadísticas
 * @param showDateFilter - Si se debe mostrar el filtro de fechas
 */
export default function AgentTemplateStats({ companyId, showDateFilter = true }: AgentTemplateStatsProps) {
  // Estado para almacenar los datos de estadísticas de todos los agentes
  const [agentStats, setAgentStats] = useState<AgentTemplateStats[]>([]);
  
  // Estado para manejar posibles errores
  const [error, setError] = useState<string | null>(null);
  
  // Estado para indicar si está cargando los datos
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estado para el agente seleccionado actualmente
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  
  // Referencia al elemento canvas de la gráfica
  const chartRef = useState<HTMLCanvasElement | null>(null);
  
  // Referencia a la instancia de la gráfica
  const chartInstance = useState<Chart | null>(null);
  
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

  // Cargar datos de agentes al montar el componente o cuando cambia el filtro de fechas
  useEffect(() => {
    const fetchAgentStats = async () => {
      if (!companyId) return;
      
      // Validar que el rango de fechas sea válido
      if (!dateRange.startDate || !dateRange.endDate) {
        console.warn('Rango de fechas incompleto:', dateRange);
        return;
      }
      
      // Validar que la fecha de inicio no sea posterior a la fecha de fin
      if (dateRange.startDate > dateRange.endDate) {
        console.warn('Fecha de inicio posterior a fecha de fin:', dateRange);
        setError('El rango de fechas seleccionado no es válido');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Formatear fechas para la API
        const startDate = dateRange.startDate.toISOString().split('T')[0];
        const endDate = dateRange.endDate.toISOString().split('T')[0];
        
        console.log(`Consultando estadísticas con fechas: startDate=${startDate}, endDate=${endDate}`);
        
        // Definir el filtro de fechas
        const dateFilter: DateFilter = { startDate, endDate };
        
        // Obtener estadísticas de plantillas por agente con filtro de fechas
        const data = await AgentTemplateStatsService.getAgentTemplateStats(
          companyId,
          dateFilter
        );
        
        setAgentStats(data);
        
        // Seleccionar el primer agente por defecto si hay datos y no hay ninguno seleccionado
        if (data.length > 0 && !selectedAgentId) {
          setSelectedAgentId(data[0].agentId);
        } else if (data.length === 0) {
          // Si no hay datos, resetear el agente seleccionado
          setSelectedAgentId(null);
        }
      } catch (err) {
        console.error('Error al obtener estadísticas de plantillas por agente:', err);
        setError('No se pudieron cargar las estadísticas de plantillas por agente');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentStats();
  }, [companyId, dateRange]);
  
  // Manejar cambio en el rango de fechas
  const handleDateRangeChange = (range: DateRange) => {
    console.log('Nuevo rango de fechas seleccionado:', {
      startDate: range.startDate.toISOString().split('T')[0], 
      endDate: range.endDate.toISOString().split('T')[0]
    });
    
    // Asegurarse de que ambas fechas sean instancias de Date válidas
    if (!(range.startDate instanceof Date) || !(range.endDate instanceof Date)) {
      console.error('Fechas inválidas recibidas:', range);
      return;
    }
    
    setDateRange(range);
  };
  
  // Obtener datos del agente seleccionado
  const selectedAgent = selectedAgentId 
    ? agentStats.find(agent => agent.agentId === selectedAgentId)
    : null;
  
  // Opciones para el dropdown de selección de agente
  const agentOptions = agentStats.map(agent => ({
    label: agent.agentName,
    value: agent.agentId
  }));
  
  // Función para actualizar el agente seleccionado
  const handleAgentChange = (e: { value: number }) => {
    setSelectedAgentId(e.value);
  };
  
  // Preparar datos para la gráfica
  const chartData = selectedAgent ? {
    labels: ['Marketing', 'Utilidad', 'Autenticación'],
    datasets: [
      {
        label: 'Plantillas enviadas',
        data: [
          selectedAgent.marketing,
          selectedAgent.utility,
          selectedAgent.authentication
        ],
        backgroundColor: [
          '#EC4899', // Marketing (rosa)
          '#10B981', // Utilidad (verde)
          '#6366F1'  // Autenticación (azul)
        ],
        borderColor: 'white',
        borderWidth: 1
      }
    ]
  } : null;
  
  // Mostrar mensajes de estado
  if (loading) {
    return (
      <Card className="agent-template-stats-card">
        <div className="mb-3">
          <Skeleton height="2rem" width="70%" className="mb-2"></Skeleton>
          <Skeleton height="1.5rem" width="40%"></Skeleton>
        </div>
        <Skeleton height="20rem" className="mb-2"></Skeleton>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="agent-template-stats-card">
        <div className="p-4 text-center text-red-500">
          <i className="pi pi-exclamation-triangle mr-2"></i>
          {error}
        </div>
      </Card>
    );
  }
  
  // Si no hay datos, mostrar mensaje informativo
  if (agentStats.length === 0) {
    return (
      <Card className="agent-template-stats-card" title="Plantillas por Agente">
        <div className="p-4 text-center">
          No hay datos de plantillas disponibles para los agentes de esta empresa
        </div>
      </Card>
    );
  }

  // Renderizar componente con los datos
  return (
    <Card className="agent-template-stats-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-4 pt-4">
        <div>
          <h3 className="text-lg font-semibold m-0">Plantillas por Agente</h3>
          <p className="text-sm text-gray-500 m-0">Distribución por categoría</p>
        </div>
        
        {showDateFilter && (
          <div className="ml-auto">
            <DateRangeFilter 
              onChange={handleDateRangeChange} 
              className="" 
              showApplyButton={true}
            />
            {error && error.includes('rango de fechas') && (
              <div className="p-error text-sm mt-1">{error}</div>
            )}
          </div>
        )}
      </div>
      <div className="mb-4">
        <Dropdown
          value={selectedAgentId}
          options={agentOptions}
          onChange={handleAgentChange}
          placeholder="Seleccionar agente"
          className="w-full"
        />
      </div>
      
      {selectedAgent && (
        <div className="agent-stats-container">
          <div className="grid">
            <div className="col-12 md:col-4 text-center">
              <div className="text-900 font-medium mb-1">Marketing</div>
              <div className="text-3xl font-bold text-pink-600">{selectedAgent.marketing}</div>
            </div>
            <div className="col-12 md:col-4 text-center">
              <div className="text-900 font-medium mb-1">Utilidad</div>
              <div className="text-3xl font-bold text-green-600">{selectedAgent.utility}</div>
            </div>
            <div className="col-12 md:col-4 text-center">
              <div className="text-900 font-medium mb-1">Autenticación</div>
              <div className="text-3xl font-bold text-indigo-600">{selectedAgent.authentication}</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="text-xl font-medium text-center mb-3">
              Total de plantillas: <span className="font-bold">{selectedAgent.total}</span>
            </div>
            
            {/* Visualización del gráfico de barras */}
            <div className="chart-container">
              {chartData && (
                <canvas
                  ref={(el) => chartRef[1](el)}
                  height={120}
                  id="agentTemplateChart"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Inicializa y actualiza el gráfico cuando los datos o el agente seleccionado cambian
 */
function useChartEffect(chartData: any, chartRef: [HTMLCanvasElement | null, (node: HTMLCanvasElement | null) => void], chartInstance: [Chart | null, (chart: Chart | null) => void]) {
  useEffect(() => {
    // Si no hay datos o referencia al canvas, no hacer nada
    if (!chartData || !chartRef[0]) return;
    
    // Si ya existe una instancia de gráfico, destruirla
    if (chartInstance[0]) {
      chartInstance[0].destroy();
    }
    
    // Crear nueva instancia de gráfico
    const ctx = chartRef[0].getContext('2d');
    if (ctx) {
      const newChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'var(--surface-800)',
              titleFont: { family: 'inherit', size: 14 },
              bodyFont: { family: 'inherit', size: 12 },
              padding: 12,
              cornerRadius: 6,
              displayColors: true
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'var(--surface-border)'
              },
              ticks: {
                precision: 0
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          }
        }
      });
      
      chartInstance[1](newChart);
    }
    
    // Limpiar al desmontar
    return () => {
      if (chartInstance[0]) {
        chartInstance[0].destroy();
        chartInstance[1](null);
      }
    };
  }, [chartData, chartRef, chartInstance]);
}
