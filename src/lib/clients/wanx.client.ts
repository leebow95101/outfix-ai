import "server-only";

import {
  type OutfitFormState,
  type OutfitRecommendation,
} from "@/components/outfit/types";

const WANX_BASE_URL = process.env.WANX_BASE_URL ?? "https://dashscope.aliyuncs.com/api/v1";
const WANX_MODEL = process.env.WANX_MODEL ?? "wanx2.0-t2i-turbo";
const WANX_SIZE = process.env.WANX_IMAGE_SIZE ?? "1024*1024";

type WanxCreateTaskResponse = {
  output?: {
    task_id?: string;
    task_status?: string;
  };
  code?: string;
  message?: string;
};

type WanxTaskResponse = {
  output?: {
    task_id?: string;
    task_status?: string;
    code?: string;
    message?: string;
    results?: Array<{
      url?: string;
      actual_prompt?: string;
      orig_prompt?: string;
      code?: string;
      message?: string;
    }>;
  };
  code?: string;
  message?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildExampleImagePrompt(
  form: OutfitFormState,
  recommendation: OutfitRecommendation
) {
  const profileBlock = [
    form.userProfile.gender && `性别倾向：${form.userProfile.gender}`,
    form.userProfile.height && `身高约 ${form.userProfile.height}cm`,
    form.userProfile.weight && `体重约 ${form.userProfile.weight}kg`,
    form.userProfile.preferences && `用户风格偏好：${form.userProfile.preferences}`,
  ]
    .filter(Boolean)
    .join("；");

  return [
    "请生成一张高质量中文穿搭示例图。",
    `场景：${form.scene}。`,
    `整体风格：${form.style}。`,
    `上衣：${recommendation.top}；下装：${recommendation.bottom}；鞋子：${recommendation.shoes}。`,
    `搭配标签：${recommendation.tags.join("、")}。`,
    profileBlock ? `${profileBlock}。` : "",
    "画面要求：单人全身穿搭展示，写实时尚感，服装细节清晰，自然光线，背景与场景匹配，避免多余人物、肢体错误、模糊失焦和夸张变形。",
  ]
    .filter(Boolean)
    .join("");
}

async function createWanxTask(prompt: string) {
  const apiKey = process.env.QWEN_API_KEY;

  if (!apiKey) {
    throw new Error("Missing QWEN_API_KEY");
  }

  const response = await fetch(
    `${WANX_BASE_URL}/services/aigc/text2image/image-synthesis`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      cache: "no-store",
      body: JSON.stringify({
        model: WANX_MODEL,
        input: {
          prompt,
        },
        parameters: {
          size: WANX_SIZE,
          n: 1,
        },
      }),
    }
  );

  const payload = (await response.json().catch(() => null)) as WanxCreateTaskResponse | null;

  if (!response.ok || !payload?.output?.task_id) {
    throw new Error(payload?.message || payload?.code || "Failed to create Wanx task");
  }

  return payload.output.task_id;
}

async function pollWanxTask(taskId: string) {
  const apiKey = process.env.QWEN_API_KEY;

  if (!apiKey) {
    throw new Error("Missing QWEN_API_KEY");
  }

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const response = await fetch(`${WANX_BASE_URL}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as WanxTaskResponse | null;

    if (!response.ok) {
      throw new Error(payload?.message || payload?.code || "Failed to query Wanx task");
    }

    const taskStatus = payload?.output?.task_status;

    if (taskStatus === "SUCCEEDED") {
      const firstResult = payload?.output?.results?.find((item) => Boolean(item.url));

      if (!firstResult?.url) {
        throw new Error("Wanx task succeeded but no image URL returned");
      }

      return {
        imageUrl: firstResult.url,
        revisedPrompt: firstResult.actual_prompt ?? firstResult.orig_prompt ?? null,
      };
    }

    if (taskStatus === "FAILED") {
      throw new Error(
        payload?.output?.message || payload?.output?.code || "Wanx image generation failed"
      );
    }

    await sleep(2000);
  }

  throw new Error("Wanx image generation timed out");
}

export async function requestWanxExampleImage(
  form: OutfitFormState,
  recommendation: OutfitRecommendation
) {
  const prompt = buildExampleImagePrompt(form, recommendation);
  const taskId = await createWanxTask(prompt);
  const result = await pollWanxTask(taskId);

  return {
    ...result,
    prompt,
  };
}

export function getWanxClientInfo() {
  return {
    model: WANX_MODEL,
    baseUrl: WANX_BASE_URL,
    imageSize: WANX_SIZE,
  };
}
