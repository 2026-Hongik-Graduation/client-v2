"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExperienceCard, type Experience } from "./ExperienceCard";
import { Lnb } from "./Lnb";
import { Toolbar } from "./Toolbar";
import { TopPanels } from "./TopPanels";
import { ApiError, experienceApi, tagInfo, type ExperienceRecord } from "@/lib/experience-api";

function toCard(record: ExperienceRecord): Experience {
  const tag = tagInfo(record.tagCode);
  const day = record.updatedAt ? new Date(record.updatedAt).toLocaleDateString("ko-KR") : "";
  return {
    category: tag.label, bg: tag.bg, title: record.title,
    desc: record.summary || (record.status === "DRAFT" ? "답변을 작성하고 있는 경험입니다." : "경험 정리 완료"),
    updatedAt: day,
    status: record.status === "DRAFT" ? "draft" : "unlinked",
    statusLabel: record.status === "DRAFT" ? "임시 저장" : "작성 완료",
  };
}
export function ExperienceDashboard() {
  const router = useRouter();
  const [experiences, setExperiences] = useState<ExperienceRecord[]>([]);
  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    experienceApi.list({ keyword, tagCode: tag, status }).then(data => {
      if (active) { setExperiences(data); setError(""); }
    }).catch((err: unknown) => {
      if (!active) return;
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login?next=/experiences"); return;
      }
      setError(err instanceof Error ? err.message : "경험 목록을 불러오지 못했습니다.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [keyword, tag, status, revision, router]);

  const reset = () => { setDraftKeyword(""); setKeyword(""); setTag(""); setStatus(""); };
  const search = () => { setLoading(true); setKeyword(draftKeyword.trim()); setRevision(v => v + 1); };
  const setCategory = (v: string) => { setLoading(true); setTag(v); };
  const setFilterStatus = (v: string) => { setLoading(true); setStatus(v); };
  return (
    <div className="min-h-screen w-full"
      style={{ backgroundImage: "linear-gradient(132.6deg, var(--color-primary-20) 4.93%, var(--color-primary-40) 91.3%)" }}>
      <div className="flex w-full items-start gap-4 p-4 md:gap-8 md:p-8">
        <Lnb />
        <main className="flex min-w-0 flex-1 flex-col gap-8 rounded-[40px] bg-background-10 px-5 py-8 md:px-[60px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-semibold leading-[1.3] text-text-primary">경험 대시보드</h1>
              <p className="mt-2 text-[16px] text-text-secondary">지금까지 쌓아온 나의 경험이 자소서의 근거가 돼요.</p>
            </div>
            <Link href="/experiences/new" className="rounded-3xl bg-background-100 px-6 py-3 text-sm text-text-inverse">
              + 경험 추가하기
            </Link>
          </div>
          <TopPanels experiences={experiences} />
          <Toolbar keyword={draftKeyword} onKeywordChange={setDraftKeyword}
            onSearch={search} tag={tag} onTagChange={setCategory}
            status={status} onStatusChange={setFilterStatus} />
          {error && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              <p>{error}</p>
              <button type="button" onClick={() => { setLoading(true); setRevision(v => v + 1); }}
                className="mt-2 underline">다시 시도</button>
            </div>
          )}
          {!error && loading && <p role="status" className="p-8 text-text-secondary">경험을 불러오는 중...</p>}
          {!error && !loading && !experiences.length && (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-background-50 bg-background-20 p-10 text-center">
              <p className="font-semibold text-text-primary">표시할 경험이 없습니다.</p>
              <p className="text-sm text-text-secondary">새 경험을 작성하거나 검색 조건을 초기화하세요.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={reset} className="rounded-3xl border border-primary-60 px-5 py-3">필터 초기화</button>
                <Link href="/experiences/new" className="rounded-3xl bg-background-100 px-5 py-3 text-text-inverse">새 경험 작성</Link>
              </div>
            </div>
          )}
          {!error && !loading && experiences.length > 0 && (
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {experiences.map(exp => (
                <Link href={"/experiences/" + exp.id} key={exp.id}
                  aria-label={exp.title + " 상세 및 수정"} className="min-w-0 rounded-[32px] focus-visible:outline-2 focus-visible:outline-primary-60">
                  <ExperienceCard exp={toCard(exp)} />
                </Link>
              ))}
            </div>
          )}
          {!error && !loading && experiences.length === 100 && (
            <p className="text-sm text-text-secondary">최근 100개까지만 표시합니다. 검색·필터로 결과를 좁혀주세요.</p>
          )}
        </main>
      </div>
    </div>
  );
}
