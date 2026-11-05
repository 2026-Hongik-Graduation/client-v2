"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CoverQuestion } from "@/lib/cover-letter-api";
import { coverApi } from "@/lib/cover-letter-api";
import type { ExperienceRecord } from "@/lib/experience-api";
import {
  coverAiApi, QUESTION_TYPES, REVISION_TYPES, type ClassificationPreview,
  type EditingTurn, type QuestionType, type RevisionType, type StrategyPreview,
  type TextPreview,
} from "@/lib/cover-letter-ai-api";

type Result =
  | { kind: "analysis"; value: ClassificationPreview }
  | { kind: "strategy"; value: StrategyPreview }
  | { kind: "text"; value: TextPreview; sourceAnswer: string }
  | { kind: "chat"; value: EditingTurn; sourceAnswer: string };
type Mode = "analysis" | "strategy" | "draft" | "revise" | "chat";
const tabs: { code: Mode; label: string }[] = [
  { code: "analysis", label: "문항 분석" },
  { code: "strategy", label: "작성 전략" },
  { code: "draft", label: "AI 초안" },
  { code: "revise", label: "첨삭 미리보기" },
  { code: "chat", label: "대화형 첨삭" },
];
const labelClass = "flex flex-col gap-2 text-xs font-semibold text-text-secondary";
const selectClass = "w-full rounded-xl border border-background-50 bg-background-10 px-3 py-3 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-primary-60";
const cp = (value: string) => [...value].length;
const warningText = (value: string) => ({
  MOCK_ONLY: "예시/모의 AI 응답입니다. 실제 생성 품질을 나타내지 않습니다.",
  REVIEW_SUGGESTIONS: "AI 제안은 참고용이며 사실과 경험을 직접 검증하세요.",
  REVIEW_CLASSIFICATION: "문항 유형을 직접 확인해 주세요.",
  CHARACTER_LIMIT_EXCEEDED: "문항 글자 수 제한을 초과했습니다.",
  JD_NOT_ANALYZED: "채용공고 분석이 없어 회사 적합성 판단이 제한될 수 있어요.",
  MISSING_EXPERIENCE: "경험 연결이나 요약이 없어 근거가 부족할 수 있어요.",
} as Record<string, string>)[value] || value;

