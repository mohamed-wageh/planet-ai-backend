// src/services/weather.service.js

/**
 * Fetch current weather for a specific governorate in Egypt
 * @param {string} governorate - The governorate name
 * @returns {Promise<object>} Weather data
 */
const getCurrentWeather = async (governorate) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${governorate},EG&appid=${apiKey}&units=metric`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  return response.json();
};

module.exports = {
  getCurrentWeather,
};