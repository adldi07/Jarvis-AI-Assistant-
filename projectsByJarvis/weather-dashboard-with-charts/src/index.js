```javascript
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Global styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import WeatherDashboard from './components/WeatherDashboard';
import LocationSearch from './components/LocationSearch';
import Settings from './components/Settings';
import { getWeatherData, getForecastData, getAutocompleteData } from './services/api';
import { useGeolocation } from './hooks/useGeolocation';
import { loadPreferences, savePreferences } from './utils/storage';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';

const defaultLocation = { name: 'London', lat: 51.5074, lon: 0.1278 };

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [location, setLocation] = useState(loadPreferences().location || defaultLocation);
  const [unit, setUnit] = useState(loadPreferences().unit || 'metric'); // metric = Celsius, imperial = Fahrenheit
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  const { geolocation, locationError } = useGeolocation();

  // Load user preferences on initial load
  useEffect(() => {
    const prefs = loadPreferences();
    if (prefs.location) {
      setLocation(prefs.location);
    }
    if (prefs.unit) {
      setUnit(prefs.unit);
    }
  }, []);


  // Update location if geolocation changes and no location is set
  useEffect(() => {
    if (geolocation && !location && !loadPreferences().location) {
      setLocation({ lat: geolocation.latitude, lon: geolocation.longitude });
    }
  }, [geolocation, location]);

  // Fetch weather data whenever location or unit changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const weather = await getWeatherData(location.lat, location.lon, unit);
        const forecast = await getForecastData(location.lat, location.lon, unit);
        setWeatherData(weather);
        setForecastData(forecast);
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError(err.message || 'Failed to fetch weather data.');
      } finally {
        setLoading(false);
      }
    };

    if (location && location.lat && location.lon) {
      fetchData();
    }
  }, [location, unit]);


  const handleLocationChange = useCallback(newLocation => {
    setLocation(newLocation);
    savePreferences({ ...loadPreferences(), location: newLocation });
    setAutocompleteResults([]); // Clear autocomplete after selection
  }, []);


  const handleUnitChange = useCallback(newUnit => {
    setUnit(newUnit);
    savePreferences({ ...loadPreferences(), unit: newUnit });
  }, []);

  const handleSearchChange = async (searchTerm) => {
    if (searchTerm.length > 2) {
      try {
        const results = await getAutocompleteData(searchTerm);
        setAutocompleteResults(results);
      } catch (error) {
        console.error("Error fetching autocomplete data:", error);
        setAutocompleteResults([]); // Clear results on error
      }
    } else {
      setAutocompleteResults([]); // Clear results if search term is too short
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };


  return (
    <div className="app">
      <header className="app-header">
        <h1>Weather Dashboard</h1>
        <button className="settings-button" onClick={toggleSettings} aria-label="Open settings">
          ⚙️
        </button>
      </header>

      {showSettings && (
        <Settings unit={unit} onUnitChange={handleUnitChange} onClose={toggleSettings} />
      )}

      <LocationSearch
        onLocationChange={handleLocationChange}
        onSearchChange={handleSearchChange}
        autocompleteResults={autocompleteResults}
      />

      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}
      {locationError && <ErrorMessage message={`Geolocation error: ${locationError}`} />}

      {weatherData && forecastData && (
        <ErrorBoundary>
          <WeatherDashboard weatherData={weatherData} forecastData={forecastData} unit={unit} />
        </ErrorBoundary>
      )}

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Weather Dashboard</p>
      </footer>
    </div>
  );
}

export default App;


// src/components/WeatherDashboard.js
import React from 'react';
import CurrentWeather from './CurrentWeather';
import Forecast from './Forecast';
import HourlyForecast from './HourlyForecast';
import WeatherCharts from './WeatherCharts';

function WeatherDashboard({ weatherData, forecastData, unit }) {
  return (
    <div className="weather-dashboard">
      <CurrentWeather weatherData={weatherData} unit={unit} />
      <Forecast forecastData={forecastData} unit={unit} />
      <HourlyForecast forecastData={forecastData} unit={unit} />
      <WeatherCharts forecastData={forecastData} unit={unit} />
    </div>
  );
}

export default WeatherDashboard;


// src/components/CurrentWeather.js
import React from 'react';
import { getWeatherIcon } from '../utils/helpers';

function CurrentWeather({ weatherData, unit }) {
  const { name, main, weather, wind, sys } = weatherData;
  const icon = getWeatherIcon(weather[0].icon);
  const temperature = Math.round(main.temp);
  const feelsLike = Math.round(main.feels_like);
  const windSpeed = Math.round(wind.speed);
  const humidity = main.humidity;
  const pressure = main.pressure;
  const description = weather[0].description;

  return (
    <div className="current-weather">
      <h2>{name}, {sys.country}</h2>
      <div className="weather-icon">{icon}</div>
      <div className="temperature">{temperature}°{unit === 'metric' ? 'C' : 'F'}</div>
      <div className="description">{description}</div>
      <div className="feels-like">Feels like: {feelsLike}°{unit === 'metric' ? 'C' : 'F'}</div>
      <div className="details">
        <div>Humidity: {humidity}%</div>
        <div>Wind Speed: {windSpeed} {unit === 'metric' ? 'm/s' : 'mph'}</div>
        <div>Pressure: {pressure} hPa</div>
      </div>
    </div>
  );
}

export default CurrentWeather;


// src/components/Forecast.js
import React from 'react';
import ForecastDay from './ForecastDay';

function Forecast({ forecastData, unit }) {
  // Group forecast data by day
  const dailyForecasts = {};
  forecastData.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0]; // Get date part
    if (!dailyForecasts[date]) {
      dailyForecasts[date] = [];
    }
    dailyForecasts[date].push(item);
  });

  // Get the next 5 days
  const forecastDays = Object.keys(dailyForecasts).slice(1, 6); // Skip today's forecast

  return (
    <div className="forecast">
      <h3>5-Day Forecast</h3>
      <div className="forecast-days">
        {forecastDays.map(day => (
          <ForecastDay key={day} day={day} data={dailyForecasts[day]} unit={unit} />
        ))}
      </div>
    </div>
  );
}

export default Forecast;


// src/components/ForecastDay.js
import React from 'react';
import { getWeatherIcon } from '../utils/helpers';

function ForecastDay({ day, data, unit }) {
  // Calculate max/min temperature and get predominant icon for the day
  let maxTemp = -Infinity;
  let minTemp = Infinity;
  let iconCounts = {};

  data.forEach(item => {
    maxTemp = Math.max(maxTemp, item.main.temp_max);
    minTemp = Math.min(minTemp, item.main.temp_min);
    const icon = item.weather