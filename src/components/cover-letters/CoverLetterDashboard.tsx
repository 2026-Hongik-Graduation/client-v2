"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { CoverApiError, coverApi, type CoverLetter } from "@/lib/cover-letter-api";
import { isPreviewMode } from "@/lib/dev-preview";

const subscribe = () => () => {};
const serverSnapshot = () => false;

const STATUS: Record<string, string> = {
  DRAFT: "초안", IN_PROGRESS: "작성 중", COMPLETED: "작성 완료",
};
export function CoverLetterDashboard() {
  const router = useRouter();
  const preview = useSyncExternalStore(subscribe, isPreviewMode, serverSnapshot);
  const [covers, setCovers] = useState<CoverLetter[]>([]);
  const [input, setInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    coverApi.list({ keyword, status }).then(items => {
      if (!active) return;
      setCovers(items); setError("");
    }).catch((err: unknown) => {
      if (!active) return;
      if (err instanceof CoverApiError && err.status === 401) {
        router.replace("/login?next=/cover-letters"); return;
      }
      setError(err instanceof Error ? err.message : "목록 조회에 실패했습니다.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [keyword, status, refresh, router]);
  function search() { setLoading(true); setKeyword(input.trim()); setRefresh(v => v + 1); }
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-7 rounded-[40px] bg-background-10 px-5 py-8 md:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">자기소개서 관리</h1>
          <p className="mt-2 text-sm text-text-secondary">기업·직무별 자기소개서와 질문, 경험을 한 곳에서 관리해요.</p>
        </div>
        <Link href="/cover-letters/new" className="rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white hover:bg-primary-80">
          + 새 자소서 만들기
        </Link>
      </header>
      {preview && (
        <p className="text-xs text-text-tertiary">
          개발 미리보기에서는 브라우저에만 임시 보관되며 EC2에 저장되지 않습니다.
        </p>
      )}
      <form onSubmit={e => { e.preventDefault(); search(); }} className="flex flex-wrap items-center gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">기업이나 직무 검색</span>
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="기업명이나 직무 검색" className="w-full rounded-3xl bg-background-30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-60" />
        </label>
        <button type="submit" className="rounded-3xl bg-background-100 px-5 py-3 text-sm text-white">검색</button>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          작성 상태
          <select value={status} onChange={e => { setLoading(true); setStatus(e.target.value); }}
            className="rounded-3xl border border-background-50 px-4 py-3">
            <option value="">전체</option><option value="DRAFT">초안</option>
            <option value="IN_PROGRESS">작성 중</option><option value="COMPLETED">작성 완료</option>
          </select>
        </label>
      </form>
      {error && <section role="alert" className="rounded-2xl bg-red-50 p-5 text-red-700">
        {error}
        <button type="button" onClick={() => { setLoading(true); setRefresh(v => v + 1); }}
          className="ml-4 underline">다시 시도</button>
      </section>}
      {!error && loading && <p className="p-6 text-sm text-text-secondary" role="status">자소서를 불러오는 중...</p>}
      {!error && !loading && covers.length === 0 && (
        <section className="rounded-3xl border border-background-50 bg-background-20 p-10 text-center">
          <h2 className="font-semibold text-text-primary">아직 표시할 자소서가 없어요</h2>
          <p className="mt-2 text-sm text-text-secondary">새 자소서를 만들거나 필터를 변경해보세요.</p>
          <div className="mt-5 flex justify-center gap-3">
            <button onClick={() => { setInput(""); setKeyword(""); setStatus(""); setRefresh(v => v + 1); }}
              className="rounded-3xl border border-primary-60 px-5 py-3 text-sm">필터 초기화</button>
            <Link href="/cover-letters/new" className="rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white">자소서 만들기</Link>
          </div>
        </section>
      )}
      {!error && !loading && covers.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {covers.map(c => (
            <Link key={c.id} href={"/cover-letters/" + c.id}
              className="flex min-h-48 flex-col justify-between gap-5 rounded-[28px] border border-background-50 bg-background-20 p-6 transition hover:border-primary-60 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary-60">
              <div>
                <span className="rounded-full bg-primary-20 px-3 py-1 text-xs text-primary-60">{STATUS[c.status] || c.status}</span>
                <h2 className="mt-4 text-lg font-semibold text-text-primary">{c.companyName}</h2>
                <p className="mt-2 text-sm text-text-secondary">{c.positionName}</p>
              </div>
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>{c.deadline ? "마감 " + c.deadline : "마감일 미등록"}</span>
                <span>{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("ko-KR") : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!error && !loading && covers.length === 100 && <p className="text-xs text-text-secondary">
        최근 100개만 표시해요. 검색 조건을 좁혀주세요.
      </p>}
    </main>
  );
}
