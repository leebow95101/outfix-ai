"use client";

import { useEffect, useRef, useState } from "react";

import { STYLE_OPTIONS, type OutfitFormState } from "@/components/outfit/types";

type UserProfilePanelProps = {
  userProfile: OutfitFormState["userProfile"];
  onChange: (
    field: keyof OutfitFormState["userProfile"],
    value: string
  ) => void;
};

const GENDER_OPTIONS = ["女", "男", "不限"] as const;
const FIELD_CLASS_NAME =
  "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white";

type CustomSelectProps = {
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (value: string) => void;
};

function CustomSelect({
  value,
  placeholder,
  options,
  onChange,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [value]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`${FIELD_CLASS_NAME} flex items-center justify-between text-left`}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className={`shrink-0 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          className="absolute top-full z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className="flex w-full items-center px-4 py-3 text-left text-sm text-slate-500 transition hover:bg-slate-50"
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`flex w-full items-center px-4 py-3 text-left text-sm transition hover:bg-slate-50 ${
                value === option ? "bg-slate-50 text-slate-900" : "text-slate-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function UserProfilePanel({
  userProfile,
  onChange,
}: UserProfilePanelProps) {
  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="mt-1 text-xl font-semibold text-slate-900">补充用户画像</h2>
      <p className="mt-2 text-sm text-slate-500">
        画像为可选项，用于让推荐说明更贴近真实穿搭需求。
      </p>

      <div className="mt-5 grid gap-4">
        <div className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">性别</span>
          <CustomSelect
            value={userProfile.gender}
            placeholder="请选择"
            options={GENDER_OPTIONS}
            onChange={(value) => onChange("gender", value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">身高（cm）</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={userProfile.height}
              onChange={(event) => onChange("height", event.target.value)}
              placeholder="例如 165"
              className={FIELD_CLASS_NAME}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">体重（kg）</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={userProfile.weight}
              onChange={(event) => onChange("weight", event.target.value)}
              placeholder="例如 50"
              className={FIELD_CLASS_NAME}
            />
          </label>
        </div>

        <div className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">风格偏好</span>
          <CustomSelect
            value={userProfile.preferences}
            placeholder="请选择"
            options={STYLE_OPTIONS}
            onChange={(value) => onChange("preferences", value)}
          />
        </div>
      </div>
    </section>
  );
}
