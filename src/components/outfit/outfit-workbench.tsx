"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ExampleImagePanel } from "@/components/outfit/example-image-panel";
import { ExplanationPanel } from "@/components/outfit/explanation-panel";
import { ImageAnalysisPanel } from "@/components/outfit/image-analysis-panel";
import { InputPanel } from "@/components/outfit/input-panel";
import { RecommendationList } from "@/components/outfit/recommendation-list";
import { WeatherPanel } from "@/components/outfit/weather-panel";
import {
  type FeedbackValue,
  type GenerateExampleImageResponse,
  type HistoryEntry,
  type ImageAnalysis,
  type OutfitFormState,
  type OutfitRecommendation,
  type RecommendationFeedback,
  type RecommendOutfitsResponse,
  STYLE_OPTIONS,
  type WeatherInfo,
} from "@/components/outfit/types";
import { UserProfilePanel } from "@/components/outfit/user-profile-panel";

const DEFAULT_FORM: OutfitFormState = {
  scene: "",
  location: "",
  style: STYLE_OPTIONS[1],
  userProfile: {
    gender: "",
    height: "",
    weight: "",
    preferences: "",
  },
  uploadedImage: null,
};

function toHistoryEntry(form: OutfitFormState): HistoryEntry {
  return {
    scene: form.scene,
    location: form.location,
    style: form.style,
    userProfile: form.userProfile,
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    imageName: form.uploadedImage?.name,
  };
}

function sameForm(
  left: Pick<OutfitFormState, "scene" | "location" | "style" | "userProfile">,
  right: Pick<OutfitFormState, "scene" | "location" | "style" | "userProfile">
) {
  return (
    left.scene === right.scene &&
    left.location === right.location &&
    left.style === right.style &&
    left.userProfile.gender === right.userProfile.gender &&
    left.userProfile.height === right.userProfile.height &&
    left.userProfile.weight === right.userProfile.weight &&
    left.userProfile.preferences === right.userProfile.preferences
  );
}

