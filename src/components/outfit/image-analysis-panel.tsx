"use client";

import { type ImageAnalysis } from "@/components/outfit/types";

type ImageAnalysisPanelProps = {
  analysis: ImageAnalysis | null;
  hasUploadedImage: boolean;
  isLoading: boolean;
};

export function ImageAnalysisPanel({
  analysis,
  hasUploadedImage,
  isLoading,
}: ImageAnalysisPanelProps) {
  if (!hasUploadedImage && !analysis) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">ImageAnalysisPanel</p>
      <div className="mt-1">
        <h2 className="text-xl font-semibold text-slate-900">图片分析结果</h2>
        <p className="mt-2 text-sm text-slate-500">
          展示模型从上传图片中识别到的关键穿搭线索。
        </p>
      </div>

      <div className="mt-5 rounded-3xl bg-slate-50 p-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
          </div>
        ) : analysis ? (
          <div className="space-y-4 text-sm text-slate-700">
            <p className="leading-7">{analysis.summary}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-medium text-slate-500">识别风格</p>
                <p className="mt-2 font-medium text-slate-900">{analysis.detectedStyle}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-medium text-slate-500">场景线索</p>
                <p className="mt-2 font-medium text-slate-900">{analysis.sceneHint}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-medium text-slate-500">识别颜色</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.colors.length > 0 ? (
                  analysis.colors.map((color) => (
                    <span
                      key={color}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                    >
                      {color}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">暂无明显颜色线索</span>
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-medium text-slate-500">识别单品</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.items.length > 0 ? (
                  analysis.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">暂无明显单品线索</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-7 text-slate-500">
            已上传图片，但当前还没有可展示的分析结果。
          </p>
        )}
      </div>
    </section>
  );
}
