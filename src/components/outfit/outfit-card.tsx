"use client";

import {
  type FeedbackValue,
  type OutfitRecommendation,
} from "@/components/outfit/types";

type OutfitCardProps = {
  recommendation: OutfitRecommendation;
  selected: boolean;
  onSelect: (id: string) => void;
  feedbackValue?: FeedbackValue;
  onFeedback: (recommendation: OutfitRecommendation, value: FeedbackValue) => void;
};

export function OutfitCard({
  recommendation,
  selected,
  onSelect,
  feedbackValue,
  onFeedback,
}: OutfitCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(recommendation.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(recommendation.id);
        }
      }}
      className={`w-full rounded-3xl border p-5 text-left shadow-sm transition ${
        selected
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-black/5 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm ${selected ? "text-slate-300" : "text-slate-500"}`}>
            OutfitCard
          </p>
          <h3 className="mt-1 text-lg font-semibold">推荐搭配 {Number(recommendation.id.split("-").pop()) + 1}</h3>
        </div>
        {recommendation.score ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              selected
                ? "bg-white/15 text-white"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {recommendation.score} 分
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onFeedback(recommendation, "like");
          }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            feedbackValue === "like"
              ? selected
                ? "bg-white text-slate-900"
                : "bg-emerald-600 text-white"
              : selected
                ? "bg-white/12 text-slate-100"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          喜欢
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onFeedback(recommendation, "dislike");
          }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            feedbackValue === "dislike"
              ? selected
                ? "bg-white text-slate-900"
                : "bg-rose-600 text-white"
              : selected
                ? "bg-white/12 text-slate-100"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          不喜欢
        </button>
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className={selected ? "text-slate-300" : "text-slate-500"}>上衣</dt>
          <dd className="font-medium">{recommendation.top}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className={selected ? "text-slate-300" : "text-slate-500"}>裤子/下装</dt>
          <dd className="font-medium">{recommendation.bottom}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className={selected ? "text-slate-300" : "text-slate-500"}>鞋子</dt>
          <dd className="font-medium">{recommendation.shoes}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {recommendation.tags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full px-3 py-1 text-xs ${
              selected
                ? "bg-white/12 text-slate-100"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
