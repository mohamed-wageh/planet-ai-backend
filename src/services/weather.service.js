// src/services/weather.service.js

// 1. خريطة الترجمة (Mapper): من اسم الداتا بيز لاسم الـ API
const govToApiMapper = {
  'Qalyubia': 'Banha',
  'Dakahlia': 'Mansoura',
  'Sharqia': 'Zagazig',
  'Gharbia': 'Tanta',
  'Monufia': 'Shibin al Kawm',
  'Kafr El Sheikh': 'Kafr ash Shaykh',
  'North Sinai': 'Al Arish',
  'Matrouh': 'Marsa Matruh',
  'New Valley': 'Al Kharijah',
};

/**
 * Fetch current weather for a specific governorate in Egypt
 * @param {string} dbGovernorate - The governorate name directly from User Model
 * @returns {Promise<object>} Weather data
 */
const getCurrentWeather = async (dbGovernorate) => {
  const apiKey = process.env.WEATHER_API_KEY;

  if (!apiKey) {
    console.error("🚨 Missing WEATHER_API_KEY in environment variables!");
    throw new Error('API Key missing');
  }

  const apiCityName = govToApiMapper[dbGovernorate] || dbGovernorate;

  const encodedGov = encodeURIComponent(apiCityName);
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedGov},EG&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error(`🚨 OpenWeatherMap API Error for ${apiCityName}:`, data);
      throw new Error(`Weather API Error: ${data.message}`);
    }

    return data;
  } catch (error) {
    console.error(`🚨 Fetch Error in weather.service:`, error.message);
    throw error;
  }
};

module.exports = {
  getCurrentWeather,
};