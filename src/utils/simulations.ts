export function getSeed(lat: number, lon: number): number {
  return Math.abs(Math.sin(lat) * Math.cos(lon) * 10000) % 1;
}

export function createRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const fallbackCities = [
  { name: "New York", latitude: 40.7128, longitude: -74.0060, country: "United States", admin1: "New York", country_code: "US" },
  { name: "London", latitude: 51.5074, longitude: -0.1278, country: "United Kingdom", admin1: "England", country_code: "GB" },
  { name: "Tokyo", latitude: 35.6762, longitude: 139.6503, country: "Japan", admin1: "Tokyo", country_code: "JP" },
  { name: "Paris", latitude: 48.8566, longitude: 2.3522, country: "France", admin1: "Île-de-France", country_code: "FR" },
  { name: "Sydney", latitude: -33.8688, longitude: 151.2093, country: "Australia", admin1: "New South Wales", country_code: "AU" },
  { name: "Mumbai", latitude: 19.0760, longitude: 72.8777, country: "India", admin1: "Maharashtra", country_code: "IN" },
  { name: "Cairo", latitude: 30.0444, longitude: 31.2357, country: "Egypt", admin1: "Cairo", country_code: "EG" },
  { name: "Rio de Janeiro", latitude: -22.9068, longitude: -43.1729, country: "Brazil", admin1: "Rio de Janeiro", country_code: "BR" },
  { name: "Cape Town", latitude: -33.9249, longitude: 18.4241, country: "South Africa", admin1: "Western Cape", country_code: "ZA" },
  { name: "Reykjavik", latitude: 64.1466, longitude: -21.9426, country: "Iceland", admin1: "Capital Region", country_code: "IS" },
  { name: "Berlin", latitude: 52.5200, longitude: 13.4050, country: "Germany", admin1: "Berlin", country_code: "DE" },
  { name: "Singapore", latitude: 1.3521, longitude: 103.8198, country: "Singapore", admin1: "Singapore", country_code: "SG" },
  { name: "Dubai", latitude: 25.2048, longitude: 55.2708, country: "United Arab Emirates", admin1: "Dubai", country_code: "AE" },
  { name: "San Francisco", latitude: 37.7749, longitude: -122.4194, country: "United States", admin1: "California", country_code: "US" },
  { name: "Los Angeles", latitude: 34.0522, longitude: -118.2437, country: "United States", admin1: "California", country_code: "US" },
  { name: "Chicago", latitude: 41.8781, longitude: -87.6298, country: "United States", admin1: "Illinois", country_code: "US" },
  { name: "Toronto", latitude: 43.6532, longitude: -79.3832, country: "Canada", admin1: "Ontario", country_code: "CA" },
  { name: "Vancouver", latitude: 49.2827, longitude: -123.1207, country: "Canada", admin1: "British Columbia", country_code: "CA" },
  { name: "Rome", latitude: 41.9028, longitude: 12.4964, country: "Italy", admin1: "Lazio", country_code: "IT" },
  { name: "Madrid", latitude: 40.4168, longitude: -3.7038, country: "Spain", admin1: "Madrid", country_code: "ES" },
  { name: "Munich", latitude: 48.1351, longitude: 11.5820, country: "Germany", admin1: "Bavaria", country_code: "DE" },
  { name: "Amsterdam", latitude: 52.3676, longitude: 4.9041, country: "Netherlands", admin1: "North Holland", country_code: "NL" },
  { name: "Buenos Aires", latitude: -34.6037, longitude: -58.3816, country: "Argentina", admin1: "Buenos Aires", country_code: "AR" },
  { name: "Beijing", latitude: 39.9042, longitude: 116.4074, country: "China", admin1: "Beijing", country_code: "CN" },
  { name: "Seoul", latitude: 37.5665, longitude: 126.9780, country: "South Korea", admin1: "Seoul", country_code: "KR" },
  { name: "Bangkok", latitude: 13.7563, longitude: 100.5018, country: "Thailand", admin1: "Bangkok", country_code: "TH" },
  { name: "Melbourne", latitude: -37.8136, longitude: 144.9631, country: "Australia", admin1: "Victoria", country_code: "AU" },
  { name: "Stockholm", latitude: 59.3293, longitude: 18.0686, country: "Sweden", admin1: "Stockholm", country_code: "SE" },
];

