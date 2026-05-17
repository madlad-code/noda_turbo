// FILE: apps/web/components/copilot/ChartMessage.tsx
'use client';
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartMessageProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: any;
  title?: string;
}

export const ChartMessage: React.FC<ChartMessageProps> = ({ type, data, title }) => {
  const options: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e5e5',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: !!title,
        text: title,
        color: '#ffffff',
        font: {
          size: 14,
          weight: 'bold',
        },
      },
    },
    scales: type !== 'pie' && type !== 'doughnut' ? {
      y: {
        ticks: { 
          color: '#a3a3a3',
          font: { size: 11 },
        },
        grid: { 
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: { 
          color: '#a3a3a3',
          font: { size: 11 },
        },
        grid: { 
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    } : undefined,
  };

  const ChartComponent = {
    bar: Bar,
    line: Line,
    pie: Pie,
    doughnut: Doughnut,
  }[type];

  return (
    <div className="w-full h-[320px] bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 mt-3">
      <ChartComponent data={data} options={options} />
    </div>
  );
};