import { describe, expect, it } from "vitest";
import { normalize } from "./weather";
import type { OpenMeteoForecast } from "./weatherSource";

const RAW: OpenMeteoForecast = {
  current: { time: "2026-09-08T09:00", temperature_2m: 17.4, weather_code: 3, wind_speed_10m: 12.2, precipitation: 0 },
  daily: {
    time: ["2026-09-08", "2026-09-09"],
    weather_code: [3, 61],
    temperature_2m_max: [19.1, 16.8],
    temperature_2m_min: [12.3, 11.1],
    precipitation_probability_max: [10, 80],
  },
};

describe("normalize", () => {
  it("rounds current temperature and wind speed to whole numbers", () => {
    const weather = normalize("blackpool", new Date(), RAW);
    expect(weather.current.temperatureC).toBe(17);
    expect(weather.current.windSpeedKmh).toBe(12);
  });

  it("maps the current weather code to a real condition", () => {
    const weather = normalize("blackpool", new Date(), RAW);
    expect(weather.current.condition.label).toBe("Overcast");
    expect(weather.current.condition.rainy).toBe(false);
  });

  it("produces one daily entry per day in the source response, in order", () => {
    const weather = normalize("blackpool", new Date(), RAW);
    expect(weather.daily).toHaveLength(2);
    expect(weather.daily[0].date).toBe("2026-09-08");
    expect(weather.daily[1].date).toBe("2026-09-09");
  });

  it("carries each day's own condition and rain chance", () => {
    const weather = normalize("blackpool", new Date(), RAW);
    expect(weather.daily[1].condition.rainy).toBe(true);
    expect(weather.daily[1].precipitationChancePercent).toBe(80);
    expect(weather.daily[1].maxC).toBe(17);
    expect(weather.daily[1].minC).toBe(11);
  });

  it("carries the town slug and fetch time through unchanged", () => {
    const fetchedAt = new Date("2026-09-08T09:00:00Z");
    const weather = normalize("fleetwood", fetchedAt, RAW);
    expect(weather.townSlug).toBe("fleetwood");
    expect(weather.fetchedAt).toBe(fetchedAt);
  });
});
