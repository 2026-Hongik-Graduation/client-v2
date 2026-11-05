"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { CoverLetter } from "@/lib/cover-letter-api";
import { coverApi } from "@/lib/cover-letter-api";
import { applicationApi, STAGES, type ApplicationDetail, type Stage } from "@/lib/application-api";

type Values = {
  deadline: string; interviewDate: string; documentResult: "" | "PENDING" | "PASSED" | "FAILED";
  hasResume: boolean; hasPortfolio: boolean;
};
const empty: Values = { deadline: "", interviewDate: "", documentResult: "",
  hasResume: false, hasPortfolio: false };
function toValues(detail: ApplicationDetail): Values {
  return { deadline: detail.deadline || "", interviewDate: detail.interviewDate || "",
    documentResult: detail.documentResult || "", hasResume: detail.hasResume, hasPortfolio: detail.hasPortfolio };
}
export function ApplicationDetailPanel({
  cover, onClose, onSaved, onDeleted, onMove, moving,
}: {
  cover: CoverLetter; onClose: () => void; onSaved: () => Promise<void>;
  onDeleted: () => Promise<void>; onMove: (id: string, stage: Stage) => Promise<void>; moving: boolean;
}) {
  const [value, setValue] = useState<Values>(empty);
  const [initial, setInitial] = useState<Values>(empty);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dirty = JSON.stringify(value) !== JSON.stringify(initial);
  useEffect(() => {
    let active = true;
    applicationApi.detail(cover.id).then(detail => {
      if (!active) return;
      const next = toValues(detail);
      setValue(next); setInitial(next); setReady(true); setError("");
    }).catch(err => {
      if (active) setError(err instanceof Error ? err.message : "지원 상세를 읽지 못했습니다.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cover.id]);
  useEffect(() => {
    if (!dirty) return;
    const before = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  function close() {
    if (!dirty || window.confirm("저장하지 않은 상세 정보가 있습니다. 닫을까요?")) onClose();
  }
  function change<K extends keyof Values>(field: K, next: Values[K]) {
    setValue(old => ({ ...old, [field]: next })); setNotice("");
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || loading || !dirty) return;
    setPending(true); setError(""); setNotice("");
    try {
      const result = await applicationApi.saveDetail(cover.id, {
        deadline: value.deadline || null, interviewDate: value.interviewDate || null,
        documentResult: value.documentResult || null,
        hasResume: value.hasResume, hasPortfolio: value.hasPortfolio,
      });
      const next = toValues(result); setValue(next); setInitial(next);
      await onSaved(); setNotice("지원 상세 정보를 저장했습니다.");
    } catch (err) {
      setError((err instanceof Error ? err.message : "저장 실패") +
        " 저장 상태가 불분명하면 화면을 다시 열어 확인해 주세요.");
    } finally { setPending(false); }
  }
  async function remove() {
    if (pending) return;
    if (!window.confirm("이 지원 카드를 삭제하면 연결된 자기소개서, 문항, 버전도 영구 삭제됩니다. 정말 삭제할까요?")) return;
    setPending(true); setError("");
    try { await coverApi.delete(cover.id); await onDeleted(); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "삭제 실패"); setPending(false); }
  }
  const field = "w-full rounded-2xl border border-background-50 bg-background-30 px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-60";
  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40 p-0 sm:p-4"
      role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="app-detail-heading"
        className="flex h-full w-full max-w-[520px] flex-col overflow-y-auto rounded-none bg-background-10 p-5 shadow-xl sm:rounded-3xl sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-primary-60">{cover.companyName}</p>
            <h2 id="app-detail-heading" className="mt-2 text-xl font-semibold text-text-primary">{cover.positionName}</h2>
          </div>
          <button type="button" onClick={close}
            className="rounded-full bg-background-30 px-3 py-2 text-sm" aria-label="상세 닫기">✕</button>
        </div>
        <div className="mb-5 flex flex-col gap-2">
          <label className="text-sm font-semibold">지원 단계</label>
          <select value={cover.applicationStatus || "PLANNED"} disabled={moving || pending || dirty}
            onChange={e => onMove(cover.id, e.target.value as Stage)} className={field}>
            {STAGES.map(stage => <option key={stage.code} value={stage.code}>{stage.label}</option>)}
          </select>
          {dirty && <p className="text-xs text-text-secondary">단계 변경 전 아래 정보를 저장해 주세요.</p>}
        </div>
        {loading && <p role="status" className="p-6 text-text-secondary">지원 상세를 불러오는 중...</p>}
        {!loading && !ready && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error || "지원 상세 정보를 불러오지 못했습니다."} 저장을 막았어요. 화면을 닫고 다시 열어 주세요.
        </p>}
        {!loading && ready && (
          <form onSubmit={save} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-sm font-semibold">지원 마감일
              <input type="date" value={value.deadline} className={field}
                onChange={e => change("deadline", e.target.value)} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">면접 예정일
              <input type="date" value={value.interviewDate} className={field}
                onChange={e => change("interviewDate", e.target.value)} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">서류 결과
              <select value={value.documentResult} className={field}
                onChange={e => change("documentResult", e.target.value as Values["documentResult"])}>
                <option value="">미등록</option>
                <option value="PENDING">발표 대기</option>
                <option value="PASSED">합격</option>
                <option value="FAILED">불합격</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-background-50 bg-background-20 p-4 text-sm">
              <input type="checkbox" checked={value.hasResume}
                onChange={e => change("hasResume", e.target.checked)} className="size-4 accent-primary-60" />
              이력서 준비 완료
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-background-50 bg-background-20 p-4 text-sm">
              <input type="checkbox" checked={value.hasPortfolio}
                onChange={e => change("hasPortfolio", e.target.checked)} className="size-4 accent-primary-60" />
              포트폴리오 준비 완료
            </label>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {notice && <p role="status" className="rounded-xl bg-primary-10 p-3 text-sm text-primary-60">{notice}</p>}
            <button type="submit" disabled={pending || !dirty}
              className="w-full rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white disabled:opacity-40">
              {pending ? "저장 중..." : "지원 상세 저장"}
            </button>
          </form>
        )}
        <div className="mt-8 flex flex-col gap-3 border-t border-background-50 pt-6">
          <Link href={"/interviews/" + cover.id}
            onClick={e => {
              if (dirty && !window.confirm("저장되지 않은 지원 상세 정보가 있습니다. 면접 준비로 이동할까요?")) {
                e.preventDefault();
              }
            }}
            className="rounded-3xl bg-primary-60 px-5 py-3 text-center text-sm font-semibold text-white">
            이 회사 면접 연습하기 →
          </Link>
          <Link href={"/cover-letters/" + cover.id}
            onClick={e => {
              if (dirty && !window.confirm("저장되지 않은 지원 상세 정보가 있습니다. 자소서 편집으로 이동할까요?")) {
                e.preventDefault();
              }
            }}
            className="rounded-3xl border border-primary-60 px-5 py-3 text-center text-sm text-primary-60">
            자기소개서 및 문항 편집하기 →
          </Link>
          <p className="text-xs text-text-secondary">
            지원 카드는 자기소개서와 연결되어 있어요. 삭제하면 자소서도 함께 삭제됩니다.
          </p>
          <button type="button" disabled={pending} onClick={remove}
            className="rounded-3xl border border-red-200 px-5 py-3 text-sm text-red-700 disabled:opacity-40">
            지원 카드와 자기소개서 삭제
          </button>
        </div>
      </section>
    </div>
  );
}
