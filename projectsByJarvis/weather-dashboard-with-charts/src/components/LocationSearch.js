```javascript
// src/components/LocationSearch.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LocationSearch.css'; // Import CSS for styling
import { fetchWeatherData, fetchGeocodingData } from '../utils/api'; // Utility functions for API calls
import {
  getCurrentWeatherIconUrl,
  formatTemperature,
  formatWindSpeed,
  formatPressure,
  formatDate,
  formatTime,
} from '../utils/helpers'; // Utility functions for data formatting
import WeatherChart from './WeatherChart'; // Component for displaying weather charts
import Forecast from './Forecast'; // Component for displaying weather forecast

const LocationSearch = () => {
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [hourlyData, setHourlyData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState('metric'); // 'metric' for Celsius, 'imperial' for Fahrenheit
  const [speedUnit, setSpeedUnit] = useState('kmh'); // 'kmh', 'mph', 'm/s'
  const searchInputRef = useRef(null);

  // Load user preferences from local storage on component mount
  useEffect(() => {
    const storedLocation = localStorage.getItem('location');
    const storedUnit = localStorage.getItem('unit');
    const storedSpeedUnit = localStorage.getItem('speedUnit');

    if (storedLocation) {
      setLocation(storedLocation);
    }
    if (storedUnit) {
      setUnit(storedUnit);
    }
    if (storedSpeedUnit) {
      setSpeedUnit(storedSpeedUnit);
    }
  }, []);

  // Fetch weather data when location or unit changes
  useEffect(() => {
    if (location) {
      fetchWeather();
    }
  }, [location, unit]);

  // Update speed unit when unit changes
  useEffect(() => {
    if (unit === 'metric') {
      setSpeedUnit('kmh');
    } else {
      setSpeedUnit('mph');
    }
  }, [unit]);

  // Save location to local storage when it changes
  useEffect(() => {
    localStorage.setItem('location', location);
  }, [location]);

  // Save unit to local storage when it changes
  useEffect(() => {
    localStorage.setItem('unit', unit);
  }, [unit]);

  // Save speedUnit to local storage when it changes
  useEffect(() => {
    localStorage.setItem('speedUnit', speedUnit);
  }, [speedUnit]);

  // Debounce function to limit API calls during typing
  const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  };

  // Fetch location suggestions from geocoding API
  const fetchSuggestions = useCallback(
    debounce(async (input) => {
      if (!input) {
        setSuggestions([]);
        return;
      }

      try {
        const data = await fetchGeocodingData(input);
        if (data) {
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      }
    }, 300),
    []
  );

  // Handle input change for location search
  const handleInputChange = (e) => {
    const input = e.target.value;
    setLocation(input);
    fetchSuggestions(input);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setLocation(suggestion.name);
    setSuggestions([]);
  };

  // Fetch weather data, forecast data and hourly data from API
  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const [current, forecast, hourly] = await Promise.all([
        fetchWeatherData(location, unit),
        fetchWeatherData(location, unit, 'forecast'),
        fetchWeatherData(location, unit, 'hourly'),
      ]);

      if (current) {
        setWeatherData(current);
      } else {
        setError('Could not retrieve current weather data.');
      }

      if (forecast) {
        setForecastData(forecast);
      } else {
        setError('Could not retrieve forecast data.');
      }

      if (hourly) {
        setHourlyData(hourly);
      } else {
        setError('Could not retrieve hourly data.');
      }

    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data. Please check your location and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (location) {
      fetchWeather();
      setSuggestions([]); // Clear suggestions on submit
    }
  };

  // Handle geolocation success
  const handleGeolocationSuccess = async (position) => {
    const { latitude, longitude } = position.coords;
    try {
      const data = await fetchGeocodingData(`${latitude},${longitude}`, true);
      if (data && data.length > 0) {
        setLocation(data[0].name);
      } else {
        setError('Could not determine location from coordinates.');
      }
    } catch (err) {
      console.error('Error fetching location from coordinates:', err);
      setError('Failed to determine location from coordinates.');
    }
  };

  // Handle geolocation error
  const handleGeolocationError = (error) => {
    console.error('Geolocation error:', error);
    setError('Failed to retrieve location. Please enable location services or enter a location manually.');
  };

  // Get user's location using geolocation API
  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handleGeolocationSuccess,
        handleGeolocationError
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  // Handle unit change
  const handleUnitChange = (e) => {
    setUnit(e.target.value);
  };

  // Data processing for charts
  const hourlyTemperatures = hourlyData
    ? hourlyData.list.slice(0, 24).map((item) => item.main.temp)
    : [];
  const hourlyTimestamps = hourlyData
    ? hourlyData.list.slice(0, 24).map((item) => formatTime(item.dt * 1000))
    : [];
  const hourlyHumidity = hourlyData
    ? hourlyData.list.slice(0, 24).map((item) => item.main.humidity)
    : [];
  const hourlyWindSpeed = hourlyData
    ? hourlyData.list.slice(0, 24).map((item) => item.wind.speed)
    : [];

  return (
    <div className="weather-dashboard">
      <header className="header">
        <h1>Weather Dashboard</h1>
        <div className="unit-selector">
          <label htmlFor="unit">Unit:</label>
          <select id="unit" value={unit} onChange={handleUnitChange}>
            <option value="metric">Celsius (°C)</option>
            <option value="imperial">Fahrenheit (°F)</option>
          </select>
        </div>
      </header>

      <div className="search-container">
        <form onSubmit={handleSubmit} className="search-form">
          <div className="input-wrapper">
            <input
              type="text"
              id="location"
              placeholder="Enter location"
              value={location}
              onChange={handleInputChange}
              ref={searchInputRef}
              aria-label="location"
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="suggestions">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    tabIndex="0" // Make li focusable
                    aria-label={`Suggestion: ${suggestion.name}`} // Add ARIA label
                  >
                    {suggestion.name}, {suggestion.country}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" aria-label="Search">
            Search
          </button>
        </form>
        <button onClick={handleGeolocation} className="geolocation