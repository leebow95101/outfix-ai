import "server-only";

import {
  type WeatherInfo,
  type ImageAnalysis,
  type OutfitFormState,
  type OutfitRecommendation,
} from "@/components/outfit/types";

const DEFAULT_BASE_URL =
  process.env.QWEN_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = process.env.QWEN_MODEL ?? "qwen2.5-14b-instruct";
const DEFAULT_VISION_MODEL = process.env.QWEN_VISION_MODEL ?? "qwen3-vl-plus";

type QwenChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type QwenStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    finish_reason?: string | null;
  }>;
};

type RawRecommendation = Partial<OutfitRecommendation>;
type RawImageAnalysis = Partial<ImageAnalysis>;

type RecommendPayload = {
  recommendations?: RawRecommendation[];
  imageAnalysis?: RawImageAnalysis | null;
};

function buildPromptWithContext(
  form: OutfitFormState,
  requestVersion: number,
  weather: WeatherInfo | null,
  feedbackContext: string[]
) {
  const weatherBlock = weather
    ? `
天气信息：
- 地点：${weather.locationName}
- 天气：${weather.weatherLabel}
- 实际温度：${weather.temperature}°C
- 体感温度：${weather.apparentTemperature}°C
- 降水：${weather.precipitation}mm
- 穿搭提醒：${weather.advice}
`
    : "\n天气信息：未提供\n";

  const feedbackBlock =
    feedbackContext.length > 0
      ? `\n用户过往反馈偏好：\n${feedbackContext.map((item) => `- ${item}`).join("\n")}\n`
      : "\n用户过往反馈偏好：暂无\n";

  return `
你是专业中文穿搭顾问，请根据用户输入生成 3 套不同的穿搭推荐。

要求：
1. 只返回 JSON，不要返回 Markdown，不要写解释前言。
2. 返回格式必须是：
{
  "imageAnalysis": {
    "summary": "string",
    "detectedStyle": "string",
    "colors": ["string"],
    "items": ["string"],
    "sceneHint": "string"
  },
  "recommendations": [
    {
      "top": "string",
      "bottom": "string",
      "shoes": "string",
      "tags": ["string", "string", "string"],
      "score": 0,
      "explanation": "string"
    }
  ]
}
3. recommendations 必须恰好 3 条。
4. explanation 必须是简洁中文，说明为什么适合该场景、风格和用户画像。
5. score 为 0-100 的整数。
6. 标签要覆盖风格、季节、场景感受。
7. 本次生成批次号为 ${requestVersion}，请输出不同组合，避免过度重复。
8. 如果用户上传了图片，请结合图片中的人物、服装、颜色、版型或场景线索一起推荐。
9. 如果没有上传图片，imageAnalysis 必须返回 null。
10. 如果上传了图片，imageAnalysis 必须填写，并总结图片中的风格、颜色、单品和场景线索。

用户输入：
- 场景描述：${form.scene}
- 风格：${form.style}
- 性别：${form.userProfile.gender || "未提供"}
- 身高：${form.userProfile.height || "未提供"}
- 体重：${form.userProfile.weight || "未提供"}
- 风格偏好：${form.userProfile.preferences || "未提供"}
- 是否上传图片：${form.uploadedImage ? "是" : "否"}
${weatherBlock}
${feedbackBlock}
`.trim();
}

function buildRecommendationMessages(
  form: OutfitFormState,
  requestVersion: number,
  weather: WeatherInfo | null,
  feedbackContext: string[]
) {
  if (!form.uploadedImage) {
    return [
      {
        role: "system",
        content:
          "你是专业中文穿搭顾问，必须严格输出 JSON，不能输出任何额外说明。",
      },
      {
        role: "user",
        content: buildPromptWithContext(
          form,
          requestVersion,
          weather,
          feedbackContext
        ),
      },
    ];
  }

  return [
    {
      role: "system",
      content:
        "你是专业中文穿搭顾问，具备图像理解能力，必须严格输出 JSON，不能输出任何额外说明。",
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: form.uploadedImage.dataUrl,
          },
        },
        {
          type: "text",
          text: buildPromptWithContext(
            form,
            requestVersion,
            weather,
            feedbackContext
          ),
        },
      ],
    },
  ];
}

// 提取 Qwen 返回的文本内容。
function extractTextContent(payload: QwenChatCompletionResponse) {
  const content = payload.choices?.[0]?.message?.content ?? "";
  return typeof content === "string" ? content.trim() : "";
}

// 兼容模型返回代码块或纯文本时的 JSON 提取。
function extractJsonBlock(text: string) {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }

  return text;
}

