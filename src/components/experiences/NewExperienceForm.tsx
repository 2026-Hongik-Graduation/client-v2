"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, experienceApi, TAGS as API_TAGS } from "@/lib/experience-api";

const TAGS = [
  { title: "STAR", sub: "순서대로 정리" },
  { title: "성장·가치관", sub: "나를 만든 경험" },
  { title: "장단점", sub: "강점과 보완 경험" },
  { title: "협업", sub: "함께 해결한 경험" },
  { title: "학업·직무", sub: "직무와 연결된 경험" },
  { title: "도전·극복", sub: "어려움 극복 경험" },
];

const METHODS = [
  {
    title: "대화형 정리",
    sub: "AI 가이드 질문에 답하며 자연스럽게 STAR 구조를 완성해요.",
    icon: "/figma/icon-chat.svg",
  },
  {
    title: "빠르게 작성하기",
    sub: "이미 정리된 내용이 있다면, 태그별 폼에 바로 입력해요.",
    icon: "/figma/icon-note.svg",
  },
  {
    title: "가져오기",
    sub: "Notion이나 PDF에 정리해둔 내용을 그대로 불러와요.",
    icon: "/figma/icon-download.svg",
  },
];

function StepBadge({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-center rounded-[24px] bg-primary-20 px-3 py-1">
        <span className="text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-primary-60">
          {n}
        </span>
      </span>
      <p className="whitespace-nowrap text-[16px] font-semibold leading-[1.5] text-primary-60">
        {label}
      </p>
    </div>
  );
}

