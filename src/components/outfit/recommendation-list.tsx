"use client";

import { OutfitCard } from "@/components/outfit/outfit-card";
import {
  type FeedbackValue,
  type OutfitRecommendation,
} from "@/components/outfit/types";

type RecommendationListProps = {
  recommendations: OutfitRecommendation[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  feedbackMap: Record<string, FeedbackValue | undefined>;
  onFeedback: (recommendation: OutfitRecommendation, value: FeedbackValue) => void;
};

export function RecommendationList({
  recommendations,
  selectedId,
  isLoading,
  onSelect,
  feedbackMap,
  onFeedback,
}: RecommendationListProps) {
  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">推荐结果</h2>
        </div>
        <span className="text-sm text-slate-500">
          {recommendations.length > 0 ? `${recommendations.length} 套方案` : "等待生成"}
        </span>
      </div>

      {isLoading ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-3xl border border-slate-100 bg-slate-50"
            />
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {recommendations.map((recommendation) => (
            <OutfitCard
              key={recommendation.id}
              recommendation={recommendation}
              selected={recommendation.id === selectedId}
              onSelect={onSelect}
              feedbackValue={feedbackMap[recommendation.id]}
              onFeedback={onFeedback}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          输入场景并点击“生成搭配”后，这里会展示卡片化推荐结果。
        </div>
      )}
    </section>
  );
}
