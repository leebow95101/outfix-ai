import {
  type GenerateExampleImageRequest,
  type StyleOption,
  STYLE_OPTIONS,
} from "@/components/outfit/types";
import { generateOutfitExampleImage } from "@/lib/services/outfit-recommendation.service";

export const runtime = "nodejs";

function isValidBody(value: unknown): value is GenerateExampleImageRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;
  const form = body.form as Record<string, unknown> | undefined;
  const userProfile = form?.userProfile as Record<string, unknown> | undefined;
  const uploadedImage = form?.uploadedImage as Record<string, unknown> | null | undefined;
  const recommendation = body.recommendation as Record<string, unknown> | undefined;

  return (
    typeof form?.scene === "string" &&
    typeof form?.location === "string" &&
    STYLE_OPTIONS.includes(form.style as StyleOption) &&
    typeof userProfile?.gender === "string" &&
    typeof userProfile?.height === "string" &&
    typeof userProfile?.weight === "string" &&
    typeof userProfile?.preferences === "string" &&
    (uploadedImage == null ||
      (typeof uploadedImage.dataUrl === "string" &&
        typeof uploadedImage.name === "string" &&
        typeof uploadedImage.mimeType === "string")) &&
    typeof recommendation?.id === "string" &&
    typeof recommendation?.top === "string" &&
    typeof recommendation?.bottom === "string" &&
    typeof recommendation?.shoes === "string" &&
    Array.isArray(recommendation?.tags)
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!isValidBody(body)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const result = await generateOutfitExampleImage(body.form, body.recommendation);

    return Response.json({
      imageUrl: result.imageUrl,
      revisedPrompt: result.revisedPrompt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate example image";

    return Response.json({ error: message }, { status: 500 });
  }
}
