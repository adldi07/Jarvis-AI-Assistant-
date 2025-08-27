```javascript
// src/components/Forecast.js

import React, { useState, useEffect, useRef } from 'react';
import './Forecast.css'; // Import CSS file for styling
import Chart from 'chart.js/auto';

const API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key
const DEFAULT_LOCATION = 'New York';

const Forecast = () => {
    const [location, setLocation] = useState(localStorage.getItem('location') || DEFAULT_LOCATION);
    const [currentWeather, setCurrentWeather] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [hourlyForecast, setHourlyForecast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unit, setUnit] = useState(localStorage.getItem('unit') || 'metric'); // metric or imperial
    const [speedUnit, setSpeedUnit] = useState(localStorage.getItem('speedUnit') || 'm/s'); // m/s, kmh, mph
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
    const [chartData, setChartData] = useState(null);
    const chartRef = useRef(null);

    useEffect(() => {
        fetchWeatherData(location);
    }, [location, unit]);

    useEffect(() => {
        localStorage.setItem('location', location);
        localStorage.setItem('unit', unit);
        localStorage.setItem('speedUnit', speedUnit);
    }, [location, unit, speedUnit]);


    const fetchWeatherData = async (location) => {
        setLoading(true);
        setError(null);
        try {
            const currentWeatherResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=${unit}`
            );
            if (!currentWeatherResponse.ok) {
                throw new Error('Could not fetch current weather data.');
            }
            const currentWeatherData = await currentWeatherResponse.json();
            setCurrentWeather(currentWeatherData);

            const forecastResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${API_KEY}&units=${unit}`
            );
            if (!forecastResponse.ok) {
                throw new Error('Could not fetch forecast data.');
            }
            const forecastData = await forecastResponse.json();
            setForecast(processForecastData(forecastData));
            setHourlyForecast(processHourlyForecastData(forecastData));

            // Prepare chart data
            const temperatureData = forecastData.list.map(item => ({
                time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                temperature: item.main.temp
            }));

            const humidityData = forecastData.list.map(item => ({
                time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                humidity: item.main.humidity
            }));

            const windSpeedData = forecastData.list.map(item => {
                let windSpeed = item.wind.speed;
                if (speedUnit === 'kmh' && unit === 'metric') {
                    windSpeed = windSpeed * 3.6;
                } else if (speedUnit === 'mph' && unit === 'metric') {
                    windSpeed = windSpeed * 2.237;
                } else if (speedUnit === 'kmh' && unit === 'imperial') {
                    windSpeed = windSpeed * 1.609;
                } else if (speedUnit === 'mph' && unit === 'imperial') {
                    //Already in mph
                }
                return {
                    time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    windSpeed: windSpeed
                };
            });

            setChartData({ temperatureData, humidityData, windSpeedData });

        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (chartData) {
            createChart();
        }
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [chartData, unit, speedUnit]);

    const createChart = () => {
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = document.getElementById('weatherChart');
        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.temperatureData.map(item => item.time),
                datasets: [
                    {
                        label: 'Temperature',
                        data: chartData.temperatureData.map(item => item.temperature),
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        yAxisID: 'y-temperature',
                    },
                    {
                        label: 'Humidity',
                        data: chartData.humidityData.map(item => item.humidity),
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        yAxisID: 'y-humidity',
                    },
                    {
                        label: 'Wind Speed',
                        data: chartData.windSpeedData.map(item => item.windSpeed),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        yAxisID: 'y-wind',
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    'y-temperature': {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: `Temperature (${unit === 'metric' ? '°C' : '°F'})`
                        }
                    },
                    'y-humidity': {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Humidity (%)'
                        },
                        grid: {
                            drawOnChartArea: false, // only want the grid lines for one axis to show up
                        },
                    },
                    'y-wind': {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: `Wind Speed (${speedUnit})`
                        },
                        grid: {
                            drawOnChartArea: false, // only want the grid lines for one axis to show up
                        },
                    },
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Weather Conditions Over Time'
                    }
                }
            }
        });
    };

    const processForecastData = (data) => {
        if (!data || !data.list) return null;

        const dailyData = {};
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            if (!dailyData[date]) {
                dailyData[date] = {
                    date: date,
                    minTemp: item.main.temp,
                    maxTemp: item.main.temp,
                    weather: item.weather[0].description,
                    icon: item.weather[0].icon,
                };
            } else {
                dailyData[date].minTemp = Math.min(dailyData[date].minTemp, item.main.temp);
                dailyData[date].maxTemp = Math.max(dailyData[date].maxTemp, item.main.temp);
            }
        });

        return Object.values(dailyData);
    };

    const processHourlyForecastData = (data) => {
        if (!data || !data.list) return null;

        return data.list.slice(0, 24).map(item => ({
            time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            temperature: item.main.temp,
            icon: item.weather[0