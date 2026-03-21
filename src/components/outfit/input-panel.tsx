"use client";

import Image from "next/image";
import { useState } from "react";

import { ImagePreviewModal } from "@/components/outfit/image-preview-modal";
import {
  type HistoryEntry,
  STYLE_OPTIONS,
  type OutfitFormState,
  type UploadedImage,
  type StyleOption,
} from "@/components/outfit/types";

type InputPanelProps = {
  form: OutfitFormState;
  isLoading: boolean;
  canRegenerate: boolean;
  history: HistoryEntry[];
  sceneError: string | null;
  onSceneChange: (value: string) => void;
  onStyleChange: (value: StyleOption) => void;
  onImageChange: (file: File | null) => void;
  onRemoveImage: () => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onUseHistory: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
  onClearFeedback: () => void;
  imageError: string | null;
  feedbackCount: number;
};

export function InputPanel({
  form,
  isLoading,
  canRegenerate,
  history,
  sceneError,
  onSceneChange,
  onStyleChange,
  onImageChange,
  onRemoveImage,
  onGenerate,
  onRegenerate,
  onUseHistory,
  onClearHistory,
  onClearFeedback,
  imageError,
  feedbackCount,
}: InputPanelProps) {
  const uploadedImage = form.uploadedImage as UploadedImage | null;
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">生成你的场景穿搭</h2>
        </div>
        {isLoading ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            生成中...
          </span>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">场景描述</span>
          <textarea
            value={form.scene}
            onChange={(event) => onSceneChange(event.target.value)}
            rows={4}
            placeholder="例如：周五下班后和朋友吃饭，希望舒适但有一点精致感"
            className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white ${
              sceneError
                ? "border-rose-300 bg-rose-50 focus:border-rose-400"
                : "border-slate-200 bg-slate-50 focus:border-slate-400"
            }`}
          />
          {sceneError ? (
            <p className="mt-2 text-xs text-rose-500">{sceneError}</p>
          ) : null}
        </label>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">风格选择</span>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((option) => {
              const active = option === form.style;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onStyleChange(option)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">
            图片参考（可选）
          </span>
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              onImageChange(event.dataTransfer.files?.[0] ?? null);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-5 text-center transition ${
              isDragging
                ? "border-slate-900 bg-slate-100"
                : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white"
            }`}
          >
            <span className="text-sm font-medium text-slate-700">
              上传或拖拽穿搭参考图 / 本人照片 / 衣柜单品图
            </span>
            <span className="mt-1 text-xs text-slate-500">
              支持 JPG、PNG、WEBP，建议 2MB 以内
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                onImageChange(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </label>

          {imageError ? (
            <p className="mt-2 text-xs text-rose-500">{imageError}</p>
          ) : null}

          {uploadedImage ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">已上传图片</p>
                  <p className="mt-1 text-xs text-slate-500">{uploadedImage.name}</p>
                </div>
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
                >
                  移除
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="relative mt-3 block h-36 w-full overflow-hidden rounded-xl"
              >
                <Image
                  src={uploadedImage.dataUrl}
                  alt={uploadedImage.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <span className="absolute inset-x-3 bottom-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white">
                  点击预览大图
                </span>
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? "正在生成搭配..." : "生成搭配"}
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isLoading || !canRegenerate}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            重新生成
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-slate-700">历史输入</h3>
          <span className="text-xs text-slate-400">保留最近 {history.length} 条</span>
        </div>
        {history.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {history.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onUseHistory(entry)}
                className="max-w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-slate-300 hover:bg-white"
                title={entry.scene}
              >
                <span className="mr-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {entry.style}
                </span>
                {entry.imageName ? (
                  <span className="mr-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    图像参考
                  </span>
                ) : null}
                {entry.scene}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">首次生成后，这里会保留你的最近输入。</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClearHistory}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
          >
            清空历史
          </button>
          <button
            type="button"
            onClick={onClearFeedback}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
          >
            清空反馈
          </button>
          <span className="text-xs text-slate-400">当前已记录 {feedbackCount} 条反馈</span>
        </div>
      </div>

      {uploadedImage && isPreviewOpen ? (
        <ImagePreviewModal
          isOpen={isPreviewOpen}
          title="图片预览"
          description={uploadedImage.name}
          imageUrl={uploadedImage.dataUrl}
          alt={uploadedImage.name}
          onClose={() => setIsPreviewOpen(false)}
        />
      ) : null}
    </section>
  );
}
