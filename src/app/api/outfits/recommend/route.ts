import {
  STYLE_OPTIONS,
  type RecommendOutfitsRequest,
} from "@/components/outfit/types";
import { getOutfitRecommendations } from "@/lib/services/outfit-recommendation.service";

export const runtime = "nodejs";

// 校验接口入参结构，避免非法请求直接进入业务层。
function isValidBody(value: unknown): value is RecommendOutfitsRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;
  const form = body.form as Record<string, unknown> | undefined;
  const userProfile = form?.userProfile as Record<string, unknown> | undefined;
  const uploadedImage = form?.uploadedImage as Record<string, unknown> | null | undefined;

  return (
    typeof form?.scene === "string" &&
    typeof form?.location === "string" &&
    STYLE_OPTIONS.includes(form.style as (typeof STYLE_OPTIONS)[number]) &&
    typeof body.requestVersion === "number" &&
    Array.isArray(body.feedbackContext) &&
    body.feedbackContext.every((item) => typeof item === "string") &&
    typeof userProfile?.gender === "string" &&
    typeof userProfile?.height === "string" &&
    typeof userProfile?.weight === "string" &&
    typeof userProfile?.preferences === "string" &&
    (uploadedImage == null ||
      (typeof uploadedImage.dataUrl === "string" &&
        typeof uploadedImage.name === "string" &&
        typeof uploadedImage.mimeType === "string"))
  );
}

// 接收前端穿搭请求，返回推荐结果列表。
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!isValidBody(body)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const form = {
    ...body.form,
    scene: body.form.scene.trim(),
  };

  if (!form.scene) {
    return Response.json({ error: "Scene is required." }, { status: 400 });
  }

  const result = await getOutfitRecommendations(
    form,
    body.requestVersion,
    body.feedbackContext
  );

  return Response.json(result);
}
