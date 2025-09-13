import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PriceChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [timeRange, setTimeRange] = useState('1h');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/analytics/price-history?range=${timeRange}`);
        
        if (response.data.success) {
          const labels = response.data.timestamps.map(ts => 
            new Date(ts).toLocaleTimeString()
          );
          
          setChartData({
            labels,
            datasets: [
              {
                label: 'Energy Token Price (ETH/kWh)',
                data: response.data.prices,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                pointRadius: 3,
                pointHoverRadius: 5
              }
            ]
          });
        }
      } catch (error) {
        console.error('Error fetching price history:', error);
        
        // Fallback to mock data
        const generateMockData = () => {
          const now = new Date();
          const labels = [];
          const prices = [];
          
          const dataPoints = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : 7;
          const interval = timeRange === '1h' ? 5 : timeRange === '24h' ? 60 : 1440;
          
          for (let i = dataPoints - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - i * interval * 60 * 1000);
            labels.push(timeRange === '7d' ? time.toLocaleDateString() : time.toLocaleTimeString());
            
            const basePrice = 0.001;
            const volatility = Math.sin(i * 0.3) * 0.0002 + (Math.random() - 0.5) * 0.0001;
            prices.push(Math.max(0.0005, basePrice + volatility));
          }
          
          setChartData({
            labels,
            datasets: [
              {
                label: 'Energy Token Price (ETH/kWh)',
                data: prices,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
              }
            ]
          });
        };
        
        generateMockData();
      } finally {
        setLoading(false);
      }
    };

    fetchPriceHistory();
    
    // Auto-refresh based on time range
    const refreshInterval = timeRange === '1h' ? 30000 : timeRange === '24h' ? 300000 : 3600000;
    const interval = setInterval(fetchPriceHistory, refreshInterval);
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Energy Token Price History (Live IoT Data)',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Price (ETH)'
        },
        ticks: {
          callback: function(value) {
            return value.toFixed(6);
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    },
    interaction: {
      intersect: false,
    },
  };

  return (
    <div className="price-chart">
      <div className="chart-header">
        <h2>📈 Price Analytics</h2>
        <div className="chart-controls">
          <div className="time-range-selector">
            <button 
              className={timeRange === '1h' ? 'active' : ''}
              onClick={() => setTimeRange('1h')}
            >
              5min
            </button>
            <button 
              className={timeRange === '24h' ? 'active' : ''}
              onClick={() => setTimeRange('24h')}
            >
              24H
            </button>
            <button 
              className={timeRange === '7d' ? 'active' : ''}
              onClick={() => setTimeRange('7d')}
            >
              7D
            </button>
          </div>
          {loading && <span className="loading-indicator">Updating...</span>}
        </div>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PriceChart;