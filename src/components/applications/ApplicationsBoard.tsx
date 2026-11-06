"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationDetailPanel } from "./ApplicationDetailPanel";
import { applicationApi, ApplicationApiError, STAGES, type Board, type Stage } from "@/lib/application-api";
import { coverApi, type CoverLetter } from "@/lib/cover-letter-api";

const statConfig = [
  { label: "미제출", icon: "/figma/icon-stat-doc.svg",
    gradient: "linear-gradient(-38.11deg, var(--color-primary-50) 5.49%, var(--color-primary-30) 87.93%)" },
  { label: "마감임박", icon: "/figma/icon-stat-urgent.svg",
    gradient: "linear-gradient(-28.35deg, var(--color-status-error) 2.49%, var(--color-grayscale-30) 91.86%)" },
  { label: "제출완료", icon: "/figma/icon-stat-done.svg",
    gradient: "linear-gradient(140deg, var(--color-primary-50) 0%, var(--color-primary-80) 92.67%)" },
  { label: "전체 지원", icon: "/figma/icon-stat-total.svg",
    gradient: "linear-gradient(143.13deg, var(--color-background-60) 6.12%, var(--color-background-80) 95.41%)" },
] as const;
function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const [y, m, d] = deadline.split("-").map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  return Math.round((Date.UTC(y, m - 1, d) -
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
}
function StatCard({ label, icon, gradient, value }: {
  label: string; icon: string; gradient: string; value: number;
}) {
  return (
    <div className="flex min-w-[190px] flex-1 items-center gap-4 rounded-3xl border border-background-40 bg-background-30 px-5 py-4">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl p-4"
        style={{ backgroundImage: gradient }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt="" className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-semibold text-text-primary">{value}</p>
        <p className="text-sm text-text-secondary">{label}</p>
      </div>
    </div>
  );
}
function Banner() {
  return (
    <div className="relative overflow-hidden rounded-3xl px-5 py-4 md:px-6"
      style={{ backgroundImage: "linear-gradient(91.59deg, var(--color-primary-50) 4.44%, var(--color-primary-80) 86.28%)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/banner-deco.png" alt=""
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[40%] object-cover opacity-50 mix-blend-soft-light" />
      <div className="relative flex flex-wrap items-center gap-4 md:gap-8">
        <div className="hidden size-16 shrink-0 items-center justify-center rounded-xl bg-white/60 sm:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/icon-banner.svg" alt="" className="size-[42px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-text-inverse">오늘 있었던 일도 좋은 경험이 될 수 있어요</p>
          <p className="mt-2 text-sm text-text-disabled">
            거창하지 않아도 괜찮아요. 포핏과 함께 경험을 정리해보세요.
          </p>
        </div>
        <Link href="/experiences/new"
          className="shrink-0 rounded-3xl bg-background-10 px-4 py-3 text-sm font-medium text-primary-60 hover:opacity-90">
          새 경험 추가하기 →
        </Link>
      </div>
    </div>
  );
}
function CalendarView({ items, onOpen, month, setMonth }: {
  items: CoverLetter[]; onOpen: (id: string) => void;
  month: Date; setMonth: (date: Date) => void;
}) {
  const year = month.getFullYear(), m = month.getMonth();
  const firstDay = new Date(year, m, 1).getDay();
  const days = new Date(year, m + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + days) / 7) * 7 },
    (_, i) => i - firstDay + 1);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return (
    <section aria-label="지원 일정 캘린더" className="rounded-3xl border border-background-50 bg-background-20 p-3 md:p-6">
      <div className="mb-5 flex items-center justify-center gap-5">
        <button type="button" onClick={() => setMonth(new Date(year, m - 1, 1))}
          aria-label="이전 달" className="rounded-xl border border-background-50 px-3 py-2">〈</button>
        <h2 className="font-semibold">{year}년 {m + 1}월</h2>
        <button type="button" onClick={() => setMonth(new Date(year, m + 1, 1))}
          aria-label="다음 달" className="rounded-xl border border-background-50 px-3 py-2">〉</button>
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {weekdays.map(day => (
          <div key={day} className="pb-2 text-center text-xs font-semibold text-text-secondary">{day}</div>
        ))}
        {cells.map((day, i) => {
          const date = day >= 1 && day <= days
            ? year + "-" + String(m + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0") : "";
          const due = date ? items.filter(item => item.deadline === date) : [];
          return (
            <div key={i} className={`min-h-[72px] rounded-xl border p-1.5 md:min-h-[112px] md:p-2 ${date
              ? "border-background-50 bg-background-10" : "border-transparent bg-background-30/50"}`}>
              {date && <p className="text-xs font-medium text-text-secondary">{day}</p>}
              {due.slice(0, 2).map(item => (
                <button key={item.id} type="button" onClick={() => onOpen(item.id)}
                  title={item.companyName + " " + item.positionName}
                  className="mt-1 block w-full truncate rounded-md bg-primary-20 px-1.5 py-1 text-left text-[10px] text-primary-70">
                  {item.companyName}
                </button>
              ))}
              {due.length > 2 && <p className="mt-1 text-[10px] text-primary-60">+{due.length - 2}개</p>}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-text-secondary">
        마감일이 있는 지원 카드만 표시돼요. 카드를 눌러 상세 일정을 수정할 수 있습니다.
      </p>
    </section>
  );
}

export function ApplicationsBoard() {
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [deadline, setDeadline] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "">("");
  const [view, setView] = useState<"board" | "calendar">("board");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    const result = await applicationApi.board();
    setBoard(result); return result;
  }, []);
  useEffect(() => {
    let active = true;
    applicationApi.board().then(result => {
      if (active) { setBoard(result); setError(""); }
    }).catch((err: unknown) => {
      if (!active) return;
      if (err instanceof ApplicationApiError && err.status === 401) {
        router.replace("/login?next=/applications"); return;
      }
      setError(err instanceof Error ? err.message : "지원 현황을 불러오지 못했습니다.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision, router]);

  const all = useMemo(() => board ? STAGES.flatMap(s => board.columns[s.code] || []) : [], [board]);
  const visible = useMemo(() => all.filter(item => {
    const keyword = search.trim().toLocaleLowerCase();
    return (!keyword || (item.companyName + " " + item.positionName).toLocaleLowerCase().includes(keyword)) &&
      (!stageFilter || item.applicationStatus === stageFilter);
  }), [all, search, stageFilter]);
  const selectedCover = selected ? all.find(item => item.id === selected) : null;
  const stats = [
    all.filter(a => a.applicationStatus === "PLANNED" || a.applicationStatus === "PREPARING").length,
    all.filter(a => a.applicationStatus !== "CLOSED" &&
      (daysUntil(a.deadline) ?? -1) >= 0 && (daysUntil(a.deadline) ?? 100) <= 3).length,
    all.filter(a => a.applicationStatus === "SUBMITTED").length,
    all.length,
  ];
  async function move(id: string, next: Stage) {
    const old = all.find(item => item.id === id);
    if (busyId || !old || old.applicationStatus === next) return;
    setBusyId(id); setError(""); setNotice("");
    try {
      const updated = await applicationApi.move(id, next);
      setBoard(prev => {
        if (!prev) return prev;
        const columns = { ...prev.columns };
        for (const stage of STAGES) columns[stage.code] =
          (prev.columns[stage.code] || []).filter(item => item.id !== id);
        columns[next] = [updated, ...columns[next]];
        return { ...prev, columns };
      });
      setNotice("‘" + old.companyName + "’의 단계를 ‘" +
        (STAGES.find(s => s.code === next)?.label || next) + "’(으)로 변경했어요.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "단계 이동에 실패했습니다.");
    } finally { setBusyId(""); }
  }
  function dragStart(event: DragEvent<HTMLElement>, id: string) {
    if (busyId) { event.preventDefault(); return; }
    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";
  }
  function dragOver(event: DragEvent<HTMLElement>) {
    if (!busyId) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }
  }
  function drop(event: DragEvent<HTMLElement>, next: Stage) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (all.some(item => item.id === id)) void move(id, next);
  }
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;
    if (!company.trim() || !position.trim() || company.trim().length > 150 || position.trim().length > 150) {
      setError("기업명과 직무명은 각각 1~150자로 입력해 주세요."); return;
    }
    setCreating(true); setError(""); setNotice("");
    try {
      const created = await coverApi.create({
        companyName: company.trim(), positionName: position.trim(),
        deadline: deadline || null, jdUrl: null,
      });
      setBoard(prev => prev ? {
        ...prev, columns: { ...prev.columns, PLANNED: [created, ...prev.columns.PLANNED] },
      } : prev);
      setShowCreate(false); setCompany(""); setPosition(""); setDeadline("");
      setNotice("새 지원 카드와 연결된 자소서를 만들었어요. ‘지원 예정’에 추가되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "지원 카드 생성에 실패했습니다.");
    } finally { setCreating(false); }
  }
  const field = "w-full rounded-2xl border border-background-50 bg-background-30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-60";
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 rounded-[40px] bg-background-10 px-4 py-8 md:px-10 xl:px-[60px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-text-primary">지원 현황 관리</h1>
          <p className="mt-2 text-sm text-text-secondary md:text-base">다양한 방식으로 지원 카드를 관리하고, 일정을 확인해요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setShowCreate(true)}
            className="rounded-3xl bg-primary-60 px-4 py-3 text-sm font-semibold text-white">+ 지원 카드 추가</button>
          <div className="flex h-12 items-center rounded-full border border-text-disabled p-1" role="group" aria-label="지원 현황 보기">
            <button type="button" aria-pressed={view === "board"} onClick={() => setView("board")}
              className={`h-full rounded-full px-3 text-xs ${view === "board" ? "bg-primary-80 text-white" : "text-text-tertiary"}`}>칸반보드</button>
            <button type="button" aria-pressed={view === "calendar"} onClick={() => setView("calendar")}
              className={`h-full rounded-full px-3 text-xs ${view === "calendar" ? "bg-primary-80 text-white" : "text-text-tertiary"}`}>캘린더</button>
          </div>
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        {statConfig.map((config, index) => <StatCard key={config.label} {...config} value={stats[index]} />)}
      </div>
      <Banner />
      <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }}
        className="flex flex-wrap items-center gap-3">
        <label className="flex h-12 min-w-[170px] flex-1 items-center gap-3 rounded-[30px] bg-background-40 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/icon-search-kanban.svg" alt="" className="size-6 shrink-0" />
          <span className="sr-only">기업명·직무명 검색</span>
          <input type="search" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="기업명, 직무명으로 검색..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </label>
        <button type="submit" className="h-12 rounded-3xl bg-background-100 px-5 text-sm text-white">검색하기</button>
        <label className="flex items-center gap-2 text-sm text-text-secondary">단계
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value as Stage | "")}
            className="h-12 rounded-3xl border border-background-50 bg-background-20 px-3 text-sm">
            <option value="">전체</option>
            {STAGES.map(stage => <option key={stage.code} value={stage.code}>{stage.label}</option>)}
          </select>
        </label>
      </form>
      {notice && <p role="status" className="rounded-xl bg-primary-10 p-3 text-sm text-primary-60">{notice}</p>}
      {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        {error}
        <button type="button" className="ml-4 underline" onClick={() => {
          setLoading(true); setRevision(n => n + 1);
        }}>다시 불러오기</button>
      </div>}
      {loading && <p role="status" className="p-8 text-text-secondary">지원 카드를 불러오는 중...</p>}
      {!loading && !error && all.length === 0 && (
        <div className="rounded-3xl border border-dashed border-primary-30 bg-primary-10 p-8 text-center">
          <p className="font-semibold">아직 지원 카드가 없어요.</p>
          <p className="mt-2 text-sm text-text-secondary">지원 카드를 추가하거나 자소서를 만들면 자동으로 보드에 나타나요.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" className="rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white"
              onClick={() => setShowCreate(true)}>첫 지원 등록</button>
            <Link href="/cover-letters/new" className="rounded-3xl border border-primary-60 px-5 py-3 text-sm text-primary-60">
              자소서부터 작성
            </Link>
          </div>
        </div>
      )}
      {!loading && board && all.length > 0 && visible.length === 0 && (
        <div className="rounded-2xl bg-background-20 p-8 text-center text-sm text-text-secondary">
          검색 조건과 일치하는 지원 카드가 없어요.
          <button type="button" className="ml-3 text-primary-60 underline"
            onClick={() => { setSearchInput(""); setSearch(""); setStageFilter(""); }}>필터 초기화</button>
        </div>
      )}
      {!loading && board && (visible.length > 0 || all.length === 0) && view === "board" && (
        <>
          <div className="flex min-w-0 w-full items-start gap-4 overflow-x-auto pb-4" aria-label="지원 단계별 칸반 보드">
            {STAGES.map(stage => {
              const items = visible.filter(item => (item.applicationStatus || "PLANNED") === stage.code);
              return (
                <section key={stage.code} aria-label={stage.label}
                  onDragOver={dragOver} onDrop={event => drop(event, stage.code)}
                  className={`flex min-h-[230px] w-[260px] shrink-0 flex-col gap-4 rounded-3xl p-4 ${stage.bg}`}>
                  <header className="flex items-center gap-2">
                    <span className={`size-2 rounded-sm ${stage.dot}`} />
                    <h2 className="text-base font-semibold text-text-primary">{stage.label}</h2>
                    <span className="text-xs text-text-primary">({items.length})</span>
                  </header>
                  {items.length > 0 ? items.map(item => (
                    <ApplicationCard key={item.id} app={item} moving={!!busyId}
                      onOpen={setSelected} onMove={move} onDragStart={dragStart} />
                  )) : <p className="py-8 text-center text-xs text-text-primary">카드를 여기로 이동할 수 있어요.</p>}
                  <button type="button" onClick={() => setShowCreate(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary-30 bg-background-10 px-3 py-3 text-xs font-semibold text-primary-70">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/figma/icon-add-card.svg" alt="" className="size-5" />
                    카드 추가하기
                  </button>
                </section>
              );
            })}
            <div className="flex min-h-[230px] w-[85px] shrink-0 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-text-tertiary bg-primary-10 p-3"
              title="현재 백엔드는 고정된 네 단계만 지원합니다.">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/icon-add-col.svg" alt="" className="size-6 opacity-50" />
              <p className="text-center text-xs text-text-tertiary">단계 추가</p>
              <p className="text-center text-[10px] text-text-tertiary">서버 지원 예정</p>
            </div>
          </div>
          <p className="text-xs text-text-secondary">
            카드를 다른 열로 드래그하거나 카드의 ‘지원 단계 이동’ 선택 메뉴를 사용하세요. 단계 변경은 서버에 저장됩니다.
          </p>
        </>
      )}
      {!loading && board && visible.length > 0 && view === "calendar" && (
        <CalendarView items={visible} onOpen={setSelected} month={calendarMonth} setMonth={setCalendarMonth} />
      )}
      {showCreate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !creating) setShowCreate(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="application-add-title"
            className="w-full max-w-lg rounded-3xl bg-background-10 p-6 shadow-lg md:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="application-add-title" className="text-xl font-semibold">지원 카드 추가</h2>
              <button type="button" disabled={creating} onClick={() => setShowCreate(false)}
                className="rounded-full bg-background-30 px-3 py-2 text-sm" aria-label="닫기">✕</button>
            </div>
            <p className="mb-5 text-xs text-text-secondary">
              새 지원 카드는 연결된 자기소개서와 함께 생성되며 ‘지원 예정’ 단계에 저장됩니다.
            </p>
            <form onSubmit={add} className="flex flex-col gap-4">
              {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <label className="flex flex-col gap-2 text-sm font-semibold">기업명
                <input value={company} required maxLength={150} onChange={e => setCompany(e.target.value)}
                  className={field} placeholder="예) 네이버" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">지원 직무
                <input value={position} required maxLength={150} onChange={e => setPosition(e.target.value)}
                  className={field} placeholder="예) 프론트엔드 개발자" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">마감일 (선택)
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className={field} />
              </label>
              <div className="mt-3 flex justify-end gap-3">
                <button type="button" disabled={creating} onClick={() => setShowCreate(false)}
                  className="rounded-3xl border border-background-50 px-5 py-3 text-sm">취소</button>
                <button type="submit" disabled={creating} className="rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white disabled:opacity-40">
                  {creating ? "등록 중..." : "지원 등록"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {selectedCover && <ApplicationDetailPanel key={selectedCover.id} cover={selectedCover}
        onClose={() => setSelected(null)} moving={!!busyId}
        onMove={move} onSaved={async () => { await refresh(); }}
        onDeleted={async () => { await refresh(); }} />}
    </main>
  );
}
