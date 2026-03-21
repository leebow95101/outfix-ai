import "server-only";

import { type WeatherInfo } from "@/components/outfit/types";

type GeocodingResponse = {
  results?: Array<{
    name: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  }>;
};

type GeocodingLocation = NonNullable<GeocodingResponse["results"]>[number];

type ForecastResponse = {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    precipitation: number;
    rain: number;
    showers: number;
  };
};

type ReverseGeocodingResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  display_name?: string;
};

const WEATHER_LABELS: Record<number, string> = {
  0: "晴朗",
  1: "大致晴",
  2: "局部多云",
  3: "阴天",
  45: "雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "强毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "阵雨",
  81: "中等阵雨",
  82: "强阵雨",
  95: "雷暴",
};

function buildLocationName(location: GeocodingLocation) {
  return [location.name, location.admin1, location.country].filter(Boolean).join(", ");
}

function needsUmbrella(current: ForecastResponse["current"]) {
  if (!current) {
    return false;
  }

  if (current.precipitation > 0 || current.rain > 0 || current.showers > 0) {
    return true;
  }

  return [51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(current.weather_code);
}

function buildWeatherInfo(
  locationName: string,
  current: NonNullable<ForecastResponse["current"]>
): WeatherInfo {
  const umbrellaNeeded = needsUmbrella(current);

  return {
    locationName,
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    weatherLabel: WEATHER_LABELS[current.weather_code] ?? "天气未知",
    precipitation: current.precipitation,
    umbrellaNeeded,
    advice: umbrellaNeeded
      ? "当前天气存在降雨可能，出门记得带伞。"
      : "当前天气较稳定，可按常规通勤或出行场景搭配。",
  };
}

// 查询 Open-Meteo 当前天气，并返回给推荐链路使用。
export async function getWeatherByLocation(
  locationText: string
): Promise<WeatherInfo | null> {
  const keyword = locationText.trim();

  if (!keyword) {
    return null;
  }

  const geoResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      keyword
    )}&count=1&language=zh&format=json`,
    { cache: "no-store" }
  );

  if (!geoResponse.ok) {
    throw new Error("Failed to fetch geocoding data");
  }

  const geocoding = (await geoResponse.json()) as GeocodingResponse;
  const location = geocoding.results?.[0];

  if (!location) {
    return null;
  }

  const forecastResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,weather_code,precipitation,rain,showers&timezone=auto`,
    { cache: "no-store" }
  );

  if (!forecastResponse.ok) {
    throw new Error("Failed to fetch forecast data");
  }

  const forecast = (await forecastResponse.json()) as ForecastResponse;
  const current = forecast.current;

  if (!current) {
    return null;
  }

  return buildWeatherInfo(buildLocationName(location), current);
}

function buildReverseLocationName(payload: ReverseGeocodingResponse) {
  const address = payload.address;

  if (!address) {
    return payload.display_name?.split(",")[0] ?? "当前位置";
  }

  return (
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    address.state ||
    payload.display_name?.split(",")[0] ||
    "当前位置"
  );
}

// 根据浏览器定位到的经纬度查询当前城市天气。
export async function getWeatherByCoordinates(
  latitude: number,
  longitude: number
): Promise<WeatherInfo | null> {
  const [reverseResult, forecastResult] = await Promise.allSettled([
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=zh-CN`,
      {
        cache: "no-store",
        headers: {
          "User-Agent": "outfit-ai/1.0",
        },
      }
    ),
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,precipitation,rain,showers&timezone=auto`,
      { cache: "no-store" }
    ),
  ]);

  if (forecastResult.status !== "fulfilled") {
    throw forecastResult.reason;
  }

  const forecastResponse = forecastResult.value;

  if (!forecastResponse.ok) {
    throw new Error("Failed to fetch forecast data");
  }

  const forecast = (await forecastResponse.json()) as ForecastResponse;
  const current = forecast.current;

  if (!current) {
    return null;
  }

  const reversePayload =
    reverseResult.status === "fulfilled" && reverseResult.value.ok
      ? ((await reverseResult.value.json()) as ReverseGeocodingResponse)
      : null;

  return buildWeatherInfo(
    reversePayload ? buildReverseLocationName(reversePayload) : "当前位置",
    current
  );
}
