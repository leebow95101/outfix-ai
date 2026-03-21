import "server-only";

import {
  type ImageAnalysis,
  type OutfitFormState,
  type OutfitRecommendation,
  type WeatherInfo,
} from "@/components/outfit/types";
import {
  getQwenClientInfo,
  readQwenStreamChunks,
  requestQwenExplanationStream,
  requestQwenRecommendations,
} from "@/lib/clients/qwen.client";
import {
  getWanxClientInfo,
  requestWanxExampleImage,
} from "@/lib/clients/wanx.client";
import { generateMockRecommendations } from "@/lib/services/outfit-mock.service";
import { getWeatherByLocation } from "@/lib/services/weather.service";

type RawRecommendation = Partial<OutfitRecommendation>;
type RecommendResult = {
  recommendations: OutfitRecommendation[];
  imageAnalysis: ImageAnalysis | null;
  weather: WeatherInfo | null;
};

function applyWeatherHints(
  recommendations: OutfitRecommendation[],
  weather: WeatherInfo | null
) {
  if (!weather?.umbrellaNeeded) {
    return recommendations;
  }

  return recommendations.map((recommendation) => ({
    ...recommendation,
    tags: recommendation.tags.includes("带伞")
      ? recommendation.tags
      : [...recommendation.tags, "带伞"],
    explanation: `${recommendation.explanation} 另外，${weather.advice}`,
  }));
}

// 将模型返回结果与本地兜底结果合并成稳定的前端展示结构。
function normalizeRecommendation(
  item: RawRecommendation,
  index: number,
  requestVersion: number,
  fallback: OutfitRecommendation
): OutfitRecommendation {
  return {
    id: `outfit-${requestVersion}-${index}`,
    top: item.top?.trim() || fallback.top,
    bottom: item.bottom?.trim() || fallback.bottom,
    shoes: item.shoes?.trim() || fallback.shoes,
    tags:
      item.tags?.filter((tag): tag is string => Boolean(tag?.trim())).slice(0, 4) ||
      fallback.tags,
    score:
      typeof item.score === "number"
        ? Math.max(0, Math.min(100, Math.round(item.score)))
        : fallback.score,
    explanation: item.explanation?.trim() || fallback.explanation,
  };
}

// 优先请求 Qwen，失败时自动回退到本地 mock 推荐。
export async function getOutfitRecommendations(
  form: OutfitFormState,
  requestVersion: number,
  feedbackContext: string[]
): Promise<RecommendResult> {
  const [weather, fallbackRecommendations] = await Promise.all([
    getWeatherByLocation(form.location).catch((error) => {
      console.error("Failed to fetch weather", error);
      return null;
    }),
    Promise.resolve(generateMockRecommendations(form, requestVersion)),
  ]);

  try {
    const result = await requestQwenRecommendations(
      form,
      requestVersion,
      weather,
      feedbackContext
    );

    if (result.recommendations.length === 0) {
      return {
        recommendations: applyWeatherHints(fallbackRecommendations, weather),
        imageAnalysis: result.imageAnalysis,
        weather,
      };
    }

    return {
      recommendations: applyWeatherHints(
        fallbackRecommendations.map((fallback, index) =>
          normalizeRecommendation(
            result.recommendations[index] ?? {},
            index,
            requestVersion,
            fallback
          )
        ),
        weather
      ),
      imageAnalysis: result.imageAnalysis,
      weather,
    };
  } catch (error) {
    console.error("Failed to generate outfit recommendations", error);
    return {
      recommendations: applyWeatherHints(fallbackRecommendations, weather),
      imageAnalysis: null,
      weather,
    };
  }
}

// 返回推荐服务运行信息，供健康检查接口读取。
export function getRecommendationServiceInfo() {
  return getQwenClientInfo();
}

// 基于当前选中搭配生成示例效果图。
export async function generateOutfitExampleImage(
  form: OutfitFormState,
  recommendation: OutfitRecommendation
) {
  return requestWanxExampleImage(form, recommendation);
}

export function getImageGenerationServiceInfo() {
  return getWanxClientInfo();
}

// 将 Qwen 的流式解释转成可供 SSE 接口消费的文本块。
export async function* streamOutfitExplanation(
  form: OutfitFormState,
  recommendation: OutfitRecommendation
) {
  const stream = await requestQwenExplanationStream(form, recommendation);

  for await (const chunk of readQwenStreamChunks(stream)) {
    yield chunk;
  }
}
