import { useEffect, useState } from 'react';
import { AgentTemplateStatsService } from '@/shared/services/template/agent-template-stats.service';
import type { AgentTemplateStats } from '@/shared/services/template/agent-template-stats.service';
import { Chart } from 'chart.js/auto';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Skeleton } from 'primereact/skeleton';

/**
 * Props para el componente AgentTemplateStats
 */
interface AgentTemplateStatsProps {
  companyId: number | string;
}

/**
 * Componente que muestra estadísticas de plantillas enviadas por cada agente, clasificadas por categoría
 * @param companyId - ID de la empresa para la cual mostrar estadísticas
 */
export default function AgentTemplateStats({ companyId }: AgentTemplateStatsProps) {
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

  // Cargar datos de agentes al montar el componente
  useEffect(() => {
    const fetchAgentStats = async () => {
      if (!companyId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Obtener estadísticas de plantillas por agente
        const data = await AgentTemplateStatsService.getAgentTemplateStats(companyId);
        setAgentStats(data);
        
        // Seleccionar el primer agente por defecto si hay datos y no hay ninguno seleccionado
        if (data.length > 0 && !selectedAgentId) {
          setSelectedAgentId(data[0].agentId);
        }
      } catch (err) {
        console.error('Error al obtener estadísticas de plantillas por agente:', err);
        setError('No se pudieron cargar las estadísticas de plantillas por agente');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentStats();
  }, [companyId]);
  
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
    <Card 
      className="agent-template-stats-card" 
      title="Plantillas por Agente"
      subTitle="Distribución por categoría"
    >
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
