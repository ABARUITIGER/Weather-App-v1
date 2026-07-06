import { Hono } from 'hono'
import { GoogleGenAI, Type } from '@google/genai'
import { fallbackCities, getDeterministicCity, generateDeterministicWeather, generateDeterministicTrends } from './src/utils/simulations.js'

type Bindings = {
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

async function fetchWithTimeout(url: string, options: any = {}, timeout: number = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

app.get('/geocode', async (c) => {
  const query = c.req.query('q');
  if (!query) {
    return c.json({ error: "Query parameter 'q' is required" }, 400);
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo geocoding service returned status: ${response.status}`);
    }
    const data = (await response.json()) as any;
    const results = data.results || [];
    
    // Sort logic
    results.sort((a: any, b: any) => {
      const aIsUS = a.country_code === "US";
      const bIsUS = b.country_code === "US";
      if (aIsUS && !bIsUS) return -1;
      if (!aIsUS && bIsUS) return 1;
      return (b.population || 0) - (a.population || 0);
    });

    return c.json(results);
  } catch (error: any) {
    console.warn("Geocoding proxy fetch failed or timed out. Initiating simulated fallback.", error);
    const lowerQuery = query.toLowerCase().trim();
    const matches = fallbackCities.filter(city => 
      city.name.toLowerCase().includes(lowerQuery) || 
      city.country.toLowerCase().includes(lowerQuery)
    );
    
    if (matches.length > 0) {
      return c.json(matches);
    } else {
      return c.json([getDeterministicCity(query)]);
    }
  }
});

app.get('/weather', async (c) => {
  const lat = c.req.query('lat');
  const lon = c.req.query('lon');
  const name = c.req.query('name');
  const country = c.req.query('country');

  if (!lat || !lon) {
    return c.json({ error: "Latitude (lat) and Longitude (lon) are required" }, 400);
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  const cityName = name || "Unknown Location";
  const countryName = country || "";

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,wind_speed_10m,wind_direction_10m,weather_code,cloud_cover,pressure_msl&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo weather service returned status: ${response.status}`);
    }

    const data = (await response.json()) as any;

    const payload = {
      city: {
        name: cityName,
        latitude,
        longitude,
        country: countryName,
      },
      current: {
        time: data.current.time,
        temperature: data.current.temperature_2m,
        relativeHumidity: data.current.relative_humidity_2m,
        apparentTemperature: data.current.apparent_temperature,
        isDay: data.current.is_day === 1,
        precipitation: data.current.precipitation,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m,
        weatherCode: data.current.weather_code,
        cloudCover: data.current.cloud_cover,
        pressure: data.current.pressure_msl,
      },
      hourly: data.hourly.time.map((timeStr: string, index: number) => ({
        time: timeStr,
        temperature: data.hourly.temperature_2m[index],
        humidity: data.hourly.relative_humidity_2m[index],
        precipitationProbability: data.hourly.precipitation_probability[index],
        weatherCode: data.hourly.weather_code[index],
        windSpeed: data.hourly.wind_speed_10m[index],
      })).slice(0, 24),
      daily: data.daily.time.map((timeStr: string, index: number) => ({
        date: timeStr,
        weatherCode: data.daily.weather_code[index],
        tempMax: data.daily.temperature_2m_max[index],
        tempMin: data.daily.temperature_2m_min[index],
        apparentMax: data.daily.apparent_temperature_max[index],
        apparentMin: data.daily.apparent_temperature_min[index],
        uvIndexMax: data.daily.uv_index_max[index],
        precipitationSum: data.daily.precipitation_sum[index],
        precipitationProbability: data.daily.precipitation_probability_max[index],
        windSpeedMax: data.daily.wind_speed_10m_max[index],
      })),
    };

    return c.json(payload);
  } catch (error: any) {
    console.warn("Weather forecast fetch failed or timed out. Initiating simulated fallback.", error);
    const fallbackPayload = generateDeterministicWeather(latitude, longitude, cityName, countryName);
    return c.json(fallbackPayload);
  }
});

function getPreviousMonthDates(anchorDate: Date, subtractYears: number) {
  const d = new Date(anchorDate);
  d.setFullYear(d.getFullYear() - subtractYears);
  d.setMonth(d.getMonth() - 1); // Previous month
  
  const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
  const end = new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0)); // Last day of that month

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    monthName: start.toLocaleString("default", { month: "long" }),
    year: start.getFullYear(),
  };
}

