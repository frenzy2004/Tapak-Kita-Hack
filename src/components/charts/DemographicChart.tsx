import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DemographicChartProps {
  data: { office: number; residents: number };
}

const DemographicChart: React.FC<DemographicChartProps> = ({ data }) => {
  const chartData = {
    labels: ['Office Workers', 'Residents'],
    datasets: [
      {
        data: [data.office, data.residents],
        backgroundColor: ['#F43F5E', '#FDE68A'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 3,
        hoverBackgroundColor: ['#E11D48', '#FCD34D'],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          color: '#1C1917',
          font: {
            size: 14,
            family: 'Inter',
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.parsed}%`;
          },
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1C1917',
        bodyColor: '#78716C',
        borderColor: '#E7E5E4',
        borderWidth: 1,
        bodyFont: { family: 'Inter', size: 12 },
      },
    },
    cutout: '60%',
  };

  return (
    <div className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Demographic Mix</h3>
        <p className="text-muted-foreground text-sm">Local population breakdown</p>
      </div>
      <div className="h-96">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default DemographicChart;