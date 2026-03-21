"use client";

import Image from "next/image";
import { useEffect } from "react";
import { createPortal } from "react-dom";

type ImagePreviewModalProps = {
  isOpen: boolean;
  title: string;
  imageUrl: string;
  alt?: string;
  subtitle?: string;
  description?: string;
  imageClassName?: string;
  onClose: () => void;
};

export function ImagePreviewModal({
  isOpen,
  title,
  imageUrl,
  alt,
  subtitle,
  description,
  imageClassName = "object-contain object-center",
  onClose,
}: ImagePreviewModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const scrollY = window.scrollY;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex h-dvh w-screen items-center justify-center overflow-hidden bg-slate-950/85 px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col rounded-3xl bg-white p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">{title}</p>
            {subtitle ?? description ? (
              <p className="mt-1 truncate text-xs text-slate-500">
                {subtitle ?? description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
          >
            关闭
          </button>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          <div className="relative h-full w-full">
            <Image
              src={imageUrl}
              alt={alt ?? title}
              fill
              unoptimized
              className={imageClassName}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