export function OutfitWorkbench() {
  const [hasMounted, setHasMounted] = useState(false);
  const [form, setForm] = useState<OutfitFormState>(DEFAULT_FORM);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [feedbacks, setFeedbacks] = useState<RecommendationFeedback[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [hasDeniedGeolocation, setHasDeniedGeolocation] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [currentCityWeather, setCurrentCityWeather] = useState<WeatherInfo | null>(null);
  const [exampleImageUrl, setExampleImageUrl] = useState<string | null>(null);
  const [exampleImageError, setExampleImageError] = useState<string | null>(null);
  const [isExampleImageLoading, setIsExampleImageLoading] = useState(false);
  const [streamedExplanation, setStreamedExplanation] = useState("");
  const [isExplanationStreaming, setIsExplanationStreaming] = useState(false);
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
  const [requestVersion, setRequestVersion] = useState(1);
  const [lastSubmitted, setLastSubmitted] = useState<OutfitFormState | null>(null);
  const explanationAbortRef = useRef<AbortController | null>(null);

  const selectedRecommendation = useMemo(
    () =>
      recommendations.find((recommendation) => recommendation.id === selectedId) ??
      recommendations[0] ??
      null,
    [recommendations, selectedId]
  );

  const feedbackMap = useMemo(() => {
    return Object.fromEntries(
      recommendations.map((recommendation) => {
        const matched = feedbacks.find(
          (feedback) =>
            feedback.style === form.style &&
            feedback.top === recommendation.top &&
            feedback.bottom === recommendation.bottom &&
            feedback.shoes === recommendation.shoes
        );

        return [recommendation.id, matched?.value];
      })
    ) as Record<string, FeedbackValue | undefined>;
  }, [feedbacks, form.style, recommendations]);

  function buildFeedbackContext(records: RecommendationFeedback[]) {
    return records
      .slice(0, 6)
      .map((record) =>
        record.value === "like"
          ? `用户偏好 ${record.style} 风格下的 ${record.top}、${record.bottom} 和 ${record.shoes} 组合`
          : `用户不喜欢 ${record.style} 风格下的 ${record.top}、${record.bottom} 和 ${record.shoes} 组合`
      );
  }

  // 自动获取浏览器定位，并查询当前城市天气。
  function locateCurrentCityWeather() {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);
    setHasDeniedGeolocation(false);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `/api/weather/current?latitude=${coords.latitude}&longitude=${coords.longitude}`
          );

          if (!response.ok) {
            throw new Error('获取当前位置天气信息失败');
          }

          const payload = (await response.json()) as {
            weather: WeatherInfo | null;
          };

          if (payload.weather) {
            setCurrentCityWeather(payload.weather);

            setForm((current) => {
              return {
                ...current,
                location: payload.weather?.locationName ?? current.location,
              };
            });
          }
        } catch (error) {
          console.error("Failed to locate current city weather", error);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation denied or failed", error);
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setHasDeniedGeolocation(true);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
      }
    );
  }

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 保留最近输入记录，便于用户快速复用历史条件。
  function updateHistory(nextForm: OutfitFormState) {
    setHistory((current) => {
      const withoutDuplicate = current.filter((entry) => !sameForm(entry, nextForm));
      return [toHistoryEntry(nextForm), ...withoutDuplicate].slice(0, 5);
    });
  }

  async function readImageAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("Failed to read image"));
      };

      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });
  }

  // 处理本地图片上传，供多模态推荐使用。
  async function handleImageChange(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageError("请上传图片文件。");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageError("图片大小请控制在 2MB 以内。");
      return;
    }

    try {
      const dataUrl = await readImageAsDataUrl(file);
      setForm((current) => ({
        ...current,
        uploadedImage: {
          dataUrl,
          name: file.name,
          mimeType: file.type,
        },
      }));
      setImageError(null);
    } catch (error) {
      console.error("Failed to load image", error);
      setImageError("图片读取失败，请重试。");
    }
  }

  // 读取 SSE 响应流，让解释区像对话模型一样逐段更新。
  async function streamExplanation(
    nextForm: OutfitFormState,
    recommendation: OutfitRecommendation
  ) {
    explanationAbortRef.current?.abort();
    const controller = new AbortController();
    explanationAbortRef.current = controller;
    setStreamedExplanation("");
    setIsExplanationStreaming(true);

    try {
      const response = await fetch("/api/outfits/explanation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form: nextForm,
          recommendation,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to stream explanation");
      }

      const reader = response.body.getReader();
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
          const line = event
            .split("\n")
            .find((item) => item.startsWith("data: "));

          if (!line) {
            continue;
          }

          const payload = JSON.parse(line.slice(6)) as
            | { type: "start" | "done" }
            | { type: "chunk"; content: string }
            | { type: "error"; message: string };

          if (payload.type === "chunk") {
            setStreamedExplanation((current) => current + payload.content);
          }

          if (payload.type === "error") {
            throw new Error(payload.message);
          }
        }
      }
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error("Failed to stream explanation", error);
      setStreamedExplanation(recommendation.explanation);
    } finally {
      if (explanationAbortRef.current === controller) {
        explanationAbortRef.current = null;
        setIsExplanationStreaming(false);
      }
    }
  }

  // 调用服务端接口生成搭配，并同步更新当前选中卡片。
  async function runGeneration(nextForm: OutfitFormState, version: number) {
    setIsLoading(true);
    explanationAbortRef.current?.abort();
    setImageAnalysis(null);
    setWeather(null);
    setExampleImageUrl(null);
    setExampleImageError(null);
    setIsExampleImageLoading(false);
    setStreamedExplanation("");
    setIsExplanationStreaming(false);

    try {
      const response = await fetch("/api/outfits/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form: nextForm,
          requestVersion: version,
          feedbackContext: buildFeedbackContext(feedbacks),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate outfits");
      }

      const payload = (await response.json()) as RecommendOutfitsResponse;
      const nextRecommendations = payload.recommendations ?? [];
      setImageAnalysis(payload.imageAnalysis ?? null);
      setWeather(payload.weather ?? null);
      setRecommendations(nextRecommendations);
      setSelectedId(nextRecommendations[0]?.id ?? null);
    } catch (error) {
      console.error("Failed to fetch recommendations", error);
      setImageAnalysis(null);
      setWeather(null);
      setRecommendations([]);
      setSelectedId(null);
    } finally {
      setIsLoading(false);
    }
  }

  // 提交当前表单并触发新一轮推荐。
  async function handleGenerate() {
    const normalizedScene = form.scene.trim();
    const detectedLocation = currentCityWeather?.locationName?.trim() ?? "";

    if (!normalizedScene) {
      setSceneError("场景描述为必填项");
      return;
    }

    setSceneError(null);
    const nextForm = {
      ...form,
      scene: normalizedScene,
      location: detectedLocation,
    };
    const nextVersion = requestVersion + 1;

    setForm(nextForm);
    setLastSubmitted(nextForm);
    setRequestVersion(nextVersion);
    updateHistory(nextForm);
    await runGeneration(nextForm, nextVersion);
  }

  // 使用上一次提交条件重新生成，保留用户当前输入历史。
  async function handleRegenerate() {
    if (!lastSubmitted) {
      return;
    }

    const sourceForm = lastSubmitted;
    const nextVersion = requestVersion + 1;

    setRequestVersion(nextVersion);
    await runGeneration(sourceForm, nextVersion);
  }

  async function handleGenerateExampleImage() {
    if (!selectedRecommendation || !lastSubmitted) {
      return;
    }

    setIsExampleImageLoading(true);
    setExampleImageError(null);

    try {
      const response = await fetch("/api/outfits/example-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form: lastSubmitted,
          recommendation: selectedRecommendation,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | GenerateExampleImageResponse
        | { error?: string }
        | null;

      if (!response.ok || !payload || !("imageUrl" in payload)) {
        throw new Error(payload && "error" in payload ? payload.error : "生成示例图失败");
      }

      setExampleImageUrl(payload.imageUrl);
    } catch (error) {
      setExampleImageUrl(null);
      setExampleImageError(error instanceof Error ? error.message : "生成示例图失败");
    } finally {
      setIsExampleImageLoading(false);
    }
  }

  // 记录用户对搭配的喜欢/不喜欢，并在后续生成时注入偏好闭环。
  function handleFeedback(
    recommendation: OutfitRecommendation,
    value: FeedbackValue
  ) {
    setFeedbacks((current) => {
      const next = [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          scene: form.scene,
          style: form.style,
          top: recommendation.top,
          bottom: recommendation.bottom,
          shoes: recommendation.shoes,
          value,
          createdAt: new Date().toISOString(),
        },
        ...current.filter(
          (item) =>
            !(
              item.style === form.style &&
              item.top === recommendation.top &&
              item.bottom === recommendation.bottom &&
              item.shoes === recommendation.shoes
            )
        ),
      ].slice(0, 20);

      return next;
    });
  }

  async function handleClearHistory() {
    setHistory([]);
    setLastSubmitted(null);
    setRecommendations([]);
    setSelectedId(null);
    setImageAnalysis(null);
    setWeather(null);
    setExampleImageUrl(null);
    setExampleImageError(null);
    setIsExampleImageLoading(false);
    setStreamedExplanation("");
    setIsExplanationStreaming(false);
  }

  async function handleClearFeedback() {
    setFeedbacks([]);
  }

  useEffect(() => {
    locateCurrentCityWeather();
  }, []);

  useEffect(() => {
    if (!selectedRecommendation || !lastSubmitted || isLoading) {
      return;
    }

    void streamExplanation(lastSubmitted, selectedRecommendation);

    return () => {
      explanationAbortRef.current?.abort();
    };
  }, [selectedRecommendation, lastSubmitted, isLoading]);

  useEffect(() => {
    setExampleImageUrl(null);
    setExampleImageError(null);
    setIsExampleImageLoading(false);
  }, [selectedRecommendation?.id]);

  if (!hasMounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[32px] border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur md:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-6">
            <span className="w-fit rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              Outfit AI Studio
            </span>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  AI 穿搭推荐工作台
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                  左侧输入用户画像，右侧展示卡片化推荐结果和动态解释
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <div className="flex items-start justify-between gap-3">
                  {currentCityWeather ? (
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">
                        {currentCityWeather.locationName}
                      </p>
                      <p>
                        {currentCityWeather.weatherLabel} · {currentCityWeather.temperature}
                        °C
                      </p>
                      <p className="text-xs text-slate-500">
                        {currentCityWeather.umbrellaNeeded
                          ? "今天可能下雨，记得带伞"
                          : "天气稳定，可按日常搭配出门"}
                      </p>
                      {hasDeniedGeolocation ? (
                        <p className="text-xs text-amber-600">
                          浏览器已拒绝定位权限
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">
                        {isLocating ? "正在自动识别当前位置天气..." : "未获取到当前城市天气"}
                      </p>
                      {hasDeniedGeolocation ? (
                        <p className="text-xs text-amber-600">
                          浏览器已拒绝定位权限
                        </p>
                      ) : null}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={locateCurrentCityWeather}
                    disabled={isLocating}
                    className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {isLocating ? "定位中..." : "重新定位"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(300px,30%)_minmax(0,70%)]">
            <aside className="space-y-6">
              <InputPanel
                form={form}
                isLoading={isLoading}
                canRegenerate={Boolean(lastSubmitted)}
                history={history}
                sceneError={sceneError}
                onSceneChange={(value) =>
                  {
                    if (value.trim()) {
                      setSceneError(null);
                    }

                    setForm((current) => ({
                      ...current,
                      scene: value,
                    }));
                  }
                }
                onStyleChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    style: value,
                  }))
                }
                onImageChange={(file) => {
                  void handleImageChange(file);
                }}
                onRemoveImage={() => {
                  setForm((current) => ({
                    ...current,
                    uploadedImage: null,
                  }));
                  setImageError(null);
                }}
                onGenerate={handleGenerate}
                onRegenerate={handleRegenerate}
                onUseHistory={(entry) =>
                  {
                    setSceneError(null);

                    setForm({
                      scene: entry.scene,
                      location: currentCityWeather?.locationName ?? form.location,
                      style: entry.style,
                      userProfile: entry.userProfile,
                      uploadedImage: null,
                    });
                  }
                }
                onClearHistory={() => {
                  void handleClearHistory();
                }}
                onClearFeedback={() => {
                  void handleClearFeedback();
                }}
                imageError={imageError}
                feedbackCount={feedbacks.length}
              />

              <UserProfilePanel
                userProfile={form.userProfile}
                onChange={(field, value) => {
                  const sanitizedValue =
                    field === "height"
                      ? value === ""
                        ? ""
                        : value.replace(/\D/g, "").slice(0, 3)
                      : field === "weight"
                        ? value === ""
                          ? ""
                          : value.replace(/\D/g, "").slice(0, 3)
                        : value;

                  setForm((current) => ({
                    ...current,
                    userProfile: {
                      ...current.userProfile,
                      [field]: sanitizedValue,
                    },
                  }));
                }}
              />
            </aside>

            <section className="space-y-6">
              <RecommendationList
                recommendations={recommendations}
                selectedId={selectedRecommendation?.id ?? null}
                isLoading={isLoading}
                onSelect={setSelectedId}
                feedbackMap={feedbackMap}
                onFeedback={handleFeedback}
              />
              <WeatherPanel weather={weather} isLoading={isLoading} />
              <ImageAnalysisPanel
                analysis={imageAnalysis}
                hasUploadedImage={Boolean(form.uploadedImage)}
                isLoading={isLoading}
              />
              <ExplanationPanel
                recommendation={selectedRecommendation}
                isLoading={isLoading}
                streamedExplanation={streamedExplanation}
                isStreaming={isExplanationStreaming}
              />
              <ExampleImagePanel
                recommendation={selectedRecommendation}
                imageUrl={exampleImageUrl}
                isLoading={isExampleImageLoading}
                error={exampleImageError}
                onGenerate={() => {
                  void handleGenerateExampleImage();
                }}
              />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
