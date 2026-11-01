"use client";

import Link from "next/link";
import { useState } from "react";

const STEPS = ["채용 공고 입력", "기업 분석", "문항 작성", "자소서 작성"];

function Stepper() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((label, i) => {
        const active = i === 0;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {active && (
                <span className="flex size-4 items-center justify-center overflow-hidden rounded-full bg-primary-60">
                  <span className="text-center text-[11px] leading-[1.3] tracking-[0.165px] text-text-inverse">
                    1
                  </span>
                </span>
              )}
              <span
                className={`whitespace-nowrap text-[12px] font-semibold leading-[1.35] tracking-[0.12px] ${
                  active ? "text-primary-60" : "text-text-tertiary"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="block h-px w-[27px] bg-grayscale-40" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="flex w-full min-w-[320px] flex-1 items-center gap-3">
      <span className="shrink-0 text-[14px] font-semibold leading-[1.45] tracking-[0.07px] text-text-secondary">
        {label}
      </span>
      <input
        type="text"
        placeholder={placeholder}
        className="h-12 min-w-0 flex-1 rounded-[24px] bg-background-30 px-4 py-3 text-[16px] font-normal leading-[1.6] text-text-primary placeholder:text-text-tertiary focus:outline-none"
      />
    </div>
  );
}

function DateField() {
  return (
    <div className="flex w-full min-w-[320px] flex-1 items-center gap-3">
      <span className="shrink-0 text-[14px] font-semibold leading-[1.45] tracking-[0.07px] text-text-secondary">
        마감일
      </span>
      <div className="flex h-12 min-w-0 flex-1 items-center justify-between rounded-[24px] bg-background-30 px-4 py-3">
        <input
          type="text"
          placeholder="마감일을 입력해주세요"
          className="min-w-0 flex-1 bg-transparent text-[16px] font-normal leading-[1.6] text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
        <span className="block size-6 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/icon-calendar.svg" alt="" className="h-full w-full" />
        </span>
      </div>
    </div>
  );
}

export function NewCoverLetterForm() {
  const [tab, setTab] = useState<"link" | "text">("link");

  return (
    <main className="flex min-h-[836px] min-w-0 flex-1 flex-col items-end gap-8 self-stretch rounded-[40px] bg-background-10 px-6 py-8 md:px-[60px]">
      <div className="flex w-full flex-1 flex-col gap-10">
        {/* Header */}
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full items-end justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start gap-3">
                <Link href="/" className="block size-6 shrink-0" aria-label="뒤로">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/figma/icon-back.svg" alt="" className="h-full w-full" />
                </Link>
                <p className="text-[18px] font-bold leading-[1.45] tracking-[-0.09px] text-text-primary">
                  새 자소서 만들기
                </p>
              </div>
              <p className="text-[16px] font-normal leading-[1.6] text-text-secondary">
                채용공고를 입력하면, 자소서 작성에 필요한 기업 분석 결과를 확인할 수 있어요.
              </p>
            </div>
            <button
              type="button"
              disabled
              className="flex h-12 shrink-0 cursor-not-allowed items-center justify-center rounded-[24px] bg-background-70 px-6 py-3"
            >
              <span className="whitespace-nowrap text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-disabled">
                다음단계로 →
              </span>
            </button>
          </div>
          <Stepper />
        </div>

        {/* Body */}
        <div className="flex w-full flex-1 flex-col gap-6">
          {/* Mode tabs */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setTab("link")}
              className={`flex h-12 items-center justify-center rounded-[24px] px-6 py-3 text-[14px] font-medium leading-[1.55] tracking-[0.07px] ${
                tab === "link"
                  ? "bg-primary-80 text-text-inverse"
                  : "bg-background-50 text-text-secondary"
              }`}
            >
              링크 붙여넣기
            </button>
            <button
              type="button"
              onClick={() => setTab("text")}
              className={`flex h-12 items-center justify-center rounded-[24px] px-6 py-3 text-[14px] font-medium leading-[1.55] tracking-[0.07px] ${
                tab === "text"
                  ? "bg-primary-80 text-text-inverse"
                  : "bg-background-50 text-text-secondary"
              }`}
            >
              텍스트 붙여넣기
            </button>
          </div>

          {/* Upload card */}
          <div className="flex w-full flex-col items-center rounded-3xl border border-background-50 bg-background-20 px-6 py-12">
            <div className="flex w-full flex-col items-center gap-8">
              <div className="flex w-full flex-col items-center gap-6">
                <div className="flex w-full flex-col gap-3">
                  <h2 className="w-full text-center text-[24px] font-semibold leading-[1.35] tracking-[-0.24px] text-text-primary">
                    {tab === "link" ? "링크 붙여넣기" : "텍스트 붙여넣기"}
                  </h2>
                  <p className="w-full text-center text-[16px] font-normal leading-[1.6] text-text-secondary">
                    {tab === "link"
                      ? "기업 정보를 입력하고 채용 공고 링크를 붙여넣기 해주세요."
                      : "기업 정보를 입력하고 채용 공고 내용을 붙여넣기 해주세요."}
                  </p>
                </div>

                {/* Company info fields */}
                <div className="flex w-full flex-wrap content-center items-center gap-3 rounded-3xl border border-background-50 bg-background-20 px-6 py-12">
                  <Field label="기업명" placeholder="ex) 토스뱅크" />
                  <Field label="직무명" placeholder="ex) 백엔드 개발자" />
                  <DateField />
                </div>

                {/* Link / text input */}
                {tab === "link" ? (
                  <div className="flex h-[72px] w-full items-center gap-3 rounded-full bg-background-40 px-6 py-3">
                    <input
                      type="text"
                      placeholder="링크를 붙여 넣으세요"
                      className="h-[42px] min-w-0 flex-1 bg-transparent text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
                    />
                    <button
                      type="button"
                      className="flex h-12 w-[90px] shrink-0 items-center justify-center rounded-[24px] bg-primary-80 px-4 py-3"
                    >
                      <span className="whitespace-nowrap text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-inverse">
                        입력 →
                      </span>
                    </button>
                  </div>
                ) : (
                  <textarea
                    rows={5}
                    placeholder="채용 공고 내용을 붙여 넣으세요"
                    className="w-full resize-none rounded-3xl bg-background-40 px-6 py-4 text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
