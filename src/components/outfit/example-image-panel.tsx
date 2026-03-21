"use client";

import Image from "next/image";
import { useState } from "react";

import { ImagePreviewModal } from "@/components/outfit/image-preview-modal";
import { type OutfitRecommendation } from "@/components/outfit/types";

type ExampleImagePanelProps = {
  recommendation: OutfitRecommendation | null;
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
};

export function ExampleImagePanel({
  recommendation,
  imageUrl,
  isLoading,
  error,
  onGenerate,
}: ExampleImagePanelProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">穿搭示例图</h2>
          <p className="mt-2 text-sm text-slate-500">
            基于当前选中的搭配，调用 Wanx 生成一张视觉示意图。
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!recommendation || isLoading}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {isLoading ? "生成中..." : "生成示例图"}
        </button>
      </div>

      <div className="mt-5 rounded-3xl bg-slate-50 p-5">
        {!recommendation ? (
          <p className="text-sm leading-7 text-slate-500">
            当前还没有可用于生成示例图的搭配，请先生成并选择一套穿搭。
          </p>
        ) : isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-200" />
          </div>
        ) : imageUrl ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-sm font-medium text-slate-900">
                {recommendation.top} + {recommendation.bottom} + {recommendation.shoes}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                该示例图用于辅助理解整体风格与单品组合效果。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="relative block h-[26rem] w-full overflow-hidden rounded-2xl bg-white text-left"
            >
              <Image
                src={imageUrl}
                alt={`${recommendation.top}-${recommendation.bottom} 穿搭示例图`}
                fill
                unoptimized
                className="object-cover"
              />
              <span className="absolute inset-x-3 bottom-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white">
                点击预览大图
              </span>
            </button>
          </div>
        ) : (
          <p className="text-sm leading-7 text-slate-500">
            当前还没有生成示例图。你可以基于已选搭配点击上方按钮生成。
          </p>
        )}

        {error ? (
          <p className="mt-4 text-sm text-rose-500">{error}</p>
        ) : null}
      </div>

      {recommendation && imageUrl ? (
        <ImagePreviewModal
          isOpen={isPreviewOpen}
          title="穿搭示例图预览"
          description={`${recommendation.top} + ${recommendation.bottom} + ${recommendation.shoes}`}
          imageUrl={imageUrl}
          alt={`${recommendation.top}-${recommendation.bottom} 穿搭示例图`}
          onClose={() => setIsPreviewOpen(false)}
        />
      ) : null}
    </section>
  );
}
