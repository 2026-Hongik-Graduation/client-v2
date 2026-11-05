"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { coverApi, CoverApiError, type CoverDetail } from "@/lib/cover-letter-api";
import { applicationApi, type ApplicationDetail } from "@/lib/application-api";
import {
  buildInterviewPrompts, clearInterviewRecord, interviewTranscript,
  readInterviewRecord, resolveInterviewScope, saveInterviewRecord,
  type InterviewCategory,
} from "@/lib/interview-practice";
import { PracticeTimer } from "./PracticeTimer";

const categories: InterviewCategory[] = ["기본 질문", "직무·회사", "자소서 기반"];
const emptySnapshot = JSON.stringify({ answers: {}, completed: [] });
function snapshot(answers: Record<string, string>, completed: string[]) {
  return JSON.stringify({ answers, completed });
}

export function InterviewPractice({ id }: { id: string }) {
  const router = useRouter();
  const [cover, setCover] = useState<CoverDetail | null>(null);
  const [appDetail, setAppDetail] = useState<ApplicationDetail | null>(null);
  const [scope, setScope] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState<string[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState(emptySnapshot);
  const [savedAt, setSavedAt] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showReference, setShowReference] = useState(false);
  const [detailWarning, setDetailWarning] = useState("");
  const prompts = useMemo(() => cover
    ? buildInterviewPrompts(cover.coverLetter.companyName, cover.coverLetter.positionName, cover.questions) : [], [cover]);
  const dirty = snapshot(answers, completed) !== savedSnapshot;
  const answerCount = prompts.filter(p => (answers[p.id] || "").trim()).length;
  const completedCount = prompts.filter(p => completed.includes(p.id)).length;
  const active = prompts[currentIndex];

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [detail, app, key] = await Promise.all([
          coverApi.detail(id),
          applicationApi.detail(id).catch((err: unknown) => {
            if (mounted) setDetailWarning(err instanceof Error ? err.message : "면접 일정을 불러오지 못했습니다.");
            return null;
          }),
          resolveInterviewScope(),
        ]);
        if (!mounted) return;
        setCover(detail); setAppDetail(app); setScope(key);
        if (key) {
          const record = readInterviewRecord(key, id);
          if (record) {
            setAnswers(record.answers); setCompleted(record.completed);
            setSavedSnapshot(snapshot(record.answers, record.completed));
            setSavedAt(record.savedAt);
          }
        }
      } catch (err) {
        if (!mounted) return;
        if (err instanceof CoverApiError && err.status === 401) {
          router.replace("/login?next=/interviews"); return;
        }
        setError(err instanceof Error ? err.message : "면접 준비 정보를 불러오지 못했습니다.");
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, [id, router]);

  useEffect(() => {
    if (!dirty) return;
    const before = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    function linkClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!link || (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) return;
      if (link.getAttribute("target") === "_blank") return;
      const href = link.getAttribute("href");
      if (href && !href.startsWith("#") && !window.confirm("저장하지 않은 연습 답변이 있습니다. 이동할까요?")) {
        event.preventDefault(); event.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", before);
    document.addEventListener("click", linkClick, true);
    return () => {
      window.removeEventListener("beforeunload", before);
      document.removeEventListener("click", linkClick, true);
    };
  }, [dirty]);

  function goTo(index: number) {
    if (index < 0 || index >= prompts.length) return;
    setCurrentIndex(index); setShowReference(false); setError(""); setNotice("");
  }
  function changeAnswer(next: string) {
    if (!active || [...next].length > 6000) return;
    setAnswers(prev => ({ ...prev, [active.id]: next }));
    if (!next.trim()) setCompleted(old => old.filter(value => value !== active.id));
    setNotice("");
  }
  function toggleComplete() {
    if (!active) return;
    setError(""); setNotice("");
    if (!completed.includes(active.id) && !(answers[active.id] || "").trim()) {
      setError("연습 완료로 표시하려면 답변을 먼저 작성해 주세요."); return;
    }
    setCompleted(old => old.includes(active.id)
      ? old.filter(value => value !== active.id) : [...old, active.id]);
  }
  function save() {
    setError(""); setNotice("");
    if (!scope) {
      setError("계정 확인에 실패하여 브라우저 저장을 사용할 수 없습니다. 텍스트로 내보내 보관해 주세요.");
      return;
    }
    try {
      const result = saveInterviewRecord(scope, id, answers, completed);
      setSavedSnapshot(snapshot(answers, completed));
      setSavedAt(result.savedAt);
      setNotice("이 기기의 브라우저에 연습 기록을 저장했습니다. 서버에는 저장되지 않습니다.");
    } catch (err) { setError(err instanceof Error ? err.message : "브라우저 저장 공간을 확인해 주세요."); }
  }
  function clear() {
    if (!window.confirm("이 기기에 저장된 면접 답변과 연습 진행률을 모두 삭제할까요?")) return;
    try {
      if (scope) clearInterviewRecord(scope, id);
      setAnswers({}); setCompleted([]); setSavedSnapshot(emptySnapshot);
      setSavedAt(""); setCurrentIndex(0); setNotice("이 기기의 연습 기록을 초기화했습니다.");
      setError("");
    } catch { setError("브라우저에서 연습 기록을 삭제하지 못했습니다."); }
  }
  function exportText() {
    if (!cover) return;
    try {
      const content = interviewTranscript(
        cover.coverLetter.companyName, cover.coverLetter.positionName, prompts, answers, completed,
      );
      const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = "pofit-interview-" + id.slice(0, 8) + ".txt";
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("현재 작성한 답변을 텍스트 파일로 내보냈습니다.");
    } catch { setError("내보내기에 실패했습니다. 다시 시도해 주세요."); }
  }
  function back() {
    if (dirty && !window.confirm("저장하지 않은 연습 답변이 있습니다. 목록으로 이동할까요?")) return;
    router.push("/interviews");
  }
  if (loading) return <main className="min-w-0 flex-1 rounded-[40px] bg-background-10 p-8" role="status">
    연습 질문과 자소서를 불러오는 중...</main>;
  if (!cover) return (
    <main className="min-w-0 flex-1 rounded-[40px] bg-background-10 p-8">
      <p role="alert" className="text-red-700">{error || "자소서를 찾을 수 없습니다."}</p>
      <Link href="/interviews" className="mt-4 inline-block text-primary-60 underline">면접 준비 목록</Link>
    </main>
  );
  const c = cover.coverLetter;
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 rounded-[40px] bg-background-10 px-4 py-8 md:px-10 xl:px-[60px]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-primary-60">STEP 04 · INTERVIEW PRACTICE</p>
          <h1 className="text-[26px] font-semibold text-text-primary">{c.companyName} · 면접 연습</h1>
          <p className="mt-2 text-sm text-text-secondary">{c.positionName} · 전체 {prompts.length}개 질문</p>
        </div>
        <button type="button" onClick={back}
          className="rounded-3xl border border-background-50 px-5 py-3 text-sm text-text-primary">← 목록으로</button>
      </header>
      <div className="rounded-2xl border border-primary-30 bg-primary-10 px-5 py-4 text-sm text-primary-80">
        <strong>직접 연습하는 면접 노트</strong>
        <p className="mt-1 text-xs leading-5">
          AI 생성·자동 평가가 아닌 일반 예상 질문입니다. 답변은 작성 중에는 이 화면에만 있고,
          ‘이 브라우저에 저장’ 버튼을 눌러야 기기에 보관됩니다. EC2 서버로 답변을 전송하지 않습니다.
          공용 PC라면 저장하지 말고 내보내기 기능을 이용하세요.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-background-50 bg-background-20 p-5">
          <p className="text-2xl font-semibold text-primary-60">{completedCount} / {prompts.length}</p>
          <p className="mt-2 text-sm text-text-secondary">연습 완료 표시</p>
        </div>
        <div className="rounded-3xl border border-background-50 bg-background-20 p-5">
          <p className="text-2xl font-semibold text-primary-60">{answerCount}개</p>
          <p className="mt-2 text-sm text-text-secondary">답변 작성</p>
        </div>
        <div className="rounded-3xl border border-background-50 bg-background-20 p-5">
          <p className="text-lg font-semibold text-primary-60">{appDetail?.interviewDate || "미정"}</p>
          <p className="mt-2 text-sm text-text-secondary">면접 예정일</p>
          {detailWarning && <p className="mt-1 text-xs text-red-600">일정 정보를 읽지 못했어요.</p>}
        </div>
      </div>
      {prompts.length > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-primary-20"
          aria-label={`면접 연습 완료율 ${Math.round(completedCount / prompts.length * 100)}%`}
          role="progressbar" aria-valuemin={0} aria-valuemax={prompts.length} aria-valuenow={completedCount}>
          <div className="h-full rounded-full bg-primary-60 transition-[width]"
            style={{ width: (completedCount / prompts.length * 100) + "%" }} />
        </div>
      )}
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="flex min-w-0 flex-col gap-4 rounded-3xl border border-background-50 bg-background-20 p-4 md:p-5">
          <h2 className="text-base font-semibold">면접 질문 목록</h2>
          {categories.map(category => (
            <section key={category} className="flex flex-col gap-2">
              <h3 className="mt-2 text-xs font-semibold text-primary-60">{category}</h3>
              {prompts.map((prompt, index) => prompt.category === category && (
                <button type="button" key={prompt.id} onClick={() => goTo(index)}
                  aria-current={currentIndex === index ? "step" : undefined}
                  className={`flex w-full items-start gap-2 rounded-2xl px-3 py-3 text-left text-xs leading-5 transition ${index === currentIndex
                    ? "bg-primary-60 text-white" : "bg-background-10 text-text-secondary hover:bg-primary-10"}`}>
                  <span className="shrink-0 font-semibold">{completed.includes(prompt.id) ? "✓" : String(index + 1).padStart(2, "0")}</span>
                  <span className="line-clamp-2">{prompt.question}</span>
                </button>
              ))}
            </section>
          ))}
        </aside>
        <section className="flex min-w-0 flex-col gap-5">
          {active && (
            <article className="flex flex-col gap-6 rounded-3xl border border-background-50 bg-background-20 p-5 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-primary-20 px-3 py-1 text-xs font-semibold text-primary-60">
                  {active.category}
                </span>
                <span className="text-sm text-text-secondary">질문 {currentIndex + 1} / {prompts.length}</span>
              </div>
              <h2 className="break-words text-xl font-semibold leading-8 text-text-primary">{active.question}</h2>
              <p className="rounded-2xl bg-background-30 p-4 text-sm leading-6 text-text-secondary">
                <span className="mr-2 font-semibold text-primary-60">답변 TIP</span>{active.hint}
              </p>
              <PracticeTimer key={active.id} />
              {active.referenceAnswer && (
                <div className="rounded-2xl border border-background-50 bg-background-10 p-4">
                  <button type="button" aria-expanded={showReference} onClick={() => setShowReference(v => !v)}
                    className="text-left text-sm font-semibold text-primary-60">
                    {showReference ? "자소서 참고 답변 숨기기 ↑" : "저장한 자소서 답변 참고하기 ↓"}
                  </button>
                  {showReference && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-text-secondary">
                    {active.referenceAnswer}
                  </p>}
                </div>
              )}
              <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="interview-answer">
                나의 연습 답변
              </label>
              <textarea id="interview-answer" rows={11}
                value={answers[active.id] || ""} maxLength={6000}
                onChange={e => changeAnswer(e.target.value)}
                placeholder="핵심 경험 → 내가 한 행동 → 결과 순서로 답변을 작성해보세요."
                className="w-full resize-y rounded-2xl border border-background-50 bg-background-10 p-5 text-sm leading-6 text-text-primary outline-none focus:ring-2 focus:ring-primary-60" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-text-secondary">{[...(answers[active.id] || "")].length} / 6,000자</span>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                  <input type="checkbox" checked={completed.includes(active.id)} onChange={toggleComplete}
                    className="size-4 accent-primary-60" />
                  이 질문 연습 완료
                </label>
              </div>
              <div className="flex flex-wrap justify-between gap-3 border-t border-background-50 pt-5">
                <button type="button" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}
                  className="rounded-3xl border border-primary-60 px-5 py-3 text-sm text-primary-60 disabled:opacity-30">
                  ← 이전 질문
                </button>
                <button type="button" onClick={() => goTo(currentIndex + 1)} disabled={currentIndex === prompts.length - 1}
                  className="rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white disabled:opacity-30">
                  다음 질문 →
                </button>
              </div>
            </article>
          )}
          {dirty && <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            저장하지 않은 변경사항이 있어요. 브라우저를 닫기 전에 저장하거나 내보내 주세요.
          </p>}
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="rounded-xl bg-primary-10 px-4 py-3 text-sm text-primary-60">{notice}</p>}
          <section className="flex flex-col gap-4 rounded-3xl border border-background-50 bg-background-20 p-5 md:p-7">
            <h2 className="text-lg font-semibold">연습 기록 관리</h2>
            <p className="text-xs leading-5 text-text-secondary">
              {scope
                ? "저장 버튼을 누르면 계정별로 구분된 이 브라우저의 저장 공간에만 답변이 남습니다. 다른 기기에서 동기화되지 않습니다."
                : "계정 식별이 확인되지 않아 브라우저 저장은 비활성화됐습니다. 작성한 내용은 텍스트로 내보낼 수 있어요."}
            </p>
            {savedAt && <p className="text-xs text-primary-60">이 브라우저에서 마지막 저장: {new Date(savedAt).toLocaleString("ko-KR")}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={save} disabled={!scope}
                className="rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white disabled:opacity-40">
                이 브라우저에 저장
              </button>
              <button type="button" onClick={exportText}
                className="rounded-3xl border border-primary-60 px-5 py-3 text-sm text-primary-60">
                현재 답변 TXT 내보내기
              </button>
              <button type="button" onClick={clear}
                className="rounded-3xl border border-red-200 px-5 py-3 text-sm text-red-700">
                내 연습 기록 초기화
              </button>
            </div>
            <div className="border-t border-background-50 pt-4">
              <Link href={"/cover-letters/" + c.id} className="text-sm text-primary-60 underline">
                자기소개서와 문항 편집하기 →
              </Link>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