export function getDeterministicCity(query: string) {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = query.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = parseFloat((((Math.abs(hash) % 13000) / 100) - 60).toFixed(4));
  const lon = parseFloat((((Math.abs(hash * 31) % 36000) / 100) - 180).toFixed(4));
  const formattedName = query.charAt(0).toUpperCase() + query.slice(1);
  return {
    name: formattedName,
    latitude: lat,
    longitude: lon,
    country: "Atmospheric Simulation Hub",
    admin1: "Atmospheric Grid " + (Math.abs(hash) % 100),
    country_code: "SD",
  };
}

export function generateDeterministicWeather(latitude: number, longitude: number, name: string, country: string) {
  const seed = getSeed(latitude, longitude);
  const rnd = createRandom(seed);
  
  let tempBase = 25;
  if (latitude >= 0) {
    tempBase = 32 - (Math.abs(latitude - 25) * 0.35);
  } else {
    tempBase = 16 - (Math.abs(latitude + 30) * 0.45);
  }
  tempBase = Math.max(-10, Math.min(42, tempBase)) + (rnd() * 6 - 3);

  const isRainy = (Math.abs(latitude) < 10) || (Math.abs(latitude) > 45 && rnd() > 0.4) || (rnd() > 0.75);

  const daily = [];
  const baseDate = new Date("2026-07-02");
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(baseDate);
    currentDate.setUTCDate(baseDate.getUTCDate() + i);
    const dateStr = currentDate.toISOString().split("T")[0];
    
    const dayRnd = createRandom(seed + i * 0.23)();
    const dayRnd2 = createRandom(seed + i * 0.47)();
    
    const tempMax = parseFloat((tempBase + (dayRnd * 6) - 3).toFixed(1));
    const tempMin = parseFloat((tempMax - 7 - (dayRnd2 * 5)).toFixed(1));
    
    const apparentMax = parseFloat((tempMax + (isRainy ? 1.0 : -0.8)).toFixed(1));
    const apparentMin = parseFloat((tempMin + (isRainy ? 0.3 : -1.2)).toFixed(1));
    
    let precipProb = 0;
    let precipSum = 0;
    let weatherCode = 0;
    
    if (isRainy) {
      precipProb = Math.round(40 + (dayRnd * 50));
      if (precipProb > 50) {
        precipSum = parseFloat((dayRnd2 * 18).toFixed(1));
        weatherCode = precipSum > 10 ? 63 : 61;
      } else {
        weatherCode = 3;
      }
    } else {
      precipProb = Math.round(dayRnd * 25);
      if (precipProb > 15 && dayRnd2 > 0.75) {
        precipSum = parseFloat((dayRnd2 * 1.5).toFixed(1));
        weatherCode = 51;
      } else if (dayRnd2 > 0.45) {
        weatherCode = 2;
      } else {
        weatherCode = 1;
      }
    }
    
    const windSpeedMax = parseFloat((8 + (dayRnd * 28)).toFixed(1));
    
    let uvIndexMax = parseFloat((Math.max(0, 11.5 - (Math.abs(latitude) * 0.16) - (weatherCode > 3 ? 3.5 : 0)) + (dayRnd * 2) - 1).toFixed(1));
    if (uvIndexMax < 0) uvIndexMax = 0;

    daily.push({
      date: dateStr,
      weatherCode,
      tempMax,
      tempMin,
      apparentMax,
      apparentMin,
      uvIndexMax,
      precipitationSum: precipSum,
      precipitationProbability: precipProb,
      windSpeedMax,
    });
  }

  const hourly = [];
  const todayMax = daily[0].tempMax;
  const todayMin = daily[0].tempMin;
  const todayCode = daily[0].weatherCode;
  const todayPrecipProb = daily[0].precipitationProbability;

  for (let h = 0; h < 24; h++) {
    const timeStr = `2026-07-02T${h.toString().padStart(2, "0")}:00`;
    const hourDiff = (h - 15 + 24) % 24;
    const tFraction = 0.5 + 0.5 * Math.cos((hourDiff / 24) * 2 * Math.PI);
    const temperature = parseFloat((todayMin + tFraction * (todayMax - todayMin)).toFixed(1));
    const humidity = Math.round(85 - (tFraction * 40));
    const hourRnd = createRandom(seed + h * 0.04)();
    const windSpeed = parseFloat((6 + (hourRnd * 12)).toFixed(1));
    
    hourly.push({
      time: timeStr,
      temperature,
      humidity,
      precipitationProbability: todayPrecipProb > 0 ? Math.round(todayPrecipProb * (0.4 + 0.6 * hourRnd)) : 0,
      weatherCode: todayCode,
      windSpeed,
    });
  }

  const currentHourly = hourly[23];
  const current = {
    time: "2026-07-02T23:15:20Z",
    temperature: currentHourly.temperature,
    relativeHumidity: currentHourly.humidity,
    apparentTemperature: parseFloat((currentHourly.temperature + (isRainy ? 0.4 : -0.8)).toFixed(1)),
    isDay: false,
    precipitation: isRainy ? parseFloat((daily[0].precipitationSum / 24).toFixed(2)) : 0,
    windSpeed: currentHourly.windSpeed,
    windDirection: Math.round(createRandom(seed + 0.81)() * 360),
    weatherCode: daily[0].weatherCode,
    cloudCover: isRainy ? 85 : (createRandom(seed + 0.65)() > 0.5 ? 45 : 15),
    pressure: parseFloat((1012.5 + (createRandom(seed + 0.44)() * 12 - 6)).toFixed(1)),
  };

  return {
    city: {
      name,
      latitude,
      longitude,
      country,
    },
    current,
    hourly,
    daily,
  };
}

