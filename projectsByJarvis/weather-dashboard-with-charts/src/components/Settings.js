// src/components/Settings.js
import React, { useState, useEffect } from 'react';
import './Settings.css'; // Create this file and add styling

const Settings = ({ onSettingsChange }) => {
  const [units, setUnits] = useState(localStorage.getItem('units') || 'metric'); // 'metric' for Celsius, 'imperial' for Fahrenheit
  const [location, setLocation] = useState(localStorage.getItem('location') || '');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load settings from local storage on component mount
    const storedUnits = localStorage.getItem('units');
    const storedLocation = localStorage.getItem('location');
    if (storedUnits) setUnits(storedUnits);
    if (storedLocation) setLocation(storedLocation);

  }, []);

  useEffect(() => {
    // Save settings to local storage whenever they change
    localStorage.setItem('units', units);
    localStorage.setItem('location', location);
    onSettingsChange({ units, location }); // Notify parent component
  }, [units, location, onSettingsChange]);

  const handleUnitsChange = (event) => {
    setUnits(event.target.value);
  };

  const handleLocationChange = async (event) => {
    const newLocation = event.target.value;
    setLocation(newLocation);

    // Autocomplete using a geocoding service (e.g., OpenStreetMap Nominatim)
    if (newLocation.length > 2) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${newLocation}&format=json&limit=5`
        );
        if (!response.ok) {
          throw new Error(`Autocomplete error: ${response.status}`);
        }
        const data = await response.json();
        setAutocompleteSuggestions(data);
        setError('');
      } catch (err) {
        console.error("Autocomplete error:", err);
        setError("Error fetching location suggestions.");
        setAutocompleteSuggestions([]); // Clear suggestions on error
      }
    } else {
      setAutocompleteSuggestions([]); // Clear suggestions if input is too short
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setLocation(suggestion.display_name);
    setAutocompleteSuggestions([]); // Clear suggestions after selection
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Reverse geocode to get location name using OpenStreetMap Nominatim
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );
            if (!response.ok) {
              throw new Error(`Reverse geocoding error: ${response.status}`);
            }
            const data = await response.json();
            setLocation(data.display_name);
            setError('');
          } catch (err) {
            console.error("Geolocation/Reverse Geocoding error:", err);
            setError("Error getting location from geolocation.");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Error getting geolocation.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      {error && <div className="error-message">{error}</div>}

      <div className="setting-item">
        <label htmlFor="units">Units:</label>
        <select id="units" value={units} onChange={handleUnitsChange}>
          <option value="metric">Celsius (°C)</option>
          <option value="imperial">Fahrenheit (°F)</option>
        </select>
      </div>

      <div className="setting-item">
        <label htmlFor="location">Location:</label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={handleLocationChange}
          placeholder="Enter location"
          aria-label="Location"
          aria-describedby="location-autocomplete"
        />
        <button onClick={handleGeolocation}>Detect Location</button>
      </div>

      {autocompleteSuggestions.length > 0 && (
        <ul id="location-autocomplete" className="autocomplete-list" role="listbox">
          {autocompleteSuggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
              aria-selected={location === suggestion.display_name}
              tabIndex="0" // Make selectable with keyboard navigation
            >
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Settings;