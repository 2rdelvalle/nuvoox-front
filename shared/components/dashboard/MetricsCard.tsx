import { useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'chart.js/auto';

type MetricType = 'sent' | 'received' | 'conversations' | 'companies' | 'pie' | 'templateCategory';

type MetricsCardProps = {
  title: string;
  value: number;
  data: number[];
  labels: string[];
  metricType: MetricType;
};

export default function MetricsCard({ title, value, data, labels, metricType }: MetricsCardProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const getChartConfig = () => {
    const colors = {
      sent: {
        base: '#6366F1',
        light: '#818CF8'
      },
      received: {
        base: '#10B981',
        light: '#34D399'
      },
      conversations: {
        base: '#F59E0B',
        light: '#FBBF24'
      },
      companies: {
        base: '#8B5CF6',
        light: '#A78BFA'
      },
      templateCategory: {
        base: '#EC4899',
        light: '#F472B6'
      }
    };

    const ctx = chartRef.current?.getContext('2d');
    let gradient;
    
    if (ctx && metricType !== 'pie') {
      gradient = ctx.createLinearGradient(0, 0, 0, 150);
      gradient.addColorStop(0, `${colors[metricType].base}80`);
      gradient.addColorStop(1, `${colors[metricType].base}10`);
    }

    const commonConfig = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1800,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'var(--surface-800)',
          titleFont: { family: 'inherit', size: 14 },
          bodyFont: { family: 'inherit', size: 12 },
          padding: 12,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            label: (context: any) => `${context.parsed.y} ${metricType === 'conversations' ? 'conv' : metricType === 'companies' ? 'empresas' : 'msg'}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: 'var(--text-color-secondary)' }
        },
        y: {
          grid: { color: 'var(--surface-border)' },
          ticks: { color: 'var(--text-color-secondary)' },
          beginAtZero: true
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };

    const configs = {
    templateCategory: {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            '#EC4899', // Marketing
            '#10B981', // Utilidad
            '#6366F1'  // Autenticación
          ],
          borderColor: 'white',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: [
            '#F472B6', // Marketing
            '#34D399', // Utilidad
            '#818CF8'  // Autenticación
          ]
        }]
      },
      options: {
        ...commonConfig,
        plugins: {
          ...commonConfig.plugins,
          tooltip: {
            ...commonConfig.plugins.tooltip,
            callbacks: {
              label: (context: any) => `${context.parsed.y} plantillas de ${context.label.toLowerCase()}`
            }
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: 'var(--text-color-secondary)',
              font: { size: 12, family: 'inherit' }
            }
          }
        },
        animation: {
          ...commonConfig.animation,
          delay: (ctx: any) => ctx.dataIndex * 150,
          easing: 'easeOutBounce'
        }
      }
    },
    pie: {
      type: 'pie',
      data: {
        labels: ['Enviados', 'Recibidos', 'Conversaciones'],
        datasets: [{
          data,
          backgroundColor: [
            '#6366F1', // Enviados
            '#10B981', // Recibidos
            '#F59E0B'  // Conversaciones
          ],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: 'var(--text-color-secondary)',
              font: { size: 14, family: 'inherit' }
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.label}: ${context.parsed} mensajes`
            },
            backgroundColor: 'var(--surface-800)',
            bodyFont: { family: 'inherit', size: 14 },
            padding: 12,
            cornerRadius: 6,
            displayColors: true
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1500,
          easing: 'easeOutBounce'
        }
      }
    },
      sent: {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data,
            borderColor: colors.sent.base,
            backgroundColor: 'transparent',
            borderWidth: 4,
            tension: 0.4,
            fill: false,
            pointBackgroundColor: colors.sent.base,
            pointRadius: 0,
            pointHoverRadius: 8,
            borderJoinStyle: 'round',
            borderCapStyle: 'round',
            pointHitRadius: 10
          }]
        },
        options: {
          ...commonConfig,
          animation: {
            ...commonConfig.animation,
            onComplete: (ctx: any) => {
              const chart = ctx.chart;
              const ctx2 = chart.ctx;
              
              // Animación del punto final
              const animatePoint = () => {
                const line = chart.getDatasetMeta(0).data[chart.getDatasetMeta(0).data.length - 1];
                ctx2.save();
                ctx2.beginPath();
                ctx2.arc(line.x, line.y, 8, 0, Math.PI * 2);
                ctx2.fillStyle = colors.sent.base;
                ctx2.shadowColor = colors.sent.light;
                ctx2.shadowBlur = 15;
                ctx2.fill();
                ctx2.restore();
                
                requestAnimationFrame(animatePoint);
              };
              
              animatePoint();
            }
          }
        }
      },
      received: {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: (ctx: any) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 150);
              gradient.addColorStop(0, colors.received.light);
              gradient.addColorStop(1, colors.received.base);
              return gradient;
            },
            borderColor: colors.received.base,
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
            hoverBackgroundColor: colors.received.light
          }]
        },
        options: {
          ...commonConfig,
          animation: {
            ...commonConfig.animation,
            delay: (ctx: any) => ctx.dataIndex * 120,
            easing: 'easeOutBounce'
          }
        }
      },
      conversations: {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data,
            borderColor: colors.conversations.base,
            backgroundColor: gradient,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: colors.conversations.base,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHitRadius: 10
          }]
        },
        options: {
          ...commonConfig,
          animation: {
            ...commonConfig.animation,
            easing: 'easeInOutCubic',
            onProgress: (ctx: any) => {
              const chart = ctx.chart;
              const gradient = chart.ctx.createLinearGradient(0, 0, 0, chart.height);
              gradient.addColorStop(0, `${colors.conversations.base}${Math.min(80, Math.floor(ctx.currentStep / ctx.numSteps * 80))}`);
              gradient.addColorStop(1, `${colors.conversations.base}10`);
              chart.data.datasets[0].backgroundColor = gradient;
              chart.update();
            }
          }
        }
      },
      companies: {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: (ctx: any) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 150);
              gradient.addColorStop(0, colors.companies.light);
              gradient.addColorStop(1, colors.companies.base);
              return gradient;
            },
            borderColor: colors.companies.base,
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
            hoverBackgroundColor: colors.companies.light
          }]
        },
        options: {
          ...commonConfig,
          plugins: {
            ...commonConfig.plugins,
            tooltip: {
              ...commonConfig.plugins.tooltip,
              callbacks: {
                label: (context: any) => `${context.parsed.y} empresas`
              }
            }
          },
          animation: {
            ...commonConfig.animation,
            delay: (ctx: any) => ctx.dataIndex * 100,
            easing: 'easeOutElastic'
          }
        }
      }
    };

    return configs[metricType];
  };

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const config = getChartConfig();
        chartInstance.current = new Chart(ctx, config as any);
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, labels, metricType]);

  return (
    <Card className="metrics-card">
      <div className="flex justify-content-between align-items-center mb-3">
        <h3 className="text-lg font-medium">{title}</h3>
        <span 
          className="text-xl font-bold" 
          style={{
            color: metricType !== 'pie' && metricType !== 'templateCategory'
              ? {
                  sent: '#6366F1',
                  received: '#10B981',
                  conversations: '#F59E0B',
                  companies: '#8B5CF6',
                  templateCategory: '#EC4899'
                }[metricType]
              : undefined
          }}
        >
          {value}
        </span>
      </div>
      <div className="chart-container">
        <canvas ref={chartRef} height={120} />
      </div>
    </Card>
  );
}