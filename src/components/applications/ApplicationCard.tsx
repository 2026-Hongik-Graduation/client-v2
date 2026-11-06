"use client";
import type { DragEvent } from "react";
import type { CoverLetter } from "@/lib/cover-letter-api";
import { STAGES, type Stage } from "@/lib/application-api";

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const [y, m, d] = deadline.split("-").map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
}
const COVER_STATE: Record<string, string> = {
  DRAFT: "자소서 초안", IN_PROGRESS: "자소서 작성 중", COMPLETED: "자소서 작성 완료",
};
export function ApplicationCard({
  app, moving, onOpen, onMove, onDragStart,
}: {
  app: CoverLetter; moving: boolean;
  onOpen: (id: string) => void; onMove: (id: string, stage: Stage) => void;
  onDragStart: (event: DragEvent<HTMLElement>, id: string) => void;
}) {
  const day = daysLeft(app.deadline);
  const urgent = day !== null && day >= 0 && day <= 3 && app.applicationStatus !== "CLOSED";
  const stage = STAGES.find(item => item.code === app.applicationStatus) || STAGES[0];
  const label = day === null ? "마감일 미지정"
    : day === 0 ? "D-Day" : day > 0 ? "D-" + day : "마감일 경과";
  return (
    <article draggable={!moving} onDragStart={event => onDragStart(event, app.id)}
      className="flex min-w-0 w-full cursor-grab flex-col gap-3 rounded-2xl border border-background-50 bg-background-10 p-4 transition hover:border-primary-60 hover:shadow-sm active:cursor-grabbing"
      aria-label={app.companyName + " " + app.positionName + " 지원 카드"}>
      <button type="button" onClick={() => onOpen(app.id)}
        className="flex w-full items-center gap-4 text-left focus-visible:outline-2 focus-visible:outline-primary-60">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-bl from-background-40 to-background-10 text-xl font-semibold text-primary-60">
          {app.companyName.trim().charAt(0) || "P"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block break-words text-sm font-semibold text-text-primary">{app.positionName}</span>
          <span className="mt-1 block break-words text-xs text-text-secondary">{app.companyName}</span>
        </span>
      </button>
      <div className="flex items-center justify-between gap-1">
        <span className="rounded-full bg-primary-20 px-3 py-1 text-xs font-medium text-primary-70">
          {COVER_STATE[app.status] || "자소서"}
        </span>
        <span className={`text-right text-xs ${urgent ? "font-semibold text-status-error" : "text-primary-70"}`}>
          {label}
        </span>
      </div>
      <label className="flex flex-col gap-1 text-xs text-text-secondary">
        지원 단계 이동
        <select value={stage.code} disabled={moving} onChange={e => onMove(app.id, e.target.value as Stage)}
          className="w-full rounded-xl border border-background-50 bg-background-20 p-2 text-xs text-text-primary focus-visible:outline-2 focus-visible:outline-primary-60 disabled:opacity-40">
          {STAGES.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
        </select>
      </label>
    </article>
  );
}
