"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CoverApiError, coverApi, type CoverLetter, type CoverQuestion, type CoverVersion,
  type JobPosting, type CoverStatus,
} from "@/lib/cover-letter-api";
import { experienceApi, type ExperienceRecord } from "@/lib/experience-api";
import { isPreviewMode } from "@/lib/dev-preview";
import { CoverQuestionCard } from "./CoverQuestionCard";

type Meta = { companyName: string; positionName: string; deadline: string; status: CoverStatus };
type PostingForm = {
  url: string; jdOriginal: string; qualifications: string;
  preferences: string; hiringProcess: string;
};
const blankPosting: PostingForm = {
  url: "", jdOriginal: "", qualifications: "", preferences: "", hiringProcess: "",
};
function getMeta(c: CoverLetter): Meta {
  return { companyName: c.companyName, positionName: c.positionName,
    deadline: c.deadline ?? "", status: c.status };
}
function getPosting(p?: JobPosting): PostingForm {
  return p ? { url: p.url ?? "", jdOriginal: p.jdOriginal ?? "",
    qualifications: p.qualifications ?? "", preferences: p.preferences ?? "",
    hiringProcess: p.hiringProcess ?? "" } : blankPosting;
}
const cp = (value: string) => [...value].length;
const inputClass = "w-full min-w-0 rounded-2xl border border-background-50 bg-background-20 p-4 text-sm outline-none focus:ring-2 focus:ring-primary-60";
const statuses: Array<{ code: CoverStatus; label: string }> = [
  { code: "DRAFT", label: "초안" },
  { code: "IN_PROGRESS", label: "작성 중" },
  { code: "COMPLETED", label: "작성 완료" },
];

