"use client";

import { useEffect, useState } from "react";

export function PracticeTimer() {
  const [duration, setDuration] = useState(120);
  const [remaining, setRemaining] = useState(120);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || remaining <= 0) return;
    const interval = window.setInterval(() => {
      setRemaining(value => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running, remaining]);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-background-50 bg-background-20 p-4"
      aria-label="면접 답변 타이머">
      <span className="text-xs font-semibold text-text-secondary">답변 시간</span>
      <output className={`font-mono text-xl font-semibold tabular-nums ${remaining === 0 ? "text-status-error" : "text-primary-60"}`}
        aria-live="off">{mm}:{ss}</output>
      <select value={duration} onChange={event => {
        const next = Number(event.target.value);
        setDuration(next); setRemaining(next); setRunning(false);
      }} aria-label="타이머 시간 설정" className="rounded-xl border border-background-50 bg-background-10 px-3 py-2 text-xs">
        <option value={60}>1분</option>
        <option value={120}>2분</option>
        <option value={180}>3분</option>
      </select>
      <button type="button" onClick={() => setRunning(value => !value)}
        disabled={remaining === 0}
        className="rounded-2xl bg-primary-60 px-4 py-2 text-xs text-white disabled:opacity-40">
        {running ? "일시정지" : remaining === duration ? "시작" : "계속"}
      </button>
      <button type="button" onClick={() => { setRemaining(duration); setRunning(false); }}
        className="rounded-2xl border border-background-50 bg-background-10 px-4 py-2 text-xs text-text-secondary">
        초기화
      </button>
      {remaining === 0 && <span className="text-xs font-semibold text-status-error" role="status">답변 시간 종료</span>}
    </section>
  );
}
