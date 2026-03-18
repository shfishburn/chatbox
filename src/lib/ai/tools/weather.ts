import { tool } from "./tool";
import { z } from "zod";

export const weatherTool = tool({
  description:
    "Get current weather and a short forecast for any city or location. Uses the Open-Meteo API (no API key required).",
  parameters: z.object({
    location: z
      .string()
      .describe(
        "City name or location, e.g. 'Paris', 'New York', 'Tokyo, Japan'",
      ),
  }),
  execute: async ({ location }) => {
    try {
      // Step 1: Geocode the location
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) throw new Error("Geocoding request failed");

      const geoData = await geoRes.json();
      if (!geoData.results?.length) {
        return { error: `Location "${location}" not found.` };
      }

      const { name, country, latitude, longitude, timezone } =
        geoData.results[0];

      // Step 2: Fetch weather
      const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
      weatherUrl.searchParams.set("latitude", latitude);
      weatherUrl.searchParams.set("longitude", longitude);
      weatherUrl.searchParams.set(
        "current",
        [
          "temperature_2m",
          "apparent_temperature",
          "weather_code",
          "wind_speed_10m",
          "relative_humidity_2m",
          "precipitation",
        ].join(","),
      );
      weatherUrl.searchParams.set(
        "daily",
        "temperature_2m_max,temperature_2m_min,weather_code",
      );
      weatherUrl.searchParams.set("timezone", timezone ?? "auto");
      weatherUrl.searchParams.set("forecast_days", "3");

      const weatherRes = await fetch(weatherUrl.toString());
      if (!weatherRes.ok) throw new Error("Weather request failed");

      const weather = await weatherRes.json();
      const c = weather.current;

      return {
        location: `${name}, ${country}`,
        current: {
          temperature: `${c.temperature_2m}°C`,
          feelsLike: `${c.apparent_temperature}°C`,
          humidity: `${c.relative_humidity_2m}%`,
          windSpeed: `${c.wind_speed_10m} km/h`,
          precipitation: `${c.precipitation} mm`,
          condition: wmoDescription(c.weather_code),
        },
        forecast: (weather.daily?.time ?? []).map(
          (date: string, i: number) => ({
            date,
            high: `${weather.daily.temperature_2m_max[i]}°C`,
            low: `${weather.daily.temperature_2m_min[i]}°C`,
            condition: wmoDescription(weather.daily.weather_code[i]),
          }),
        ),
      };
    } catch (err) {
      return { error: `Weather lookup failed: ${(err as Error).message}` };
    }
  },
});

function wmoDescription(code: number): string {
  const map: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight showers",
    81: "Moderate showers",
    82: "Violent showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
  };
  return map[code] ?? `Code ${code}`;
}