export function CoverLetterEditor({ id }: { id: string }) {
  const router = useRouter();
  const [cover, setCover] = useState<CoverLetter | null>(null);
  const [questions, setQuestions] = useState<CoverQuestion[]>([]);
  const [versions, setVersions] = useState<CoverVersion[]>([]);
  const [experiences, setExperiences] = useState<ExperienceRecord[]>([]);
  const [meta, setMeta] = useState<Meta>({ companyName: "", positionName: "", deadline: "", status: "DRAFT" });
  const [posting, setPosting] = useState<PostingForm>(blankPosting);
  const [savedPosting, setSavedPosting] = useState<PostingForm>(blankPosting);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [restorationEpoch, setRestorationEpoch] = useState(0);
  const [newQuestion, setNewQuestion] = useState("");
  const [newLimit, setNewLimit] = useState("1000");
  const [versionLabel, setVersionLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [postingOpen, setPostingOpen] = useState(false);
  const [postingLoadFailed, setPostingLoadFailed] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const metadataDirty = !!cover && JSON.stringify(meta) !== JSON.stringify(getMeta(cover));
  const postingDirty = JSON.stringify(posting) !== JSON.stringify(savedPosting);
  const unsaved = metadataDirty || postingDirty || dirtyIds.size > 0;
  const redirectIfUnauthorized = useCallback((err: unknown): boolean => {
    if (err instanceof CoverApiError && err.status === 401) {
      router.replace("/login?next=/cover-letters"); return true;
    }
    return false;
  }, [router]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const detail = await coverApi.detail(id);
        if (!active) return;
        setCover(detail.coverLetter);
        setMeta(getMeta(detail.coverLetter));
        setQuestions([...detail.questions].sort((a, b) => a.displayOrder - b.displayOrder));
        const [savedVersions, cards] = await Promise.all([
          coverApi.versions(id).catch(() => [] as CoverVersion[]),
          experienceApi.list().catch(() => [] as ExperienceRecord[]),
        ]);
        let postingValue: JobPosting | null = null;
        try {
          postingValue = await coverApi.getPosting(id);
        } catch (err) {
          // A missing posting is normal. Other read errors must not be mistaken for an empty posting.
          if (!isPreviewMode() && !(err instanceof CoverApiError && err.status === 404)) {
            if (active) {
              setPostingLoadFailed(true);
              setError("채용공고 조회에 실패했습니다. 원문 덮어쓰기를 막기 위해 공고 저장을 비활성화했어요.");
            }
          }
        }
        if (!active) return;
        setVersions(savedVersions); setExperiences(cards);
        const initialPosting = getPosting(postingValue ?? undefined);
        if (!postingValue && detail.coverLetter.jdUrl) initialPosting.url = detail.coverLetter.jdUrl;
        setPosting(initialPosting); setSavedPosting(initialPosting);
        if (window.location.search.includes("posting=failed"))
          setNotice("자소서는 생성됐지만 채용공고 별도 저장에 실패했습니다. 아래에서 공고를 다시 저장해 주세요.");
      } catch (err) {
        if (!active) return;
        if (!redirectIfUnauthorized(err)) setError(err instanceof Error ? err.message : "자소서를 불러오지 못했습니다.");
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [id, redirectIfUnauthorized]);

  useEffect(() => {
    if (!unsaved) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [unsaved]);

  const onDirtyChange = useCallback((qid: string, dirty: boolean) => {
    setDirtyIds(current => {
      if (current.has(qid) === dirty) return current;
      const next = new Set(current);
      if (dirty) next.add(qid);
      else next.delete(qid);
      return next;
    });
  }, []);
  const onSaved = useCallback((value: CoverQuestion) => {
    setQuestions(prev => prev.map(q => q.id === value.id ? value : q));
  }, []);
  const onDeleted = useCallback((qid: string) => {
    setQuestions(prev => prev.filter(q => q.id !== qid));
    setDirtyIds(prev => { const next = new Set(prev); next.delete(qid); return next; });
    setNotice("문항이 삭제되었습니다.");
  }, []);
  function back() {
    if (unsaved && !window.confirm("저장하지 않은 내용이 있습니다. 목록으로 이동할까요?")) return;
    router.push("/cover-letters");
  }
  async function saveMeta() {
    if (!cover || busy) return;
    setError(""); setNotice("");
    if (!meta.companyName.trim() || !meta.positionName.trim() ||
        meta.companyName.trim().length > 150 || meta.positionName.trim().length > 150) {
      setError("기업명과 직무명은 각각 1~150자로 입력해 주세요."); return;
    }
    // Current Spring PATCH treats null as 'unchanged', so clearing the date cannot be claimed as saved.
    if (cover.deadline && !meta.deadline) {
      setError("현재 백엔드는 기존 마감일 초기화를 지원하지 않습니다. 날짜를 변경하거나 유지해 주세요."); return;
    }
    setBusy(true);
    try {
      const updated = await coverApi.patch(id, {
        companyName: meta.companyName.trim(), positionName: meta.positionName.trim(),
        status: meta.status, ...(meta.deadline ? { deadline: meta.deadline } : {}),
      });
      setCover(updated); setMeta(getMeta(updated)); setNotice("기본 정보를 저장했습니다.");
    } catch (err) {
      if (!redirectIfUnauthorized(err)) setError(err instanceof Error ? err.message : "저장 실패");
    } finally { setBusy(false); }
  }
  async function savePosting() {
    if (busy || postingLoadFailed) return;
    setError(""); setNotice("");
    if (posting.url.trim()) {
      try {
        const url = new URL(posting.url.trim());
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || posting.url.length > 2048)
          throw new Error("invalid");
      } catch { setError("공고 링크는 올바른 http(s) URL이어야 합니다."); return; }
    }
    if (Object.entries(posting).some(([k, val]) => k !== "url" && val.length > 100000)) {
      setError("공고 본문과 상세 항목은 각각 100,000자를 넘을 수 없습니다."); return;
    }
    setBusy(true);
    try {
      const updated = await coverApi.savePosting(id, {
        url: posting.url.trim() || null, jdOriginal: posting.jdOriginal || null,
        qualifications: posting.qualifications || null, preferences: posting.preferences || null,
        hiringProcess: posting.hiringProcess || null,
      });
      const normalized = getPosting(updated);
      setPosting(normalized); setSavedPosting(normalized);
      setNotice("채용공고를 저장했습니다.");
    } catch (err) {
      if (!redirectIfUnauthorized(err)) setError(err instanceof Error ? err.message : "공고 저장 실패");
    } finally { setBusy(false); }
  }
  async function addQuestion() {
    if (busy) return;
    setError(""); setNotice("");
    const limit = Number(newLimit);
    if (!newQuestion.trim() || cp(newQuestion) > 10000) {
      setError("문항 내용은 1~10,000자입니다."); return;
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 10000) {
      setError("문항 글자 제한은 1~10,000자입니다."); return;
    }
    if (questions.length >= 30) { setError("한 자소서에 문항은 30개까지 등록 가능합니다."); return; }
    setBusy(true);
    try {
      const created = await coverApi.addQuestion(id, newQuestion.trim(), limit);
      setQuestions(prev => [...prev, created]); setNewQuestion(""); setNewLimit("1000");
      setNotice("문항이 추가되었습니다.");
    } catch (err) {
      if (!redirectIfUnauthorized(err)) setError(err instanceof Error ? err.message : "문항 추가 실패");
    } finally { setBusy(false); }
  }
  async function moveQuestion(qid: string, delta: number) {
    if (busy) return;
    if (dirtyIds.size > 0) { setError("순서를 변경하기 전에 편집 중인 문항을 모두 저장해 주세요."); return; }
    const pos = questions.findIndex(q => q.id === qid);
    if (pos < 0 || pos + delta < 0 || pos + delta >= questions.length) return;
    const next = [...questions];
    [next[pos], next[pos + delta]] = [next[pos + delta], next[pos]];
    setBusy(true); setError("");
    try {
      setQuestions((await coverApi.reorder(id, next.map(q => q.id))).sort((a, b) => a.displayOrder - b.displayOrder));
      setNotice("문항 순서가 저장되었습니다.");
    } catch (err) {
      if (!redirectIfUnauthorized(err)) setError(err instanceof Error ? err.message : "순서 저장 실패");
    } finally { setBusy(false); }
  }
  async function saveVersion() {
    if (busy) return;
    setError(""); setNotice("");
    if (unsaved) { setError("버전 저장 전에 수정 중인 기본 정보·공고·문항을 저장해 주세요."); return; }
    if (!versionLabel.trim() || versionLabel.trim().length > 100) { setError("버전 이름은 1~100자입니다."); return; }
    setBusy(true);
    try {
      const version = await coverApi.saveVersion(id, versionLabel.trim());
      setVersions(prev => [version, ...prev]); setVersionLabel("");
      setNotice("현재 문항 내용으로 버전을 저장했습니다.");
    } catch (err) {
      if (!redirectIfUnauthorized(err)) setError(err instanceof Error ? err.message : "버전 저장 실패");
    } finally { setBusy(false); }
  }
  async function restoreVersion(version: CoverVersion) {
    if (busy) return;
    setError(""); setNotice("");
    if (unsaved) { setError("복원 전에 현재 변경사항을 모두 저장해 주세요."); return; }
    if (!window.confirm("‘" + version.label + "’ 시점으로 문항과 답변을 복원할까요? 추가된 문항 및 해당 경험 연결이 사라질 수 있습니다.")) return;
    setBusy(true);
    try {
      const restored = await coverApi.restoreVersion(id, version.id);
      setQuestions([...restored].sort((a, b) => a.displayOrder - b.displayOrder));
      setRestorationEpoch(current => current + 1);
      setNotice("버전을 복원했습니다. 연결된 경험도 다시 확인해 주세요.");
    } catch (err) {
      if (!redirectIfUnauthorized(err)) setError(err instanceof Error ? err.message : "복원 실패");
    } finally { setBusy(false); }
  }
  async function deleteCover() {
    if (busy || !window.confirm("자소서와 모든 문항, 경험 연결, 버전을 영구 삭제할까요?")) return;
    setBusy(true); setError("");
    try { await coverApi.delete(id); router.replace("/cover-letters"); router.refresh(); }
    catch (err) {
      if (!redirectIfUnauthorized(err)) setError(err instanceof Error ? err.message : "삭제 실패");
      setBusy(false);
    }
  }

  if (loading) return <main className="min-w-0 flex-1 rounded-3xl bg-background-10 p-8" role="status">자소서를 불러오는 중...</main>;
  if (!cover) return (
    <main className="min-w-0 flex-1 rounded-3xl bg-background-10 p-8">
      <p role="alert" className="text-red-700">{error || "자소서를 찾을 수 없습니다."}</p>
      <Link href="/cover-letters" className="mt-4 inline-block underline">목록으로</Link>
    </main>
  );
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-7 rounded-[40px] bg-background-10 p-5 md:p-10 xl:px-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-primary-60">자기소개서 작성 · {cover.companyName}</p>
          <h1 className="text-[26px] font-semibold">자소서 문항 편집</h1>
          <p className="mt-2 text-sm text-text-secondary">{cover.positionName} · {questions.length}개 문항</p>
        </div>
        <button type="button" onClick={back}
          className="rounded-3xl border border-background-50 px-5 py-3 text-sm">← 자소서 목록</button>
      </header>
      {unsaved && <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        저장하지 않은 변경사항이 있습니다. 각 영역의 저장 버튼을 눌러 주세요.
      </p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-primary-10 px-4 py-3 text-sm text-primary-60">{notice}</p>}
      <section className="flex flex-col gap-4 rounded-3xl border border-background-50 bg-background-20 p-5 md:p-7">
        <h2 className="text-lg font-semibold">기본 정보</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold">기업명
            <input required maxLength={150} value={meta.companyName}
              onChange={e => setMeta(prev => ({ ...prev, companyName: e.target.value }))} className={inputClass} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">직무명
            <input required maxLength={150} value={meta.positionName}
              onChange={e => setMeta(prev => ({ ...prev, positionName: e.target.value }))} className={inputClass} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">마감일 (선택)
            <input type="date" value={meta.deadline}
              onChange={e => setMeta(prev => ({ ...prev, deadline: e.target.value }))} className={inputClass} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">자소서 상태
            <select value={meta.status} onChange={e => setMeta(prev => ({ ...prev, status: e.target.value as CoverStatus }))}
              className={inputClass}>
              {statuses.map(s => <option value={s.code} key={s.code}>{s.label}</option>)}
            </select>
          </label>
        </div>
        <button type="button" onClick={saveMeta} disabled={busy || !metadataDirty}
          className="self-end rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white disabled:opacity-40">
          {busy ? "처리 중..." : "기본 정보 저장"}
        </button>
      </section>
      <section className="rounded-3xl border border-background-50 bg-background-20 p-5 md:p-7">
        {postingLoadFailed && <p role="alert" className="mb-3 text-sm text-red-700">
          채용공고를 읽지 못했어요. 페이지를 다시 열어 주세요. 저장은 비활성화되어 있어요.
        </p>}
        <button type="button" onClick={() => setPostingOpen(v => !v)}
          aria-expanded={postingOpen} className="flex w-full items-center justify-between gap-3 text-left">
          <span className="text-lg font-semibold">채용공고 원문 · 상세 정보</span>
          <span className="text-sm text-primary-60">{postingOpen ? "접기 ↑" : "펼치기 ↓"}</span>
        </button>
        {postingOpen && (
          <div className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-semibold">채용공고 URL
              <input type="url" value={posting.url} maxLength={2048}
                onChange={e => setPosting(prev => ({ ...prev, url: e.target.value }))} className={inputClass}
                placeholder="https://company.com/jobs/123" />
            </label>
            {([
              ["jdOriginal", "채용공고 원문"], ["qualifications", "자격요건"],
              ["preferences", "우대사항"], ["hiringProcess", "채용 절차"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex flex-col gap-2 text-sm font-semibold">
                {label}
                <textarea rows={key === "jdOriginal" ? 6 : 3} maxLength={100000}
                  value={posting[key]} onChange={e => setPosting(prev => ({ ...prev, [key]: e.target.value }))}
                  className={inputClass} />
              </label>
            ))}
            <p className="text-xs text-text-secondary">AI 분석 없이 입력한 원문을 저장합니다.</p>
            <button type="button" onClick={savePosting} disabled={busy || !postingDirty || postingLoadFailed}
              className="self-end rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white disabled:opacity-40">
              채용공고 저장
            </button>
          </div>
        )}
      </section>
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">자기소개서 문항</h2>
            <p className="mt-2 text-sm text-text-secondary">문항별 답변을 저장하고 내 경험을 연결하세요.</p>
          </div>
          <span className="text-sm text-primary-60">{questions.length} / 30문항</span>
        </div>
        {questions.length === 0 && (
          <p className="rounded-2xl bg-background-20 p-6 text-sm text-text-secondary">아직 문항이 없습니다. 아래에서 첫 문항을 등록해 주세요.</p>
        )}
        {questions.map((question, index) => (
          <CoverQuestionCard key={question.id + ":" + restorationEpoch} coverId={id} question={question} index={index}
            total={questions.length} experiences={experiences}
            onDirtyChange={onDirtyChange} onSaved={onSaved} onDeleted={onDeleted} onMove={moveQuestion} />
        ))}
        <div className="flex flex-col gap-4 rounded-3xl border border-primary-30 bg-primary-10 p-5 md:p-7">
          <h3 className="font-semibold">+ 문항 추가하기</h3>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            문항 내용
            <textarea rows={3} maxLength={10000} value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              placeholder="지원 동기를 서술해 주세요." className={inputClass} />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">글자 수 제한
              <input type="number" value={newLimit} min={1} max={10000}
                onChange={e => setNewLimit(e.target.value)}
                className="w-28 rounded-xl border border-background-50 bg-background-10 p-3" />
            </label>
            <button type="button" onClick={addQuestion} disabled={busy || questions.length >= 30}
              className="rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white disabled:opacity-40">
              {busy ? "처리 중..." : "새 문항 등록"}
            </button>
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-background-50 bg-background-20 p-5 md:p-7">
        <button type="button" onClick={() => setVersionOpen(v => !v)} aria-expanded={versionOpen}
          className="flex w-full items-center justify-between gap-2 text-left">
          <span className="text-lg font-semibold">작성 버전 관리 ({versions.length})</span>
          <span className="text-sm text-primary-60">{versionOpen ? "접기 ↑" : "펼치기 ↓"}</span>
        </button>
        {versionOpen && (
          <div className="mt-5 flex flex-col gap-5">
            <p className="text-xs text-text-secondary">
              저장한 문항과 답변의 스냅샷을 남깁니다. 버전 복원 시 나중에 생성한 문항과 연결된 경험이 변경될 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="min-w-[180px] flex-1">
                <span className="sr-only">버전 이름</span>
                <input value={versionLabel} maxLength={100} onChange={e => setVersionLabel(e.target.value)}
                  placeholder="예: 제출 직전 최종본" className={inputClass} />
              </label>
              <button disabled={busy} type="button" onClick={saveVersion}
                className="rounded-3xl bg-primary-60 px-5 py-3 text-sm text-white disabled:opacity-40">버전 저장</button>
            </div>
            {versions.length === 0 && <p className="text-sm text-text-secondary">저장한 버전이 없습니다.</p>}
            {versions.map(v => (
              <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background-10 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{v.label}</p>
                  <p className="mt-1 text-xs text-text-tertiary">{new Date(v.createdAt).toLocaleString("ko-KR")}</p>
                </div>
                <button type="button" disabled={busy} onClick={() => restoreVersion(v)}
                  className="rounded-3xl border border-primary-60 px-4 py-2 text-xs text-primary-60 disabled:opacity-40">
                  이 버전 복원
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <button type="button" disabled={busy} onClick={deleteCover}
          className="rounded-3xl border border-red-200 px-5 py-3 text-sm text-red-700 disabled:opacity-40">자소서 삭제</button>
        <button type="button" onClick={back}
          className="rounded-3xl border border-primary-60 px-5 py-3 text-sm text-primary-60">목록으로</button>
      </div>
    </main>
  );
}
