import { getWeatherByCoordinates } from "@/lib/services/weather.service";

export const runtime = "nodejs";

// 根据浏览器传来的经纬度返回当前城市天气。
export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("latitude"));
  const longitude = Number(url.searchParams.get("longitude"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return Response.json({ error: "Invalid coordinates." }, { status: 400 });
  }

  const weather = await getWeatherByCoordinates(latitude, longitude);

  return Response.json({ weather });
}
