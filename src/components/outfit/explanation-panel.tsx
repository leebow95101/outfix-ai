"use client";

import { type OutfitRecommendation } from "@/components/outfit/types";

type ExplanationPanelProps = {
  recommendation: OutfitRecommendation | null;
  isLoading: boolean;
  streamedExplanation: string;
  isStreaming: boolean;
};

export function ExplanationPanel({
  recommendation,
  isLoading,
  streamedExplanation,
  isStreaming,
}: ExplanationPanelProps) {
  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mt-1 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">AI 推荐解释</h2>
        </div>
        {recommendation ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {isStreaming ? "输出中..." : "当前已选"}
          </span>
        ) : null}
      </div>

      <div className="mt-5 rounded-3xl bg-slate-50 p-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-slate-200" />
          </div>
        ) : recommendation ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4">
              <h3 className="text-base font-semibold text-slate-900">
                {recommendation.top} + {recommendation.bottom}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                鞋履建议：{recommendation.shoes}
              </p>
            </div>
            <p className="text-sm leading-7 text-slate-700">
              {streamedExplanation || recommendation.explanation}
              {isStreaming ? (
                <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-slate-400 align-middle" />
              ) : null}
            </p>
          </div>
        ) : (
          <p className="text-sm leading-7 text-slate-500">
            当前还没有选中的搭配。生成结果后，默认会展示第一套方案的解释。
          </p>
        )}
      </div>
    </section>
  );
}