export function NewExperienceForm() {
  const [tag, setTag] = useState(0);
  const [method, setMethod] = useState(1);
  const [title, setTitle] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function next() {
    if (pending) return;
    setError("");
    if (!title.trim()) { setError("경험 제목을 입력해 주세요."); return; }
    if (title.trim().length > 150) { setError("제목은 150자 이하여야 합니다."); return; }
    if (startedAt && endedAt && endedAt < startedAt) {
      setError("종료일은 시작일보다 빠를 수 없습니다."); return;
    }
    if (method !== 1) {
      setError("AI 대화형과 가져오기는 준비 중입니다. '빠르게 작성하기'를 선택해 주세요.");
      return;
    }
    setPending(true);
    try {
      const experience = await experienceApi.create({
        title: title.trim(), tagCode: API_TAGS[tag].code, creationMethod: "QUICK",
        startedAt: startedAt || null, endedAt: endedAt || null,
      });
      router.push("/experiences/" + experience.id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.replace("/login?next=/experiences/new");
      else setError(err instanceof Error ? err.message : "경험 생성에 실패했습니다.");
      setPending(false);
    }
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col items-end gap-8 self-stretch rounded-[40px] bg-background-10 px-6 py-8 md:px-[60px]">
      <div className="flex w-full flex-col items-start gap-10">
        {/* Header */}
        <div className="flex w-full items-end justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <h1 className="text-[28px] font-semibold leading-[1.3] tracking-[-0.28px] text-text-primary">
              경험 추가하기
            </h1>
            <p className="text-[16px] font-normal leading-[1.6] text-text-secondary">
              제목과 경험 태그를 정한 뒤, 어떤 방식으로 정리할지 선택하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={next}
            disabled={pending}
            className="flex h-12 shrink-0 items-center justify-center rounded-[24px] bg-background-100 px-6 py-3 disabled:opacity-50"
          >
            <span className="whitespace-nowrap text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-inverse">
              {pending ? "저장 중..." : "다음단계로 →"}
            </span>
          </button>
        </div>

        {error && <p role="alert" className="w-full rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex w-full flex-col items-start gap-10">
          {/* Step 1 */}
          <div className="flex w-full flex-col items-start gap-3">
            <StepBadge n={1} label="경험 기본 정보 입력" />

            <div className="flex w-full flex-col gap-8">
              {/* Title + period */}
              <div className="flex w-full flex-col justify-center rounded-3xl border border-background-50 bg-background-20 px-6 py-8">
                <div className="flex w-full flex-wrap content-center items-start gap-8">
                  <div className="flex min-w-[260px] flex-1 flex-col items-start gap-2">
                    <label className="w-full text-[14px] font-semibold leading-[1.45] tracking-[0.07px] text-text-primary">
                      경험 제목
                    </label>
                    <input
                      type="text"
                      maxLength={150}
                      required
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="경험 제목을 입력해주세요."
                      className="h-12 w-full rounded-[24px] bg-background-30 px-4 py-3 text-[16px] font-normal leading-[1.6] text-text-primary placeholder:text-text-tertiary focus:outline-none"
                    />
                  </div>
                  <div className="flex min-w-[260px] flex-1 flex-col items-start gap-2">
                    <label className="w-full text-[14px] font-semibold leading-[1.45] tracking-[0.07px] text-text-primary">
                      기간
                    </label>
                    <div className="flex h-12 w-full items-center justify-between rounded-[24px] bg-background-30 px-4 py-3">
                      <input type="date" aria-label="경험 시작일" value={startedAt}
                        onChange={(event) => setStartedAt(event.target.value)}
                        className="min-w-0 w-1/2 flex-1 bg-transparent text-sm text-text-primary focus:outline-none" />
                      <span className="px-1 text-sm text-text-secondary">~</span>
                      <input type="date" aria-label="경험 종료일" value={endedAt}
                        onChange={(event) => setEndedAt(event.target.value)}
                        className="min-w-0 w-1/2 flex-1 bg-transparent text-sm text-text-primary focus:outline-none" />
                      <span className="block size-6 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/figma/icon-calendar.svg" alt="" className="h-full w-full" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tag selection */}
              <div className="flex w-full flex-col items-start justify-center gap-4 rounded-3xl border border-background-50 bg-background-20 px-6 py-8">
                <div className="flex flex-col items-start gap-1">
                  <p className="text-[14px] font-semibold leading-[1.45] tracking-[0.07px] text-text-primary">
                    태그를 하나 선택하세요.
                  </p>
                  <p className="text-[14px] font-normal leading-[1.55] tracking-[0.07px] text-text-tertiary">
                    태그는 단일선택입니다.
                  </p>
                </div>
                <div className="flex w-full flex-wrap content-center items-center gap-4">
                  {TAGS.map((t, i) => {
                    const active = tag === i;
                    return (
                      <button
                        key={t.title}
                        type="button"
                        onClick={() => setTag(i)}
                        aria-pressed={active}
                        className={`flex h-[88px] w-[160px] flex-col items-start rounded-2xl px-6 py-4 text-left drop-shadow-[0px_0px_15px_rgba(15,51,47,0.15)] transition-colors ${
                          active
                            ? "border-transparent"
                            : "border-[0.8px] border-background-40 bg-background-20"
                        }`}
                        style={
                          active
                            ? {
                                backgroundImage:
                                  "linear-gradient(124.53deg, var(--color-primary-50) 6.2%, var(--color-primary-80) 84.76%)",
                              }
                            : undefined
                        }
                      >
                        <div className="flex w-full flex-col gap-2">
                          <span
                            className={`w-full text-[18px] font-bold leading-[1.45] tracking-[-0.09px] ${
                              active ? "text-text-inverse" : "text-text-primary"
                            }`}
                          >
                            {t.title}
                          </span>
                          <span
                            className={`w-full text-[14px] font-normal leading-[1.55] tracking-[0.07px] ${
                              active ? "text-text-disabled" : "text-text-secondary"
                            }`}
                          >
                            {t.sub}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex w-full flex-col items-start gap-3">
            <StepBadge n={2} label="경험 작성 방식 선택" />

            <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-stretch">
              {METHODS.map((m, i) => {
                const active = method === i;
                return (
                  <div
                    key={m.title}
                    className={`flex min-h-[280px] flex-1 flex-col items-end justify-between gap-6 rounded-3xl px-8 py-6 drop-shadow-[0px_0px_15px_rgba(15,51,47,0.15)] ${
                      active ? "" : "border border-background-40 bg-background-20"
                    }`}
                    style={
                      active
                        ? {
                            backgroundImage:
                              "linear-gradient(114.5deg, var(--color-primary-50) 6.2%, var(--color-primary-80) 84.76%)",
                          }
                        : undefined
                    }
                  >
                    <div className="flex w-full flex-col items-start gap-6">
                      <div
                        className="flex size-16 items-center justify-center rounded-[12px]"
                        style={{
                          backgroundImage:
                            "linear-gradient(153.77deg, rgba(252,252,252,0.7) 10.1%, rgba(188,230,225,0.7) 95.85%)",
                        }}
                      >
                        <span className="block size-8">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.icon} alt="" className="h-full w-full" />
                        </span>
                      </div>
                      <div className="flex w-full flex-col items-start gap-2">
                        <p
                          className={`w-full text-[18px] font-bold leading-[1.45] tracking-[-0.09px] ${
                            active ? "text-text-inverse" : "text-text-primary"
                          }`}
                        >
                          {m.title}
                        </p>
                        <p
                          className={`w-full text-[14px] font-normal leading-[1.55] tracking-[0.07px] ${
                            active ? "text-text-disabled" : "text-text-secondary"
                          }`}
                        >
                          {m.sub}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMethod(i)}
                      aria-pressed={active}
                      className={`flex h-12 items-center justify-center rounded-[24px] px-4 py-3 ${
                        active ? "bg-primary-60" : "bg-primary-20"
                      }`}
                    >
                      <span
                        className={`whitespace-nowrap text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] ${
                          active ? "text-text-inverse" : "text-status-success"
                        }`}
                      >
                        선택하기 →
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