export function generateDeterministicTrends(latitude: number, longitude: number, name: string) {
  const seed = getSeed(latitude, longitude);
  
  let tempBase = 24;
  if (latitude >= 0) {
    tempBase = 30 - (Math.abs(latitude - 20) * 0.35);
  } else {
    tempBase = 20 - (Math.abs(latitude + 30) * 0.4);
  }
  tempBase = Math.max(-15, Math.min(45, tempBase));
  
  const isRainy = (Math.abs(latitude) < 10) || (Math.abs(latitude) > 45 && createRandom(seed + 0.15)() > 0.4) || (createRandom(seed + 0.15)() > 0.7);

  const trends = [];
  let sumTempThisYear = 0;
  let sumTempHist = 0;
  let totalPrecipThisYear = 0;
  let totalPrecipHist = 0;

  for (let d = 1; d <= 30; d++) {
    const rTY = createRandom(seed + d * 0.1)();
    const rHist = createRandom(seed + d * 0.11)();
    const rP1 = createRandom(seed + d * 0.12)();
    const rP2 = createRandom(seed + d * 0.13)();
    
    const tempTY = parseFloat((tempBase + (rTY * 8) - 4 + 0.5).toFixed(1));
    const tempHist = parseFloat((tempBase + (rHist * 8) - 4).toFixed(1));
    
    let precipTY = 0;
    let precipHist = 0;
    
    if (isRainy) {
      if (rP1 > 0.6) precipTY = parseFloat((rP1 * 12).toFixed(1));
      if (rP2 > 0.61) precipHist = parseFloat((rP2 * 14).toFixed(1));
    } else {
      if (rP1 > 0.88) precipTY = parseFloat((rP1 * 5).toFixed(1));
      if (rP2 > 0.89) precipHist = parseFloat((rP2 * 6).toFixed(1));
    }
    
    sumTempThisYear += tempTY;
    sumTempHist += tempHist;
    totalPrecipThisYear += precipTY;
    totalPrecipHist += precipHist;

    trends.push({
      day: d,
      dateThisYear: `2026-06-${d.toString().padStart(2, "0")}`,
      dateHistorical: `2016-06-${d.toString().padStart(2, "0")}`,
      tempMaxThisYear: tempTY,
      tempMaxHistorical: tempHist,
      precipThisYear: precipTY,
      precipHistorical: precipHist,
    });
  }

  const avgTempThisYear = sumTempThisYear / 30;
  const avgTempHistorical = sumTempHist / 30;

  return {
    city: name || "This Location",
    periodThisYear: "June 2026",
    periodHistorical: "June 2016",
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
}
