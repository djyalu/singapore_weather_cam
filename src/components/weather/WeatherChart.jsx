import { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const WeatherChart = ({ data }) => {
  const chartRef = useRef(null);

  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.time);
      return date.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: data.map(item => item.temperature),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        yAxisID: 'y',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Rainfall (mm)',
        data: data.map(item => item.rainfall),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y1',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1);
              label += context.dataset.label.includes('Temperature') ? '°C' : ' mm';
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Rainfall (mm)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <Line ref={chartRef} options={options} data={chartData} />
    </div>
  );
};

WeatherChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.string.isRequired,
      temperature: PropTypes.number.isRequired,
      rainfall: PropTypes.number.isRequired,
    }),
  ).isRequired,
};

export default WeatherChart;