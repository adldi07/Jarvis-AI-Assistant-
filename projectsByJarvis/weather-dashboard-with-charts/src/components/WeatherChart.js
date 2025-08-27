// src/components/WeatherChart.js
import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './WeatherChart.css'; // Import CSS for styling

const WeatherChart = ({ hourlyData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (hourlyData && hourlyData.length > 0) {
      const labels = hourlyData.map(item => new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      const temperatureData = hourlyData.map(item => item.temp);
      const humidityData = hourlyData.map(item => item.humidity);
      const windSpeedData = hourlyData.map(item => item.wind_speed);

      const chartConfig = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Temperature (°C)',
              data: temperatureData,
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.4
            },
            {
              label: 'Humidity (%)',
              data: humidityData,
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              tension: 0.4,
              hidden: true // Initially hide humidity data
            },
            {
              label: 'Wind Speed (m/s)',
              data: windSpeedData,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4,
              hidden: true // Initially hide wind speed data
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Time'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Value'
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
              align: 'center',
              labels: {
                boxWidth: 20,
                usePointStyle: true
              }
            },
            title: {
              display: true,
              text: 'Hourly Weather Data',
              padding: 10,
              font: {
                size: 16
              }
            }
          }
        }
      };

      const ctx = chartRef.current.getContext('2d');

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(ctx, chartConfig);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [hourlyData]);

  return (
    <div className="weather-chart-container">
      <canvas ref={chartRef} id="weatherChart" aria-label="Hourly Weather Data Chart" role="img"></canvas>
    </div>
  );
};

export default WeatherChart;