app.get('/trends', async (c) => {
  const lat = c.req.query('lat');
  const lon = c.req.query('lon');
  const name = c.req.query('name');

  if (!lat || !lon) {
    return c.json({ error: "Latitude (lat) and Longitude (lon) are required" }, 400);
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  const cityName = name || "This Location";

  const anchorDate = new Date("2026-07-02");
  const thisYearDates = getPreviousMonthDates(anchorDate, 0);       // June 2026
  const historicalDates = getPreviousMonthDates(anchorDate, 10);    // June 2016

  try {
    const thisYearUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${thisYearDates.start}&end_date=${thisYearDates.end}&daily=temperature_2m_max,precipitation_sum&timezone=auto`;
    const historicalUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${historicalDates.start}&end_date=${historicalDates.end}&daily=temperature_2m_max,precipitation_sum&timezone=auto`;

    const [thisYearRes, historicalRes] = await Promise.all([
      fetchWithTimeout(thisYearUrl, {}, 15000),
      fetchWithTimeout(historicalUrl, {}, 15000),
    ]);

    if (!thisYearRes.ok || !historicalRes.ok) {
      throw new Error(`Archive API returned error statuses: ${thisYearRes.status}, ${historicalRes.status}`);
    }

    const thisYearData = (await thisYearRes.json()) as any;
    const historicalData = (await historicalRes.json()) as any;

    const thisYearDaily = thisYearData.daily || { time: [], temperature_2m_max: [], precipitation_sum: [] };
    const historicalDaily = historicalData.daily || { time: [], temperature_2m_max: [], precipitation_sum: [] };

    const totalDays = Math.min(thisYearDaily.time.length, historicalDaily.time.length);
    const trends = [];

    let sumTempThisYear = 0;
    let sumTempHist = 0;
    let validTempDaysThisYear = 0;
    let validTempDaysHist = 0;

    let totalPrecipThisYear = 0;
    let totalPrecipHist = 0;

    for (let i = 0; i < totalDays; i++) {
      const tTY = thisYearDaily.temperature_2m_max[i];
      const tH = historicalDaily.temperature_2m_max[i];
      const pTY = thisYearDaily.precipitation_sum[i] || 0;
      const pH = historicalDaily.precipitation_sum[i] || 0;

      if (tTY !== null && tH !== null) {
        sumTempThisYear += tTY;
        sumTempHist += tH;
        validTempDaysThisYear++;
        validTempDaysHist++;
      }
      
      totalPrecipThisYear += pTY;
      totalPrecipHist += pH;

      trends.push({
        day: i + 1,
        dateThisYear: thisYearDaily.time[i],
        dateHistorical: historicalDaily.time[i],
        tempMaxThisYear: tTY,
        tempMaxHistorical: tH,
        precipThisYear: pTY,
        precipHistorical: pH,
      });
    }

    const avgTempThisYear = validTempDaysThisYear > 0 ? sumTempThisYear / validTempDaysThisYear : 0;
    const avgTempHistorical = validTempDaysHist > 0 ? sumTempHist / validTempDaysHist : 0;

    const payload = {
      city: cityName,
      periodThisYear: `${thisYearDates.monthName} ${thisYearDates.year}`,
      periodHistorical: `${historicalDates.monthName} ${historicalDates.year}`,
      trends,
      summary: {
        avgTempThisYear: parseFloat(avgTempThisYear.toFixed(1)),
        avgTempHistorical: parseFloat(avgTempHistorical.toFixed(1)),
        totalPrecipThisYear: parseFloat(totalPrecipThisYear.toFixed(1)),
        totalPrecipHistorical: parseFloat(totalPrecipHist.toFixed(1)),
        tempAnomaly: parseFloat((avgTempThisYear - avgTempHistorical).toFixed(1)),
        precipAnomaly: parseFloat((totalPrecipThisYear - totalPrecipHist).toFixed(1)),
      },
    };

    return c.json(payload);
  } catch (error: any) {
    console.warn("Historical trends fetch failed or timed out. Initiating simulated fallback.", error);
    const fallbackTrends = generateDeterministicTrends(latitude, longitude, cityName);
    return c.json(fallbackTrends);
  }
});

app.post('/recommendations', async (c) => {
  try {
    const { weatherData } = await c.req.json();

    if (!weatherData || !weatherData.city || !weatherData.current || !weatherData.daily) {
      return c.json({ error: "Invalid weather data payload in request body" }, 400);
    }

    const { city, current, daily } = weatherData;

    if (!c.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is missing. Using pre-compiled weather recommendations fallback.");
      return c.json({
        activities: [
          { name: "Running", rating: "Good", reason: "Standard conditions are stable for outdoor cardio." },
          { name: "Cycling", rating: "Good", reason: "Wind and temperature profiles allow for safe route planning." },
          { name: "Hiking", rating: "Caution", reason: "Check regional forecast before heading onto unpaved trails." },
          { name: "Gardening", rating: "Good", reason: "Soil and humidity ranges are favorable for watering or planting." },
          { name: "Patio Dining", rating: "Excellent", reason: "Clear thermal envelope provides a beautiful dining environment." },
          { name: "Landscape Photography", rating: "Caution", reason: "Variable cloud layers might restrict golden hour contrast." }
        ],
        generalAdvice: "Atmospheric indicators point to standard planning conditions. Review daily UV forecasts for prolonged exposure.",
        clothingSuggestion: "Lightweight, breathable materials are recommended. Carry a light water-resistant layer if localized showers develop.",
        safetyChecklist: [
          "Monitor local temperature index during peak daylight hours.",
          "Ensure proper hydration schedules during outdoor tasks.",
          "Apply standard broad-spectrum sunscreen as uv index increases."
        ]
      });
    }

    const prompt = `
      Analyze the following weather data for ${city.name}, ${city.country}:
      
      Current Weather:
      - Temperature: ${current.temperature}°C (Apparent/Feels-like: ${current.apparentTemperature}°C)
      - Humidity: ${current.relativeHumidity}%
      - Precipitation: ${current.precipitation} mm
      - Wind Speed: ${current.windSpeed} km/h
      - Weather Code: ${current.weatherCode}
      - Cloud Cover: ${current.cloudCover}%

      7-Day Forecast Summary:
      ${daily.map((d: any) => `- ${d.date}: Max Temp ${d.tempMax}°C, Min Temp ${d.tempMin}°C, UV Index Max ${d.uvIndexMax}, Precipitation Prob ${d.precipitationProbability}%, Total Precipitation ${d.precipitationSum}mm, Max Wind ${d.windSpeedMax}km/h`).join("\n")}

      Generate planning recommendations for outdoor activities in the exact JSON format specified in the response schema.
    `;

    const ai = new GoogleGenAI({
      apiKey: c.env.GEMINI_API_KEY as string,
      httpOptions: {
        headers: {
          "User-Agent": "cloudflare-pages",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are an advanced weather intelligence assistant. Your goal is to analyze current weather conditions and a 7-day forecast to generate highly practical, structured outdoor planning recommendations for a set of activities: Running, Cycling, Hiking, Gardening, Patio Dining, and Landscape Photography. Provide positive suggestions and cautionary advice where appropriate based on factors such as UV levels, wind gusts, cold/heat exposure, and rain probability.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            activities: {
              type: Type.ARRAY,
              description: "Planning suitability for outdoor activities (Running, Cycling, Hiking, Gardening, Patio Dining, and Landscape Photography).",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  rating: { type: Type.STRING, description: "One of: Excellent, Good, Caution, Avoid" },
                  reason: { type: Type.STRING, description: "Concise activity-specific reason referring directly to forecast constraints (e.g., strong wind, precipitation risk, high UV, moderate temperature)." },
                },
                required: ["name", "rating", "reason"],
              },
            },
            generalAdvice: { type: Type.STRING, description: "Overall climate advice summarizing prime times of the week and risk periods." },
            clothingSuggestion: { type: Type.STRING, description: "Highly specific layering or gear recommendations based on atmospheric conditions." },
            safetyChecklist: {
              type: Type.ARRAY,
              description: "A short checklist of 3-5 quick actionable steps.",
              items: { type: Type.STRING },
            },
          },
          required: ["activities", "generalAdvice", "clothingSuggestion", "safetyChecklist"],
        },
      },
    });

    const resultText = response.text?.trim() || "{}";
    const resultObj = JSON.parse(resultText);

    return c.json(resultObj);
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return c.json({
      activities: [
        { name: "Running", rating: "Good", reason: "Standard conditions are stable for outdoor cardio." },
        { name: "Cycling", rating: "Good", reason: "Wind and temperature profiles allow for safe route planning." },
        { name: "Hiking", rating: "Caution", reason: "Check regional forecast before heading onto unpaved trails." },
        { name: "Gardening", rating: "Good", reason: "Soil and humidity ranges are favorable for watering or planting." },
        { name: "Patio Dining", rating: "Excellent", reason: "Clear thermal envelope provides a beautiful dining environment." },
        { name: "Landscape Photography", rating: "Caution", reason: "Variable cloud layers might restrict golden hour contrast." }
      ],
      generalAdvice: "Atmospheric indicators point to standard planning conditions. Review daily UV forecasts for prolonged exposure.",
      clothingSuggestion: "Lightweight, breathable materials are recommended. Carry a light water-resistant layer if localized showers develop.",
      safetyChecklist: [
        "Monitor local temperature index during peak daylight hours.",
        "Ensure proper hydration schedules during outdoor tasks.",
        "Apply standard broad-spectrum sunscreen as uv index increases."
      ]
    });
  }
});

export default app;
