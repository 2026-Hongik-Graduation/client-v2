"use client";

import { TAGS } from "@/lib/experience-api";

type Props = {
  keyword: string; onKeywordChange: (value: string) => void;
  onSearch: () => void; tag: string; onTagChange: (value: string) => void;
  status: string; onStatusChange: (value: string) => void;
};
export function Toolbar({ keyword, onKeywordChange, onSearch, tag, onTagChange, status, onStatusChange }: Props) {
  return (
    <div className="flex w-full flex-col gap-4">
      <form onSubmit={event => { event.preventDefault(); onSearch(); }}
        className="flex w-full flex-wrap items-center gap-3">
        <label className="flex h-12 min-w-0 flex-[2_1_230px] items-center gap-3 rounded-[30px] bg-background-40 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/icon-search.svg" alt="" className="size-5" />
          <span className="sr-only">경험 검색어</span>
          <input type="search" value={keyword} onChange={e => onKeywordChange(e.target.value)}
            placeholder="경험 제목이나 요약 검색..." className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none" />
        </label>
        <button type="submit" className="h-12 rounded-3xl bg-background-100 px-6 text-sm text-text-inverse">검색하기</button>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <span>상태</span>
          <select value={status} onChange={e => onStatusChange(e.target.value)}
            className="h-12 rounded-3xl border border-background-50 bg-background-20 px-4">
            <option value="">전체</option>
            <option value="DRAFT">임시저장</option>
            <option value="COMPLETED">작성 완료</option>
          </select>
        </label>
      </form>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="경험 태그 필터">
        {[{ code: "", label: "전체" }, ...TAGS].map(item => (
          <button type="button" key={item.code} onClick={() => onTagChange(item.code)}
            aria-pressed={tag === item.code}
            className={`rounded-3xl px-4 py-2 text-sm ${tag === item.code
              ? "bg-primary-60 text-text-inverse" : "bg-background-50 text-text-secondary"}`}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
