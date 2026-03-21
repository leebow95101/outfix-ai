"use client";

import { type WeatherInfo } from "@/components/outfit/types";

type WeatherPanelProps = {
  weather: WeatherInfo | null;
  isLoading: boolean;
};

export function WeatherPanel({ weather, isLoading }: WeatherPanelProps) {
  if (!weather && !isLoading) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mt-1">
        <h2 className="text-xl font-semibold text-slate-900">天气与穿搭提醒</h2>
        <p className="mt-2 text-sm text-slate-500">
          基于 Open-Meteo 的实时天气，为推荐补充出行建议。
        </p>
      </div>

      <div className="mt-5 rounded-3xl bg-slate-50 p-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
        ) : weather ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-medium text-slate-500">位置</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {weather.locationName}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-medium text-slate-500">天气</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {weather.weatherLabel}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-medium text-slate-500">温度</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {weather.temperature}°C / 体感 {weather.apparentTemperature}°C
                </p>
              </div>
            </div>
            <div
              className={`rounded-2xl p-4 text-sm leading-7 ${
                weather.umbrellaNeeded
                  ? "bg-amber-50 text-amber-800"
                  : "bg-white text-slate-700"
              }`}
            >
              {weather.advice}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">当前没有可用天气信息。</p>
        )}
      </div>
    </section>
  );
}
