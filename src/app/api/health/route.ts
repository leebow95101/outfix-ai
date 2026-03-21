import { getRecommendationServiceInfo } from "@/lib/services/outfit-recommendation.service";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "outfit-ai",
    llm: getRecommendationServiceInfo(),
  });
}
