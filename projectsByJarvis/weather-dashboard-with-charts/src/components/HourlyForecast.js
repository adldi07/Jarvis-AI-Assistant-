// src/components/HourlyForecast.js
import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto'; // Import Chart.js

const HourlyForecast = ({ hourlyData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!hourlyData || hourlyData.length === 0) {
      return; // Don't render the chart if there's no data
    }

    const labels = hourlyData.map(hour => new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const temperatureData = hourlyData.map(hour => hour.temp);
    const humidityData = hourlyData.map(hour => hour.humidity);
    const windSpeedData = hourlyData.map(hour => hour.wind_speed);

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
            tension: 0.4,
          },
          {
            label: 'Humidity (%)',
            data: humidityData,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.4,
            yAxisID: 'y-axis-humidity', // Assign to separate y-axis
          },
          {
            label: 'Wind Speed (m/s)',
            data: windSpeedData,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
            yAxisID: 'y-axis-wind', // Assign to separate y-axis
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time',
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Temperature (°C)',
            },
          },
          'y-axis-humidity': {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Humidity (%)',
            },
            grid: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
          },
          'y-axis-wind': {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Wind Speed (m/s)',
            },
            grid: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: true,
            text: 'Hourly Weather Forecast',
          },
        },
      },
    };

    const ctx = chartRef.current.getContext('2d');

    // Destroy the previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(ctx, chartConfig);

    // Cleanup function to destroy the chart when the component unmounts or data changes
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [hourlyData]);

  return (
    <div className="hourly-forecast">
      <h2>Hourly Forecast</h2>
      {hourlyData && hourlyData.length > 0 ? (
        <div className="chart-container" style={{ position: 'relative', height: '400px', width: '100%' }}>
          <canvas ref={chartRef} aria-label="Hourly weather forecast chart" role="img" />
        </div>
      ) : (
        <p>No hourly data available.</p>
      )}
    </div>
  );
};

export default HourlyForecast;