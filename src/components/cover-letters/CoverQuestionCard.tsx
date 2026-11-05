"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { coverApi, type CoverQuestion, type CoverExperienceLink } from "@/lib/cover-letter-api";
import { tagInfo, type ExperienceRecord } from "@/lib/experience-api";

type Props = {
  coverId: string; question: CoverQuestion; index: number; total: number;
  experiences: ExperienceRecord[];
  onSaved: (question: CoverQuestion) => void; onDeleted: (id: string) => void;
  onMove: (id: string, delta: number) => void; onDirtyChange: (id: string, dirty: boolean) => void;
};
export function CoverQuestionCard({
  coverId, question, index, total, experiences, onSaved, onDeleted, onMove, onDirtyChange,
}: Props) {
  const [text, setText] = useState(question.questionText);
  const [limitText, setLimitText] = useState(String(question.characterLimit));
  const [answer, setAnswer] = useState(question.answerText || "");
  const [pending, setPending] = useState(false);
  const [linksLoading, setLinksLoading] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [links, setLinks] = useState<CoverExperienceLink[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const limit = Number(limitText);
  const count = [...answer].length;
  const dirty = text !== question.questionText || answer !== (question.answerText || "") ||
    limitText !== String(question.characterLimit);
  useEffect(() => { onDirtyChange(question.id, dirty); }, [question.id, dirty, onDirtyChange]);
  const reloadLinks = useCallback(async () => {
    setLinksLoading(true); setError("");
    try { setLinks(await coverApi.linkedExperiences(coverId, question.id)); }
    catch (err) { setError(err instanceof Error ? err.message : "경험 연결 조회 실패"); }
    finally { setLinksLoading(false); }
  }, [coverId, question.id]);
  async function save() {
    if (pending) return;
    setError(""); setNotice("");
    if (!text.trim() || text.length > 10000) { setError("문항 내용은 1~10000자여야 합니다."); return; }
    if (!Number.isInteger(limit) || limit < 1 || limit > 10000) { setError("글자 제한은 1~10000자입니다."); return; }
    if (count > limit) { setError("답변이 최대 글자 수를 초과했습니다."); return; }
    setPending(true);
    try {
      // Spring validates the OLD answer against a smaller new limit before applying the new answer.
      // Shorten the saved answer first to prevent an unnecessary validation failure.
      if (limit < question.characterLimit && [...(question.answerText || "")].length > limit) {
        await coverApi.patchQuestion(coverId, question.id, { answerText: answer });
      }
      const saved = await coverApi.patchQuestion(coverId, question.id, {
        questionText: text.trim(), characterLimit: limit, answerText: answer,
      });
      onSaved(saved); setNotice("문항과 답변을 저장했어요.");
    } catch (err) { setError(err instanceof Error ? err.message : "저장에 실패했습니다."); }
    finally { setPending(false); }
  }
  async function remove() {
    if (pending || !window.confirm("이 문항과 연결된 경험, 답변을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setPending(true); setError("");
    try { await coverApi.deleteQuestion(coverId, question.id); onDeleted(question.id); }
    catch (err) { setError(err instanceof Error ? err.message : "삭제 실패"); setPending(false); }
  }
  async function connect() {
    if (pending || !selected || links.some(link => link.experienceId === selected)) return;
    setPending(true); setError(""); setNotice("");
    try {
      const added = await coverApi.connectExperience(coverId, question.id, selected);
      setLinks(previous => [...previous, added]);
      setSelected(""); setNotice("경험을 연결했습니다.");
    } catch (err) { setError(err instanceof Error ? err.message : "경험 연결 실패"); }
    finally { setPending(false); }
  }
  async function unlink(expId: string) {
    if (pending) return;
    setPending(true); setError(""); setNotice("");
    try {
      await coverApi.disconnectExperience(coverId, question.id, expId);
      setLinks(previous => previous.filter(link => link.experienceId !== expId));
      setNotice("연결을 해제했어요.");
    } catch (err) { setError(err instanceof Error ? err.message : "연결 해제 실패"); }
    finally { setPending(false); }
  }
  const field = "w-full rounded-2xl border border-background-50 bg-background-10 p-4 text-sm outline-none focus:ring-2 focus:ring-primary-60";
  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-background-50 bg-background-20 p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">문항 {index + 1}</h3>
        <div className="flex gap-2 text-xs">
          <button type="button" disabled={pending || index === 0} onClick={() => onMove(question.id, -1)}
            className="rounded-2xl border border-background-50 px-3 py-2 disabled:opacity-40">↑ 위로</button>
          <button type="button" disabled={pending || index === total - 1} onClick={() => onMove(question.id, 1)}
            className="rounded-2xl border border-background-50 px-3 py-2 disabled:opacity-40">↓ 아래로</button>
          <button type="button" disabled={pending} onClick={remove}
            className="rounded-2xl border border-red-200 px-3 py-2 text-red-700 disabled:opacity-40">문항 삭제</button>
        </div>
      </div>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        자기소개서 질문
        <textarea rows={2} value={text} maxLength={10000}
          onChange={e => { setText(e.target.value); setNotice(""); }}
          placeholder="지원 동기와 직무 역량을 설명해 주세요." className={field} />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm font-semibold">
          글자 수 제한
          <input type="number" min={1} max={10000} value={limitText}
            onChange={e => { setLimitText(e.target.value); setNotice(""); }}
            className="w-28 rounded-2xl border border-background-50 bg-background-10 p-3 text-sm" />
        </label>
        <span className={`text-sm ${count > limit ? "font-semibold text-red-700" : "text-text-secondary"}`}>
          현재 {count.toLocaleString()} / {Number.isFinite(limit) ? limit.toLocaleString() : "?"}자
        </span>
      </div>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        나의 답변
        <textarea rows={8} value={answer}
          onChange={e => { setAnswer(e.target.value); setNotice(""); }}
          placeholder="연결된 경험을 참고해 직접 답변을 작성하세요."
          className={field} />
      </label>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-primary-60">{notice}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" disabled={pending} onClick={async () => {
          if (!showLinks) await reloadLinks();
          setShowLinks(!showLinks);
        }} className="rounded-3xl border border-primary-60 px-4 py-3 text-sm text-primary-60">
          {showLinks ? "경험 연결 닫기" : "저장한 경험 연결하기"}
        </button>
        <button type="button" disabled={pending || !dirty || count > limit} onClick={save}
          className="rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white disabled:opacity-40">
          {pending ? "처리 중..." : dirty ? "이 문항 저장" : "저장됨"}
        </button>
      </div>
      {showLinks && (
        <section className="flex flex-col gap-4 rounded-2xl border border-background-50 bg-background-10 p-5">
          <h4 className="text-sm font-semibold">문항에 연결할 경험</h4>
          <p className="text-xs text-text-secondary">
            연결은 참고 자료를 선택하는 기능이며, AI가 답변을 자동 생성하지는 않습니다.
          </p>
          {linksLoading && <p role="status" className="text-sm">연결된 경험 불러오는 중...</p>}
          {!linksLoading && links.map(link => {
            const exp = experiences.find(e => e.id === link.experienceId);
            return (
              <div key={link.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background-30 p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">{exp?.title ?? "삭제되거나 확인할 수 없는 경험"}</p>
                  {exp && <p className="text-xs text-text-secondary">{tagInfo(exp.tagCode).label}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {exp && <Link href={"/experiences/" + exp.id} className="text-xs text-primary-60 underline">경험 보기</Link>}
                  <button type="button" disabled={pending} onClick={() => unlink(link.experienceId)}
                    className="text-xs text-red-700 underline disabled:opacity-40">연결 해제</button>
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-3">
            <select aria-label="연결할 경험 선택" value={selected} onChange={e => setSelected(e.target.value)}
              className="min-w-[190px] flex-1 rounded-2xl border border-background-50 bg-background-20 px-4 py-3 text-sm">
              <option value="">경험을 선택하세요</option>
              {experiences.filter(e => !links.some(link => link.experienceId === e.id)).map(exp => (
                <option value={exp.id} key={exp.id}>{exp.title} · {tagInfo(exp.tagCode).label}</option>
              ))}
            </select>
            <button disabled={pending || !selected} type="button" onClick={connect}
              className="rounded-2xl bg-primary-60 px-5 py-3 text-sm text-white disabled:opacity-40">연결하기</button>
          </div>
          {experiences.length === 0 && (
            <p className="text-sm text-text-secondary">
              연결할 경험이 없습니다. <Link href="/experiences/new" className="text-primary-60 underline">경험 먼저 작성하기</Link>
            </p>
          )}
        </section>
      )}
    </article>
  );
}
