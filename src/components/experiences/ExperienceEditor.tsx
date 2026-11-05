"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError, experienceApi, tagInfo, type ExperienceRecord,
  type ExperienceQuestion, type ExperienceStatus,
} from "@/lib/experience-api";

type FormState = { title: string; startedAt: string; endedAt: string; summary: string };
const empty: FormState = { title: "", startedAt: "", endedAt: "", summary: "" };
export function ExperienceEditor({ id }: { id: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<ExperienceRecord | null>(null);
  const [questions, setQuestions] = useState<ExperienceQuestion[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customAnswers, setCustomAnswers] = useState<Array<{ key: string; label: string; content: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    experienceApi.detail(id).then(async (detail) => {
      const qs = await experienceApi.questions(detail.experience.tagCode);
      if (!active) return;
      setRecord(detail.experience);
      setQuestions(qs.slice().sort((a, b) => a.displayOrder - b.displayOrder));
      setForm({
        title: detail.experience.title,
        startedAt: detail.experience.startedAt ?? "",
        endedAt: detail.experience.endedAt ?? "",
        summary: detail.experience.summary ?? "",
      });
      setAnswers(Object.fromEntries(detail.answers.filter(a => a.questionId)
        .map(a => [a.questionId as string, a.content ?? ""])));
      setCustomAnswers(detail.answers.filter(a => !a.questionId && a.customLabel)
        .map((a, i) => ({ key: "existing-" + i, label: a.customLabel ?? "", content: a.content ?? "" })));
    }).catch((err: unknown) => {
      if (!active) return;
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login?next=" + encodeURIComponent("/experiences/" + id));
        return;
      }
      setError(err instanceof Error ? err.message : "경험을 불러오지 못했습니다.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, router]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value })); setDirty(true); setNotice("");
  }
  function updateAnswer(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value })); setDirty(true); setNotice("");
  }
  function changeCustom(key: string, field: "label" | "content", value: string) {
    setCustomAnswers(list => list.map(item => item.key === key ? { ...item, [field]: value } : item));
    setDirty(true); setNotice("");
  }
  function addCustom() {
    setCustomAnswers(list => [...list, { key: crypto.randomUUID(), label: "", content: "" }]);
    setDirty(true); setNotice("");
  }
  function removeCustom(key: string) {
    setCustomAnswers(list => list.filter(a => a.key !== key)); setDirty(true); setNotice("");
  }
  function leave() {
    if (!dirty || window.confirm("저장하지 않은 변경사항이 있습니다. 목록으로 이동할까요?")) {
      router.push("/experiences");
    }
  }
  async function persist(status: ExperienceStatus) {
    if (!record || saving) return;
    setError(""); setNotice("");
    if (!form.title.trim() || form.title.trim().length > 150) {
      setError("제목은 1~150자로 입력해 주세요."); return;
    }
    if (form.startedAt && form.endedAt && form.endedAt < form.startedAt) {
      setError("종료일은 시작일보다 빠를 수 없습니다."); return;
    }
    if (customAnswers.some(a => !a.label.trim() || a.label.trim().length > 200)) {
      setError("추가한 질문의 제목을 1~200자로 입력해 주세요."); return;
    }
    if (questions.length + customAnswers.length > 50) {
      setError("질문은 총 50개까지만 저장할 수 있습니다."); return;
    }
    if (status === "COMPLETED") {
      if (!form.startedAt || !form.endedAt) {
        setError("완료하려면 경험 기간의 시작일과 종료일을 입력해 주세요."); return;
      }
      if (questions.some(q => q.required && !answers[q.id]?.trim())) {
        setError("완료하려면 모든 필수 질문에 답변해 주세요."); return;
      }
    }
    setSaving(true);
    try {
      if (record.status === "COMPLETED" && status === "DRAFT") {
        await experienceApi.setStatus(id, "DRAFT");
      }
      await experienceApi.patch(id, {
        title: form.title.trim(), summary: form.summary.trim(),
        startedAt: form.startedAt || null, endedAt: form.endedAt || null,
      });
      await experienceApi.saveAnswers(id, [
        ...questions.map(q => ({
          questionId: q.id, content: answers[q.id] ?? "", displayOrder: q.displayOrder,
        })),
        ...customAnswers.map((a, i) => ({
          customLabel: a.label.trim(), content: a.content, displayOrder: questions.length + i + 1,
        })),
      ]);
      const updated = await experienceApi.setStatus(id, status);
      setRecord(updated); setDirty(false);
      setNotice(status === "COMPLETED" ? "경험 작성이 완료되고 저장되었습니다." : "임시저장되었습니다.");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login?next=" + encodeURIComponent("/experiences/" + id));
      } else {
        setError((err instanceof Error ? err.message : "저장에 실패했습니다.") +
          " 일부 항목이 반영되었을 수 있으니 다시 확인해 주세요.");
      }
    } finally { setSaving(false); }
  }
  async function remove() {
    if (!record || saving || !window.confirm("이 경험과 답변을 영구 삭제할까요? 복구할 수 없습니다.")) return;
    setSaving(true); setError("");
    try {
      await experienceApi.delete(id);
      setDirty(false); router.replace("/experiences"); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제하지 못했습니다.");
      setSaving(false);
    }
  }
  const field = "w-full rounded-2xl border border-background-50 bg-background-20 p-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-60";
  if (loading) return <main className="min-w-0 flex-1 rounded-[32px] bg-background-10 p-8" role="status">경험을 불러오는 중...</main>;
  if (!record) return (
    <main className="min-w-0 flex-1 rounded-[32px] bg-background-10 p-8">
      <p role="alert" className="text-status-error">{error || "경험을 찾을 수 없습니다."}</p>
      <button onClick={leave} className="mt-4 underline">목록으로</button>
    </main>
  );
  const filled = questions.filter(q => answers[q.id]?.trim()).length;
  const required = questions.filter(q => q.required);
  const progress = required.length
    ? Math.round(required.filter(q => answers[q.id]?.trim()).length / required.length * 100) : 100;
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-7 rounded-[32px] bg-background-10 p-5 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-primary-60">{tagInfo(record.tagCode).label} · {record.status === "DRAFT" ? "작성 중" : "작성 완료"}</p>
          <h1 className="text-2xl font-semibold text-text-primary">경험 작성 및 수정</h1>
          <p className="mt-2 text-sm text-text-secondary">{filled}/{questions.length}문항 작성 · 필수 문항 진행률 {progress}%</p>
        </div>
        <button type="button" onClick={leave} className="rounded-3xl border border-background-50 px-5 py-3">← 경험 목록</button>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background-30">
        <div className="h-full rounded-full bg-primary-60" style={{ width: progress + "%" }} />
      </div>
      <section className="grid gap-4 rounded-3xl bg-background-20 p-5 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold md:col-span-2">
          경험 제목
          <input value={form.title} maxLength={150} onChange={e => update("title", e.target.value)} className={field} required />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          시작일
          <input type="date" value={form.startedAt} onChange={e => update("startedAt", e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          종료일
          <input type="date" value={form.endedAt} onChange={e => update("endedAt", e.target.value)} className={field} />
        </label>
      </section>
      <section className="flex flex-col gap-5" aria-label="경험별 질문">
        {questions.map((q, i) => (
          <label key={q.id} className="flex flex-col gap-3 rounded-3xl border border-background-50 bg-background-20 p-5">
            <span className="text-sm font-semibold text-primary-60">질문 {i + 1} · {q.label}{q.required ? " *" : ""}</span>
            <span className="text-sm text-text-secondary">{q.prompt}</span>
            <textarea rows={5} maxLength={5000} value={answers[q.id] ?? ""}
              onChange={e => updateAnswer(q.id, e.target.value)}
              placeholder="나의 경험을 구체적으로 적어주세요." className={field} />
            <span className="text-right text-xs text-text-tertiary">{(answers[q.id] ?? "").length}/5000자</span>
          </label>
        ))}
      </section>
      <section aria-label="추가 질문" className="flex flex-col gap-4">
        {customAnswers.map((custom, i) => (
          <div key={custom.key} className="flex flex-col gap-3 rounded-3xl border border-background-50 bg-background-20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-primary-60">추가 질문 {i + 1}</span>
              <button type="button" onClick={() => removeCustom(custom.key)}
                className="text-sm text-red-700 underline">질문 삭제</button>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium">
              질문 제목
              <input type="text" value={custom.label} maxLength={200} required
                onChange={e => changeCustom(custom.key, "label", e.target.value)}
                placeholder="추가 질문을 입력해 주세요." className={field} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              나의 답변
              <textarea rows={4} value={custom.content} maxLength={5000}
                onChange={e => changeCustom(custom.key, "content", e.target.value)}
                placeholder="답변을 입력해 주세요." className={field} />
              <span className="text-right text-xs text-text-tertiary">{custom.content.length}/5000자</span>
            </label>
          </div>
        ))}
        <button type="button" onClick={addCustom} disabled={questions.length + customAnswers.length >= 50}
          className="self-start rounded-3xl border border-primary-60 px-5 py-3 text-sm text-primary-60 disabled:opacity-50">
          + 질문 추가하기
        </button>
      </section>
      <label className="flex flex-col gap-2 rounded-3xl bg-background-20 p-5 text-sm font-semibold">
        요약 (선택)
        <textarea rows={3} maxLength={20000} value={form.summary}
          onChange={e => update("summary", e.target.value)}
          placeholder="경험 카드에 표시할 요약을 작성하세요." className={field} />
      </label>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" disabled={saving} onClick={remove}
          className="rounded-3xl border border-red-200 px-5 py-3 text-sm text-red-700 disabled:opacity-50">경험 삭제</button>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={saving} onClick={() => persist("DRAFT")}
            className="rounded-3xl border border-primary-60 px-6 py-3 text-sm text-primary-60 disabled:opacity-50">
            {saving ? "저장 중..." : "임시저장"}
          </button>
          <button type="button" disabled={saving} onClick={() => persist("COMPLETED")}
            className="rounded-3xl bg-background-100 px-6 py-3 text-sm text-text-inverse disabled:opacity-50">
            {saving ? "저장 중..." : "작성 완료"}
          </button>
        </div>
      </div>
    </main>
  );
}
