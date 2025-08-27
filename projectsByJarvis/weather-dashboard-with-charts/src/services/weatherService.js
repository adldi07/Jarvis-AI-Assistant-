// src/services/weatherService.js

const API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const WeatherService = {
    // Fetches current weather data for a given location
    async getCurrentWeather(location, units = 'metric') {
        try {
            const url = `${BASE_URL}/weather?q=${location}&appid=${API_KEY}&units=${units}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching current weather:', error);
            throw error; // Re-throw for component-level handling
        }
    },

    // Fetches 5-day weather forecast data for a given location
    async getForecast(location, units = 'metric') {
        try {
            const url = `${BASE_URL}/forecast?q=${location}&appid=${API_KEY}&units=${units}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching forecast:', error);
            throw error; // Re-throw for component-level handling
        }
    },

    // Fetches hourly weather forecast data for a given location
    async getHourlyForecast(location, units = 'metric') {
         try {
            const url = `${BASE_URL}/forecast?q=${location}&appid=${API_KEY}&units=${units}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching forecast:', error);
            throw error; // Re-throw for component-level handling
        }
    },
    // Fetches weather data based on coordinates
    async getWeatherByCoordinates(latitude, longitude, units = 'metric') {
        try {
            const url = `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${units}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching weather by coordinates:', error);
            throw error;
        }
    },
    //Fetches forecast data based on coordinates
    async getForecastByCoordinates(latitude, longitude, units = 'metric') {
        try {
            const url = `${BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${units}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching weather by coordinates:', error);
            throw error;
        }
    },

    // Geocoding API to convert location name to coordinates (using OpenWeatherMap's Geocoding API)
    async geocodeLocation(location) {
        try {
            const url = `http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=5&appid=${API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data; // Returns an array of possible locations
        } catch (error) {
            console.error('Error geocoding location:', error);
            throw error;
        }
    },

    // Reverse Geocoding API to convert coordinates to location name
    async reverseGeocode(latitude, longitude) {
        try {
            const url = `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data[0]; // Returns the first (and usually only) result
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            throw error;
        }
    }
};

export default WeatherService;