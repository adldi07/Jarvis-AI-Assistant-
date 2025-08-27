import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import WeatherCard from './components/WeatherCard';
import Forecast from './components/Forecast';
import HourlyForecast from './components/HourlyForecast';
import WeatherChart from './components/WeatherChart';
import LocationSearch from './components/LocationSearch';
import UnitToggle from './components/UnitToggle';
import ErrorMessage from './components/ErrorMessage';
import Loader from './components/Loader';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
const DEFAULT_LOCATION = { lat: 40.7128, lon: -74.0060, name: 'New York' }; // Default: New York

function App() {
    const [location, setLocation] = useState(() => {
        const storedLocation = localStorage.getItem('location');
        return storedLocation ? JSON.parse(storedLocation) : DEFAULT_LOCATION;
    });
    const [weatherData, setWeatherData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [hourlyData, setHourlyData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [units, setUnits] = useState(() => localStorage.getItem('units') || 'metric'); // metric = Celsius, imperial = Fahrenheit
    const [chartData, setChartData] = useState(null);

    // Save location and units to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('location', JSON.stringify(location));
    }, [location]);

    useEffect(() => {
        localStorage.setItem('units', units);
    }, [units]);

    const handleLocationChange = (newLocation) => {
        setLocation(newLocation);
    };

    const handleUnitsChange = (newUnits) => {
        setUnits(newUnits);
    };

    // Fetch weather data based on location
    const fetchWeatherData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=${units}`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=${units}`;

            const [currentWeatherResponse, forecastResponse] = await Promise.all([
                fetch(currentWeatherUrl),
                fetch(forecastUrl)
            ]);

            if (!currentWeatherResponse.ok) {
                throw new Error(`Weather data fetch failed: ${currentWeatherResponse.status}`);
            }
            if (!forecastResponse.ok) {
                throw new Error(`Forecast data fetch failed: ${forecastResponse.status}`);
            }

            const currentWeatherData = await currentWeatherResponse.json();
            const forecastWeatherData = await forecastResponse.json();

            setWeatherData(currentWeatherData);
            setForecastData(forecastWeatherData);

            // Extract hourly data (next 24 hours)
            const now = new Date();
            const hourlyForecast = forecastWeatherData.list.filter(item => {
                const itemTime = new Date(item.dt * 1000);
                return itemTime > now && itemTime <= new Date(now.getTime() + 24 * 60 * 60 * 1000);
            });
            setHourlyData(hourlyForecast);

            // Prepare chart data
            const chartDataPoints = forecastWeatherData.list.slice(0, 8).map(item => ({
                time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                temperature: item.main.temp,
                humidity: item.main.humidity,
                windSpeed: item.wind.speed
            }));
            setChartData({
                labels: chartDataPoints.map(item => item.time),
                temperature: chartDataPoints.map(item => item.temperature),
                humidity: chartDataPoints.map(item => item.humidity),
                windSpeed: chartDataPoints.map(item => item.windSpeed)
            });


        } catch (err) {
            console.error("Error fetching weather data:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [location, units]);


    // Fetch weather data on initial load and when location/units change
    useEffect(() => {
        fetchWeatherData();
    }, [fetchWeatherData]);


    // Geolocation
    const handleGeolocation = () => {
        if (navigator.geolocation) {
            setIsLoading(true);
            setError(null);
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    // Reverse geocode to get location name
                    fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Reverse geocoding failed: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            if (data && data.length > 0) {
                                setLocation({ lat: latitude, lon: longitude, name: data[0].name });
                            } else {
                                setLocation({ lat: latitude, lon: longitude, name: 'Unknown Location' });
                            }
                        })
                        .catch(err => {
                            console.error("Error reverse geocoding:", err);
                            setError("Error getting location name.");
                            setLocation({ lat: latitude, lon: longitude, name: 'Unknown Location' }); // Set lat/lon even if reverse geocoding fails
                        })
                        .finally(() => setIsLoading(false));

                },
                error => {
                    setIsLoading(false);
                    setError("Geolocation is not enabled or permission denied.");
                    console.error("Geolocation error:", error);
                }
            );
        } else {
            setError("Geolocation is not supported by your browser.");
        }
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Weather Dashboard</h1>
                <div className="header-controls">
                    <LocationSearch onLocationChange={handleLocationChange} />
                    <button onClick={handleGeolocation} className="geolocation-button" aria-label="Use my current location">
                        <span role="img" aria-label="Location icon">📍</span>
                    </button>
                    <UnitToggle units={units} onUnitsChange={handleUnitsChange} />
                </div>
            </header>

            <main className="app-main">
                {isLoading && <Loader />}
                {error && <ErrorMessage message={error} />}

                {weatherData && (
                    <WeatherCard
                        weather={weatherData}
                        locationName={location.name}
                        units={units}
                    />
                )}

                {hourlyData && hourlyData.length > 0 && (
                    <HourlyForecast hourlyData={hourlyData} units={units} />
                )}

                {forecastData && (
                    <Forecast forecast={forecastData} units={units} />
                )}

                {chartData && (
                    <WeatherChart chartData={chartData} units={units} />
                )}
            </main>

            <footer className="app-footer">
                <p>&copy; {new Date().getFullYear()} Weather Dashboard. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default App;