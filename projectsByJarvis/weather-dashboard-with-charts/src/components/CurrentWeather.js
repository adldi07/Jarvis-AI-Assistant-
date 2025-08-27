```javascript
// src/components/CurrentWeather.js
import React, { useState, useEffect, useCallback } from 'react';
import './CurrentWeather.css'; // Ensure this CSS file exists for styling
import { fetchWeatherData, fetchGeocodingData } from '../utils/api'; // Assume this utility file exists
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'; // Install recharts: npm install recharts
import { useDebounce } from '../hooks/useDebounce'; // Custom hook for debouncing input
import { useLocalStorage } from '../hooks/useLocalStorage'; // Custom hook for local storage
import { formatDate, formatTime } from '../utils/formatDate';
import ErrorMessage from './ErrorMessage'; // Component for displaying error messages
import Loader from './Loader'; // Component for displaying loading state

const CurrentWeather = () => {
    const [location, setLocation] = useState('');
    const [weatherData, setWeatherData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [hourlyData, setHourlyData] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unit, setUnit] = useLocalStorage('unit', 'metric'); // 'metric' for Celsius, 'imperial' for Fahrenheit
    const [speedUnit, setSpeedUnit] = useState('m/s');
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [locationCoords, setLocationCoords] = useState(null);
    const debouncedSearchTerm = useDebounce(location, 500);

    // Unit conversion functions
    const toCelsius = (kelvin) => (kelvin - 273.15).toFixed(1);
    const toFahrenheit = (kelvin) => ((kelvin - 273.15) * 9 / 5 + 32).toFixed(1);
    const toMph = (ms) => (ms * 2.237).toFixed(1);
    const toKmh = (ms) => (ms * 3.6).toFixed(1);

    // Update speed unit based on temperature unit
    useEffect(() => {
        if (unit === 'metric') {
            setSpeedUnit('m/s');
        } else {
            setSpeedUnit('mph');
        }
    }, [unit]);

    // Function to convert temperature based on selected unit
    const convertTemperature = (kelvin) => {
        return unit === 'metric' ? toCelsius(kelvin) : toFahrenheit(kelvin);
    };

    const convertWindSpeed = (ms) => {
        return speedUnit === 'm/s' ? ms.toFixed(1) : speedUnit === 'kmh' ? toKmh(ms) : toMph(ms);
    };

    // Function to handle location search
    const handleLocationSearch = useCallback(async (searchTerm) => {
        if (!searchTerm) {
            setSearchSuggestions([]);
            return;
        }

        try {
            const geocodingResults = await fetchGeocodingData(searchTerm);
            setSearchSuggestions(geocodingResults);
        } catch (err) {
            console.error("Error fetching geocoding data:", err);
            setError("Failed to retrieve location suggestions.");
        }
    }, []);

    useEffect(() => {
        if (debouncedSearchTerm) {
            handleLocationSearch(debouncedSearchTerm);
        } else {
            setSearchSuggestions([]);
        }
    }, [debouncedSearchTerm, handleLocationSearch]);

    // Function to fetch weather data
    const getWeatherData = useCallback(async (lat, lon) => {
        setLoading(true);
        setError(null);
        try {
            const weather = await fetchWeatherData(lat, lon, unit);
            setWeatherData(weather.current);
            setForecastData(weather.forecast);
            setHourlyData(weather.hourly);

            // Prepare chart data
            const chartDataPoints = weather.hourly.map(hour => ({
                time: formatTime(hour.dt * 1000),
                temperature: convertTemperature(hour.temp),
                humidity: hour.humidity,
                wind_speed: convertWindSpeed(hour.wind_speed),
            }));
            setChartData(chartDataPoints);
        } catch (err) {
            console.error("Error fetching weather data:", err);
            setError("Failed to retrieve weather data. Please check your location and try again.");
        } finally {
            setLoading(false);
        }
    }, [unit, convertTemperature, convertWindSpeed]);

    // Function to handle location selection from suggestions
    const handleSuggestionClick = (suggestion) => {
        setLocation(suggestion.name);
        setLocationCoords({ lat: suggestion.lat, lon: suggestion.lon });
        setSearchSuggestions([]); // Clear suggestions after selection
    };

    // Geolocation
    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    setLocationCoords({ lat: latitude, lon: longitude });
                },
                error => {
                    console.error("Error getting location:", error);
                    setError("Failed to retrieve your location. Please allow location access or enter a location manually.");
                }
            );
        } else {
            setError("Geolocation is not supported by your browser.");
        }
    };

    useEffect(() => {
        if (locationCoords) {
            getWeatherData(locationCoords.lat, locationCoords.lon);
        }
    }, [locationCoords, getWeatherData]);

    // Initial load: Try to get user's location
    useEffect(() => {
        handleGetLocation();
    }, []);

    // Handle unit change
    const handleUnitChange = (newUnit) => {
        setUnit(newUnit);
        if (locationCoords) {
            getWeatherData(locationCoords.lat, locationCoords.lon); // Refresh data with the new unit
        }
    };

    return (
        <div className="weather-dashboard">
            <div className="header">
                <h1>Weather Dashboard</h1>
                <div className="location-search">
                    <input
                        type="text"
                        placeholder="Enter location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        aria-label="Location Search"
                    />
                    <button onClick={handleGetLocation}>
                        <span role="img" aria-label="Get Location">📍</span>
                    </button>
                    {searchSuggestions.length > 0 && (
                        <ul className="suggestions">
                            {searchSuggestions.map(suggestion => (
                                <li key={suggestion.name} onClick={() => handleSuggestionClick(suggestion)}>
                                    {suggestion.name}, {suggestion.country}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="unit-controls">
                    <button
                        className={unit === 'metric' ? 'active' : ''}
                        onClick={() => handleUnitChange('metric')}
                        aria-label="Convert to Celsius"
                    >
                        °C
                    </button>
                    <button
                        className={unit === 'imperial' ? 'active' : ''}
                        onClick={() => handleUnitChange('imperial')}
                        aria-label="Convert to Fahrenheit"
                    >
                        °F
                    </button>
                </div>
            </div>

            {loading && <Loader />}
            {error && <ErrorMessage message={error} />}

            {weatherData && (
                <div className="current-weather">
                    <h2>Current Weather</h2>
                    <div className="weather-icon">
                        <img
                            src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                            alt={weatherData.weather[0].description}
                        />
                    </div>
                    <div className="weather-details">
                        <p>Temperature: {convertTemperature(weatherData.temp)}°{unit === 'metric' ? 'C' : 'F'}</p>
                        <p>Description: {weatherData.weather[0].description}</p>
                        <p>Humidity: {weatherData.humidity}%</p>
                        <p>Wind Speed: {convertWindSpeed(weatherData.wind_speed)} {speedUnit}</p>
                        <p>Pressure: {weatherData.pressure} hPa</p>
                    </div>
                </div>
            )}

            {forecastData && (
                <div className="forecast">
                    <h2>5-Day Forecast</h2>
                    <div className="forecast-list">
                        {forecastData.map((day, index) => (
                            <div className="forecast-item" key={index}>