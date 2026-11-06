"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { coverApi, CoverApiError, type CoverLetter } from "@/lib/cover-letter-api";
import { STAGES } from "@/lib/application-api";

export function InterviewDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    coverApi.list().then(covers => { if (active) { setItems(covers); setError(""); } })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof CoverApiError && err.status === 401) {
          router.replace("/login?next=/interviews"); return;
        }
        setError(err instanceof Error ? err.message : "자소서를 불러오지 못했습니다.");
      }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision, router]);
  const visible = useMemo(() => items.filter(item => {
    const q = query.trim().toLocaleLowerCase();
    return (!q || (item.companyName + " " + item.positionName).toLocaleLowerCase().includes(q)) &&
      (!stage || item.applicationStatus === stage);
  }), [items, query, stage]);
  const statusLabel: Record<string, string> = {
    DRAFT: "초안", IN_PROGRESS: "작성 중", COMPLETED: "작성 완료",
  };
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-7 rounded-[40px] bg-background-10 px-5 py-8 md:px-10 xl:px-[60px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-primary-60">STEP 04 · INTERVIEW</p>
          <h1 className="text-[28px] font-semibold text-text-primary">면접 준비</h1>
          <p className="mt-3 text-sm text-text-secondary md:text-base">
            지원한 회사와 자소서에 맞춘 질문으로 실전 답변을 연습해보세요.
          </p>
        </div>
        <Link href="/applications" className="rounded-3xl border border-primary-60 px-5 py-3 text-sm text-primary-60">
          지원 현황으로 →
        </Link>
      </header>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-50 to-primary-80 p-6 text-text-inverse md:p-8">
        <div className="relative z-10">
          <p className="text-lg font-semibold">면접 준비, 이미 쓴 자기소개서에서 시작해요.</p>
          <p className="mt-3 max-w-[672px] text-sm leading-6 text-primary-10">
            지원 기업을 선택하면 기본 질문과 자소서 문항을 바탕으로 연습 질문을 보여드려요.
            타이머·답변 작성·내보내기가 가능하며 AI 면접관이나 자동 평가는 아직 지원하지 않아요.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/banner-deco.png" alt=""
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-[35%] object-cover opacity-30 mix-blend-soft-light" />
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { value: items.length, label: "연습 가능한 지원 건" },
          { value: items.filter(item => item.applicationStatus === "SUBMITTED").length, label: "제출 완료" },
          { value: items.filter(item => item.status === "COMPLETED").length, label: "자소서 작성 완료" },
        ].map(stat => (
          <div key={stat.label} className="rounded-3xl border border-background-40 bg-background-30 p-5">
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-sm text-text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold">회사 선택하기</h2>
          <p className="text-xs text-text-secondary">자소서별 연습 · 최근 최대 100건</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="min-w-[190px] flex-1">
            <span className="sr-only">기업명이나 직무로 검색</span>
            <input type="search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="기업명이나 직무 검색"
              className="h-12 w-full rounded-3xl border border-background-50 bg-background-20 px-4 text-sm outline-none focus:ring-2 focus:ring-primary-60" />
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary">지원 단계
            <select value={stage} onChange={e => setStage(e.target.value)}
              className="h-12 rounded-3xl border border-background-50 bg-background-20 px-3 text-sm">
              <option value="">전체</option>
              {STAGES.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </label>
        </div>
        {loading && <p role="status" className="rounded-3xl bg-background-30 p-8 text-sm text-text-secondary">
          지원 정보를 불러오는 중...</p>}
        {error && <div role="alert" className="rounded-3xl bg-red-50 p-5 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => { setLoading(true); setRevision(n => n + 1); }}
            className="ml-3 underline">다시 불러오기</button>
        </div>}
        {!loading && !error && visible.length === 0 && (
          <div className="rounded-3xl border border-dashed border-primary-30 bg-primary-10 p-10 text-center">
            <p className="font-semibold">{items.length ? "조건에 맞는 지원 건이 없어요." : "아직 준비할 지원 건이 없어요."}</p>
            <p className="mt-2 text-sm text-text-secondary">자소서를 만들면 기업별 면접 연습을 시작할 수 있어요.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button onClick={() => { setQuery(""); setStage(""); }}
                className="rounded-3xl border border-primary-60 px-5 py-3 text-sm text-primary-60" type="button">
                필터 초기화
              </button>
              <Link href="/cover-letters/new" className="rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white">
                새 자소서 만들기
              </Link>
            </div>
          </div>
        )}
        {!loading && !error && visible.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map(item => (
              <Link key={item.id} href={"/interviews/" + item.id}
                className="flex min-h-52 flex-col justify-between rounded-3xl border border-background-50 bg-background-20 p-6 transition hover:border-primary-60 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary-60">
                <div>
                  <span className="rounded-full bg-primary-20 px-3 py-1 text-xs text-primary-60">
                    {STAGES.find(s => s.code === item.applicationStatus)?.label ?? "지원 예정"}
                  </span>
                  <p className="mt-4 text-lg font-semibold">{item.companyName}</p>
                  <p className="mt-1 text-sm text-text-secondary">{item.positionName}</p>
                </div>
                <div className="mt-6 flex items-center justify-between gap-2 text-xs text-text-secondary">
                  <span>자소서 · {statusLabel[item.status] || item.status}</span>
                  <span className="font-semibold text-primary-60">연습 시작하기 →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