function normalizeImageAnalysis(
  value: RawImageAnalysis | null | undefined
): ImageAnalysis | null {
  if (!value) {
    return null;
  }

  return {
    summary: value.summary?.trim() || "已根据上传图片补充视觉线索。",
    detectedStyle: value.detectedStyle?.trim() || "风格待补充",
    colors:
      value.colors?.filter((item): item is string => Boolean(item?.trim())).slice(0, 4) ||
      [],
    items:
      value.items?.filter((item): item is string => Boolean(item?.trim())).slice(0, 4) ||
      [],
    sceneHint: value.sceneHint?.trim() || "已结合图片中的场景信息进行推荐。",
  };
}

// 请求 Qwen，获取推荐结果原始数据。
export async function requestQwenRecommendations(
  form: OutfitFormState,
  requestVersion: number,
  weather: WeatherInfo | null,
  feedbackContext: string[]
) {
  const apiKey = process.env.QWEN_API_KEY;

  if (!apiKey) {
    throw new Error("Missing QWEN_API_KEY");
  }

  const response = await fetch(`${DEFAULT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
    body: JSON.stringify({
      model: form.uploadedImage ? DEFAULT_VISION_MODEL : DEFAULT_MODEL,
      messages: buildRecommendationMessages(
        form,
        requestVersion,
        weather,
        feedbackContext
      ),
      temperature: 0.9,
      top_p: 0.95,
    }),
  });

  const payload = (await response.json()) as QwenChatCompletionResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || "Qwen request failed");
  }

  const parsed = JSON.parse(extractJsonBlock(extractTextContent(payload))) as RecommendPayload;

  return {
    recommendations: parsed.recommendations ?? [],
    imageAnalysis: form.uploadedImage
      ? normalizeImageAnalysis(parsed.imageAnalysis)
      : null,
  };
}

// 暴露模型与密钥状态，供健康检查接口使用。
export function getQwenClientInfo() {
  return {
    provider: "qwen",
    model: DEFAULT_MODEL,
    visionModel: DEFAULT_VISION_MODEL,
    baseUrl: DEFAULT_BASE_URL,
    hasApiKey: Boolean(process.env.QWEN_API_KEY),
  };
}

function buildExplanationPrompt(
  form: OutfitFormState,
  recommendation: OutfitRecommendation
) {
  return `
请基于下面这套已推荐的穿搭，输出一段更自然、更像真人顾问的中文解释。

要求：
1. 直接输出解释正文，不要输出标题，不要输出 Markdown。
2. 风格参考 DeepSeek 对话式输出：自然、分点清晰，但保持一段一段流畅表达。
3. 内容要围绕场景匹配、风格统一、版型效果、舒适度、搭配亮点展开。
4. 控制在 120 到 220 字。

用户信息：
- 场景描述：${form.scene}
- 风格：${form.style}
- 性别：${form.userProfile.gender || "未提供"}
- 身高：${form.userProfile.height || "未提供"}
- 体重：${form.userProfile.weight || "未提供"}
- 风格偏好：${form.userProfile.preferences || "未提供"}
- 是否有图片参考：${form.uploadedImage ? "有" : "无"}

当前搭配：
- 上衣：${recommendation.top}
- 下装：${recommendation.bottom}
- 鞋子：${recommendation.shoes}
- 标签：${recommendation.tags.join(" / ")}
`.trim();
}

// 以流式方式请求 Qwen 解释内容，供服务端转成 SSE 输出。
export async function requestQwenExplanationStream(
  form: OutfitFormState,
  recommendation: OutfitRecommendation
) {
  const apiKey = process.env.QWEN_API_KEY;

  if (!apiKey) {
    throw new Error("Missing QWEN_API_KEY");
  }

  const response = await fetch(`${DEFAULT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      stream: true,
      messages: [
        {
          role: "system",
          content: "你是专业中文穿搭顾问，回答要自然、清晰、适合流式输出。",
        },
        {
          role: "user",
          content: buildExplanationPrompt(form, recommendation),
        },
      ],
      temperature: 0.8,
      top_p: 0.95,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | QwenChatCompletionResponse
      | null;
    throw new Error(payload?.error?.message || "Qwen stream request failed");
  }

  if (!response.body) {
    throw new Error("Qwen stream body is empty");
  }

  return response.body;
}

// 解析 Qwen 返回的 SSE 数据块，提取增量文本内容。
export async function* readQwenStreamChunks(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const dataLines = event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim());

      for (const data of dataLines) {
        if (!data || data === "[DONE]") {
          continue;
        }

        const payload = JSON.parse(data) as QwenStreamChunk;
        const chunk = payload.choices?.[0]?.delta?.content;

        if (chunk) {
          yield chunk;
        }
      }
    }
  }
}