export function CoverQuestionAiPanel({
  coverId, question, currentAnswer, questionConfigDirty, experiences, onApply,
}: {
  coverId: string; question: CoverQuestion; currentAnswer: string;
  questionConfigDirty: boolean; experiences: ExperienceRecord[];
  onApply: (value: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("analysis");
  const [questionType, setQuestionType] = useState<QuestionType>("JOB_COMPETENCY");
  const [revisionType, setRevisionType] = useState<RevisionType>("GENERAL");
  const [instruction, setInstruction] = useState("");
  const [linkedIds, setLinkedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [linksFailed, setLinksFailed] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [history, setHistory] = useState<EditingTurn[]>([]);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const retryRef = useRef<{ signature: string; requestId: string } | null>(null);

  const reloadLinks = useCallback(async () => {
    setLoadingLinks(true); setLinksFailed(false);
    try {
      const links = await coverApi.linkedExperiences(coverId, question.id);
      const ids = [...new Set(links.map(link => link.experienceId))];
      setLinkedIds(ids);
      setSelectedIds(old => old.filter(id => ids.includes(id)).slice(0, 10));
    } catch (err) {
      setLinksFailed(true);
      setError(err instanceof Error ? err.message : "연결 경험을 불러오지 못했습니다.");
    } finally { setLoadingLinks(false); }
  }, [coverId, question.id]);

  useEffect(() => {
    let active = true;
    coverApi.linkedExperiences(coverId, question.id).then(links => {
      if (!active) return;
      const ids = [...new Set(links.map(link => link.experienceId))];
      setLinkedIds(ids);
      setSelectedIds(old => old.filter(id => ids.includes(id)).slice(0, 10));
      setLinksFailed(false);
    }).catch(err => {
      if (!active) return;
      setLinksFailed(true);
      setError(err instanceof Error ? err.message : "연결 경험을 불러오지 못했습니다.");
    }).finally(() => { if (active) setLoadingLinks(false); });
    return () => { active = false; };
  }, [coverId, question.id]);

  const reloadHistory = useCallback(async () => {
    setLoadingChat(true); setHistoryError("");
    try { setHistory(await coverAiApi.history(coverId, question.id)); }
    catch (err) { setHistoryError(err instanceof Error ? err.message : "대화 내역을 읽지 못했습니다."); }
    finally { setLoadingChat(false); }
  }, [coverId, question.id]);

  function changeMode(next: Mode) {
    setMode(next); setError(""); setNotice(""); setResult(null);
    if (next === "chat") void reloadHistory();
  }

  function toggleExperience(id: string) {
    setSelectedIds(old => old.includes(id) ? old.filter(value => value !== id)
      : old.length < 10 ? [...old, id] : old);
    setResult(null); setNotice("");
  }

  async function run() {
    if (pending || questionConfigDirty || (mode !== "analysis" && (linksFailed || loadingLinks))) return;
    setError(""); setNotice("");
    const source = currentAnswer;
    if (mode === "draft" && selectedIds.length === 0) {
      setError("AI 초안을 만들려면 요약된 경험을 문항에 연결하고 최소 1개 선택해야 합니다."); return;
    }
    if ((mode === "revise" || mode === "chat") && !source.trim()) {
      setError("첨삭을 진행하려면 먼저 답변을 입력해 주세요."); return;
    }
    if (mode === "chat" && !instruction.trim()) {
      setError("대화형 첨삭 요청 내용을 입력해 주세요."); return;
    }
    if (mode === "chat" && historyError) {
      setError("대화 내역을 읽지 못해 중복 요청을 막았습니다. 내역을 다시 조회해 주세요."); return;
    }
    if (mode === "chat" && history.length >= 100) {
      setError("서버의 문항별 최대 첨삭 대화 횟수(100회)에 도달했습니다."); return;
    }
    setPending(true);
    try {
      if (mode === "analysis") {
        const value = await coverAiApi.analyze(coverId, question.id);
        setResult({ kind: "analysis", value });
        setQuestionType(value.questionType);
      }
      if (mode === "strategy") {
        setResult({ kind: "strategy", value:
          await coverAiApi.strategy(coverId, question.id, questionType, selectedIds) });
      }
      if (mode === "draft") {
        setResult({ kind: "text", sourceAnswer: source, value:
          await coverAiApi.draft(coverId, question.id, questionType, selectedIds) });
      }
      if (mode === "revise") {
        setResult({ kind: "text", sourceAnswer: source, value: await coverAiApi.revise(
          coverId, question.id, {
            questionType, experienceIds: selectedIds, originalText: source,
            revisionType, instruction: instruction.trim(),
          },
        ) });
      }
      if (mode === "chat") {
        const input = {
          questionType, experienceIds: selectedIds, currentDraft: source,
          revisionType, instruction: instruction.trim(),
        };
        const signature = JSON.stringify(input);
        const requestId = retryRef.current?.signature === signature
          ? retryRef.current.requestId : crypto.randomUUID();
        retryRef.current = { signature, requestId };
        const value = await coverAiApi.chat(coverId, question.id, { ...input, requestId });
        retryRef.current = null;
        setHistory(old => old.some(turn => turn.requestId === value.requestId) ? old : [...old, value]);
        setResult({ kind: "chat", value, sourceAnswer: source });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 요청에 실패했습니다.");
    } finally { setPending(false); }
  }

  const suggestion = result?.kind === "text" ? result.value.text
    : result?.kind === "chat" ? result.value.revisedText : null;
  const metadata = result?.value;
  const limit = question.characterLimit;
  function apply() {
    if (!suggestion || pending || cp(suggestion) > limit || questionConfigDirty) return;
    if (result && "sourceAnswer" in result && currentAnswer !== result.sourceAnswer &&
        !window.confirm("AI 요청 후 답변이 수정됐습니다. 현재 편집 내용을 덮어쓰고 제안문으로 바꿀까요?")) return;
    if (currentAnswer.trim() && currentAnswer !== suggestion &&
        !window.confirm("기존 답변을 AI 제안문으로 교체할까요? 아직 서버에는 저장되지 않습니다.")) return;
    onApply(suggestion);
    setNotice("현재 답변 입력란에만 반영했습니다. 반드시 ‘이 문항 저장’을 눌러 확정해 주세요.");
  }

  return (
    <section aria-label="AI 자소서 도우미"
      className="flex min-w-0 flex-col gap-5 rounded-3xl border border-primary-30 bg-primary-10 p-4 md:p-6">
      <div>
        <h4 className="text-base font-semibold text-primary-80">AI 자소서 도우미</h4>
        <p className="mt-2 text-xs leading-5 text-text-secondary">
          저장된 문항과 선택한 경험을 AI 서비스에 전달해 분석합니다. 출력은 제안용 미리보기이고,
          직접 ‘답변에 반영’한 후 문항을 저장해야 자소서 본문에 반영됩니다.
          사실관계와 자기 경험은 직접 검증해 주세요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="AI 도우미 기능 선택">
        {tabs.map(tab => (
          <button type="button" key={tab.code} onClick={() => changeMode(tab.code)}
            aria-pressed={mode === tab.code} disabled={pending}
            className={`rounded-full px-3 py-2 text-xs font-semibold disabled:opacity-40 ${mode === tab.code
              ? "bg-primary-80 text-white" : "border border-primary-30 bg-background-10 text-primary-70"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {questionConfigDirty && (
        <p role="alert" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          문항 내용이나 글자 제한이 수정된 상태예요. AI 요청 전에 ‘이 문항 저장’을 눌러 주세요.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>문항 유형
          <select value={questionType} onChange={e => { setQuestionType(e.target.value as QuestionType); setResult(null); }}
            className={selectClass} disabled={pending}>
            {QUESTION_TYPES.map(type => <option key={type.code} value={type.code}>{type.label}</option>)}
          </select>
        </label>
        {(mode === "revise" || mode === "chat") && (
          <label className={labelClass}>첨삭 방향
            <select value={revisionType} onChange={e => setRevisionType(e.target.value as RevisionType)}
              className={selectClass} disabled={pending}>
              {REVISION_TYPES.map(type => <option key={type.code} value={type.code}>{type.label}</option>)}
            </select>
          </label>
        )}
      </div>

      {mode !== "analysis" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-background-50 bg-background-10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h5 className="text-sm font-semibold text-text-primary">AI에 사용할 연결 경험</h5>
            <button type="button" onClick={() => void reloadLinks()}
              className="text-xs text-primary-60 underline" disabled={pending || loadingLinks}>연결 목록 새로고침</button>
          </div>
          {loadingLinks && <p role="status" className="text-xs text-text-secondary">연결 경험 조회 중...</p>}
          {!loadingLinks && !linkedIds.length && <p className="text-xs text-text-secondary">
            연결된 경험이 없어요. 아래 ‘저장한 경험 연결하기’에서 먼저 경험을 연결하세요.
            초안에는 요약된 경험이 최소 한 개 필요합니다.
          </p>}
          {!loadingLinks && linkedIds.map(id => {
            const exp = experiences.find(item => item.id === id);
            return (
              <label className="flex items-center gap-3 rounded-xl bg-background-20 p-3 text-xs"
                key={id}>
                <input type="checkbox" checked={selectedIds.includes(id)}
                  disabled={pending || (!selectedIds.includes(id) && selectedIds.length >= 10)}
                  onChange={() => toggleExperience(id)} className="size-4 accent-primary-60" />
                <span className="min-w-0 flex-1 break-words">{exp?.title || "연결된 경험 (목록에 없음)"}</span>
              </label>
            );
          })}
          <p className="text-xs text-text-secondary">최대 10개 선택 · 현재 {selectedIds.length}개</p>
        </div>
      )}

      {(mode === "revise" || mode === "chat") && (
        <label className={labelClass}>
          {mode === "chat" ? "AI에게 요청할 수정 사항 (필수)" : "추가 요청 사항 (선택)"}
          <textarea rows={3} maxLength={1000} value={instruction}
            onChange={e => { setInstruction(e.target.value); setResult(null); }}
            placeholder="예: 구체적인 결과부터 시작하고, 반복 표현을 줄여 주세요."
            className={selectClass} />
          <span className="self-end font-normal">{instruction.length} / 1000</span>
        </label>
      )}

      {mode === "chat" && (
        <section className="flex max-h-[480px] flex-col gap-3 overflow-y-auto rounded-2xl bg-background-10 p-4">
          <div className="flex items-center justify-between gap-3">
            <h5 className="text-sm font-semibold">서버에 저장된 첨삭 대화</h5>
            <button type="button" onClick={() => void reloadHistory()} disabled={loadingChat || pending}
              className="text-xs text-primary-60 underline">새로고침</button>
          </div>
          <p className="text-xs text-text-secondary">
            대화 요청과 제안문 이력은 백엔드에 저장됩니다. 단, 제안문 자체가 자소서 답변으로 자동 저장되지는 않아요.
          </p>
          {loadingChat && <p role="status" className="text-xs">첨삭 이력 조회 중...</p>}
          {historyError && <p role="alert" className="text-xs text-red-700">{historyError}</p>}
          {!loadingChat && !historyError && history.length === 0 && <p className="text-xs text-text-secondary">
            이전 첨삭 요청이 없어요.</p>}
          {history.map(turn => (
            <div key={turn.requestId} className="flex flex-col gap-2 rounded-xl border border-background-50 bg-background-20 p-3">
              <span className="text-[11px] text-text-secondary">{turn.sequenceNo}회차 · {turn.isMock ? "서버 모의 결과" : "AI 제안"}</span>
              <p className="break-words text-xs font-semibold">요청: {turn.instruction}</p>
              <p className="line-clamp-4 whitespace-pre-wrap break-words text-xs text-text-secondary">제안: {turn.revisedText}</p>
              <button type="button" className="self-start text-xs text-primary-60 underline"
                onClick={() => { setResult({ kind: "chat", value: turn, sourceAnswer: currentAnswer }); setNotice(""); }}>
                이 제안 펼쳐 보기
              </button>
            </div>
          ))}
        </section>
      )}

      <button type="button" onClick={() => void run()}
        disabled={pending || questionConfigDirty || loadingLinks || linksFailed ||
          (mode === "draft" && !selectedIds.length) ||
          ((mode === "revise" || mode === "chat") && !currentAnswer.trim())}
        className="self-start rounded-full bg-primary-60 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">
        {pending ? "AI 요청 처리 중..." : {
          analysis: "문항 분석 시작", strategy: "작성 전략 받기", draft: "AI 초안 생성하기",
          revise: "첨삭 제안 받기", chat: "AI와 첨삭 대화하기",
        }[mode]}
      </button>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-background-10 p-3 text-xs text-primary-70">{notice}</p>}

      {result && (
        <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-primary-30 bg-background-10 p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="text-sm font-semibold">분석·생성 결과 미리보기</h5>
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${metadata?.isMock
              ? "bg-amber-100 text-amber-900" : "bg-primary-20 text-primary-70"}`}>
              {metadata?.isMock ? "모의 AI 결과" : "AI 응답"}
            </span>
          </div>
          {metadata && <p className="text-[11px] text-text-secondary">
            제공자: {metadata.provider || "미확인"} · 버전: {metadata.promptVersion || "미확인"}
          </p>}
          {metadata && metadata.warnings?.length > 0 && (
            <div className="flex flex-col gap-1 rounded-xl bg-amber-50 p-3">
              {metadata.warnings.map((warning, i) => <p key={i} className="text-xs text-amber-900">
                · {warningText(warning)}
              </p>)}
            </div>
          )}
          {result.kind === "analysis" && (
            <div className="flex flex-col gap-3 text-sm leading-6 text-text-primary">
              <p><strong>추천 문항 유형:</strong> {QUESTION_TYPES.find(t => t.code === result.value.questionType)?.label || result.value.questionType}</p>
              <p><strong>평가 의도:</strong> {result.value.evaluationIntent}</p>
              {result.value.evidenceQuote && <p><strong>판단 문구:</strong> {result.value.evidenceQuote}</p>}
              <div><p className="font-semibold">관련 역량</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.value.recommendedSkills.map((s, i) => <span key={i}
                    className="rounded-full bg-primary-20 px-3 py-1 text-xs text-primary-70">{s}</span>)}
                </div>
              </div>
            </div>
          )}
          {result.kind === "strategy" && (
            <div className="flex flex-col gap-4">
              {([
                ["강점", result.value.strengths],
                ["보완할 근거", result.value.evidenceGaps],
                ["다음 행동", result.value.nextActions],
              ] as [string, string[]][]).map(([heading, values]) => (
                <div key={heading}>
                  <h6 className="text-sm font-semibold">{heading}</h6>
                  {values.length ? <ul className="mt-2 list-disc space-y-2 pl-5 text-xs leading-5 text-text-secondary">
                    {values.map((item, i) => <li key={i}>{item}</li>)}
                  </ul> : <p className="mt-1 text-xs text-text-secondary">제안된 항목이 없어요.</p>}
                </div>
              ))}
            </div>
          )}
          {suggestion !== null && (
            <>
              <div className="flex items-center justify-between gap-2 text-xs text-text-secondary">
                <span>AI 제안문</span>
                <span className={cp(suggestion) > limit ? "font-semibold text-red-700" : ""}>
                  {cp(suggestion)} / {limit}자
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-background-50 bg-background-20 p-4 text-sm leading-6 text-text-primary">
                {suggestion}
              </div>
              {result.kind === "text" && result.value.changeReasons.length > 0 && (
                <p className="text-xs text-text-secondary">수정 이유: {result.value.changeReasons.join(" · ")}</p>
              )}
              {result.kind === "chat" && result.value.changeReasons.length > 0 && (
                <p className="text-xs text-text-secondary">수정 이유: {result.value.changeReasons.join(" · ")}</p>
              )}
              {cp(suggestion) > limit && <p role="alert" className="text-xs text-red-700">
                결과가 글자 수 제한을 초과합니다. 바로 반영할 수 없으니 분량을 조정해 다시 요청해 주세요.
              </p>}
              <button type="button" onClick={apply} disabled={pending || cp(suggestion) > limit || questionConfigDirty}
                className="self-start rounded-full bg-primary-60 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">
                이 제안문을 답변 입력란에 반영
              </button>
              <p className="text-xs text-text-secondary">이 버튼만으로 서버 저장되지 않습니다. 입력란에서 검토 후 ‘이 문항 저장’하세요.</p>
            </>
          )}
        </section>
      )}
    </section>
  );
}
