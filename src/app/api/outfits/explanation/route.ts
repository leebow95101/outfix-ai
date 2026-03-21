import {
  type StreamExplanationRequest,
  type StyleOption,
  STYLE_OPTIONS,
} from "@/components/outfit/types";
import { streamOutfitExplanation } from "@/lib/services/outfit-recommendation.service";

export const runtime = "nodejs";

function isValidBody(value: unknown): value is StreamExplanationRequest {
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

function sseEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// 以 SSE 形式流式返回单套搭配的解释内容。
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!isValidBody(body)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(sseEvent({ type: "start" })));

        for await (const chunk of streamOutfitExplanation(
          body.form,
          body.recommendation
        )) {
          controller.enqueue(
            encoder.encode(
              sseEvent({
                type: "chunk",
                content: chunk,
              })
            )
          );
        }

        controller.enqueue(encoder.encode(sseEvent({ type: "done" })));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to stream explanation";

        controller.enqueue(
          encoder.encode(
            sseEvent({
              type: "error",
              message,
            })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
