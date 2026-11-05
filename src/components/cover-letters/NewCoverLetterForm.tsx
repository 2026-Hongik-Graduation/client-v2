"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { coverApi } from "@/lib/cover-letter-api";

const steps = ["채용 공고 입력", "문항 작성", "경험 연결", "자소서 저장"];
export function NewCoverLetterForm() {
  const router = useRouter();
  const [tab, setTab] = useState<"link" | "text">("link");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [deadline, setDeadline] = useState("");
  const [url, setUrl] = useState("");
  const [jdOriginal, setJdOriginal] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    if (!company.trim() || !position.trim()) {
      setError("기업명과 지원 직무는 필수입니다."); return;
    }
    if (company.trim().length > 150 || position.trim().length > 150) {
      setError("기업명과 직무명은 각각 150자를 넘을 수 없습니다."); return;
    }
    if (tab === "link" && url.trim()) {
      try {
        const parsed = new URL(url.trim());
        if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password)
          throw new Error("invalid");
      } catch { setError("http:// 또는 https:// 형식의 채용공고 링크만 사용할 수 있어요."); return; }
      if (url.trim().length > 2048) { setError("링크는 2048자를 넘을 수 없습니다."); return; }
    }
    if (tab === "text" && jdOriginal.length > 100000) {
      setError("공고 원문은 100,000자까지만 입력할 수 있습니다."); return;
    }
    setPending(true);
    try {
      const created = await coverApi.create({
        companyName: company.trim(), positionName: position.trim(),
        deadline: deadline || null, jdUrl: tab === "link" ? (url.trim() || null) : null,
      });
      let postingFailed = false;
      if ((tab === "text" && jdOriginal.trim()) || (tab === "link" && url.trim())) {
        try {
          await coverApi.savePosting(created.id, {
            url: tab === "link" ? url.trim() : null,
            jdOriginal: tab === "text" ? jdOriginal.trim() : null,
            qualifications: null, preferences: null, hiringProcess: null,
          });
        } catch { postingFailed = true; }
      }
      router.replace("/cover-letters/" + created.id + (postingFailed ? "?posting=failed" : ""));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "자소서 생성에 실패했습니다.");
      setPending(false);
    }
  }
  const field = "min-w-0 w-full rounded-[24px] bg-background-30 px-4 py-3 text-base text-text-primary outline-none focus:ring-2 focus:ring-primary-60";
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-8 rounded-[40px] bg-background-10 p-5 md:p-10 xl:px-[60px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link href="/cover-letters" className="text-sm text-primary-60 underline">← 자소서 목록</Link>
          <h1 className="text-[28px] font-semibold text-text-primary">새 자소서 만들기</h1>
          <p className="text-sm text-text-secondary">
            기업 정보와 채용공고를 먼저 저장하고, 자소서 문항 및 경험을 연결하세요.
          </p>
        </div>
        <span className="rounded-3xl bg-primary-20 px-4 py-2 text-xs text-primary-70">1/4 · 기본 정보</span>
      </div>
      <div className="flex flex-wrap items-center gap-2" aria-label="작성 단계">
        {steps.map((step, i) => (
          <span key={step} className={`rounded-3xl px-3 py-2 text-xs ${i === 0
            ? "bg-primary-60 text-white" : "bg-background-30 text-text-tertiary"}`}>
            {i + 1}. {step}
          </span>
        ))}
      </div>
      <form onSubmit={save} className="flex w-full flex-col gap-7">
        <section className="grid gap-5 rounded-3xl border border-background-50 bg-background-20 p-5 md:grid-cols-2 md:p-8">
          <label className="flex flex-col gap-2 text-sm font-semibold">
            기업명 <span className="text-red-600">*</span>
            <input required maxLength={150} value={company} onChange={e => setCompany(e.target.value)}
              placeholder="ex) 토스뱅크" className={field} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            직무명 <span className="text-red-600">*</span>
            <input required maxLength={150} value={position} onChange={e => setPosition(e.target.value)}
              placeholder="ex) 백엔드 개발자" className={field} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold md:col-span-2">
            마감일 (선택)
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={field} />
          </label>
        </section>
        <section className="rounded-3xl border border-background-50 bg-background-20 p-5 md:p-8">
          <h2 className="mb-4 text-lg font-semibold">채용공고 입력 (선택)</h2>
          <div className="mb-5 flex flex-wrap gap-3">
            <button type="button" aria-pressed={tab === "link"} onClick={() => setTab("link")}
              className={`rounded-3xl px-5 py-3 text-sm ${tab === "link" ? "bg-primary-80 text-white" : "bg-background-50 text-text-secondary"}`}>
              링크 붙여넣기
            </button>
            <button type="button" aria-pressed={tab === "text"} onClick={() => setTab("text")}
              className={`rounded-3xl px-5 py-3 text-sm ${tab === "text" ? "bg-primary-80 text-white" : "bg-background-50 text-text-secondary"}`}>
              텍스트 붙여넣기
            </button>
          </div>
          {tab === "link" ? (
            <label className="flex flex-col gap-2 text-sm font-semibold">
              채용공고 URL
              <input type="url" value={url} onChange={e => setUrl(e.target.value)} maxLength={2048}
                placeholder="https://example.com/jobs/123" className={field} />
            </label>
          ) : (
            <label className="flex flex-col gap-2 text-sm font-semibold">
              채용공고 원문
              <textarea rows={9} maxLength={100000} value={jdOriginal}
                onChange={e => setJdOriginal(e.target.value)}
                placeholder="채용공고의 주요 업무, 자격요건 등을 붙여 넣으세요."
                className={field} />
              <span className="text-right text-xs font-normal text-text-tertiary">{jdOriginal.length}/100000자</span>
            </label>
          )}
          <p className="mt-4 text-xs text-text-secondary">
            지금은 원문만 저장합니다. 기업 분석과 AI 초안 생성은 후속 단계에서 연결합니다.
          </p>
        </section>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={pending}
            className="rounded-3xl bg-background-100 px-7 py-3 text-sm text-white disabled:opacity-50">
            {pending ? "저장 중..." : "저장하고 문항 작성하기 →"}
          </button>
        </div>
      </form>
    </main>
  );
}
