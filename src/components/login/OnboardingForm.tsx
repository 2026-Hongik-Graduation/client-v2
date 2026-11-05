"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  age: number | null; gender: string | null; school: string | null;
  desiredJob: string | null; onboardingStep: "BASIC" | "JOB" | "COMPLETED";
};
type Envelope = { success: boolean; data: Profile };
async function profileRequest(method: "GET" | "PUT", suffix = "", data?: unknown): Promise<Profile> {
  let response: Response;
  try {
    response = await fetch("/api/members/me/profile" + suffix, {
      method, credentials: "same-origin", cache: "no-store",
      ...(data ? { body: JSON.stringify(data), headers: { "Content-Type": "application/json" } } : {}),
    });
  } catch { throw new Error("백엔드 연결을 확인해 주세요."); }
  if (response.status === 401) throw new Error("로그인 세션이 만료되었습니다.");
  if (!response.ok) throw new Error(response.status >= 500
    ? "서버 연결에 문제가 발생했습니다." : "입력값을 확인해 주세요.");
  const body = await response.json() as Envelope;
  if (!body.success) throw new Error("프로필 처리에 실패했습니다.");
  return body.data;
}
export function OnboardingForm() {
  const router = useRouter();
  const [stage, setStage] = useState<"BASIC" | "JOB">("BASIC");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [school, setSchool] = useState("");
  const [desiredJob, setDesiredJob] = useState("");
  useEffect(() => {
    let active = true;
    profileRequest("GET").then(data => {
      if (!active) return;
      if (data.onboardingStep === "COMPLETED") { router.replace("/experiences"); return; }
      setStage(data.onboardingStep === "JOB" ? "JOB" : "BASIC");
      setAge(data.age == null ? "" : String(data.age));
      setGender(data.gender ?? ""); setSchool(data.school ?? "");
      setDesiredJob(data.desiredJob ?? "");
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : "프로필 정보를 읽지 못했습니다.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(""); setPending(true);
    try {
      if (stage === "BASIC") {
        const n = Number(age);
        if (!Number.isInteger(n) || n < 1 || n > 120 || !gender || !school.trim()) {
          throw new Error("나이·성별·학교를 모두 올바르게 입력해 주세요.");
        }
        await profileRequest("PUT", "/basic", { age: n, gender, school: school.trim() });
        setStage("JOB");
      } else {
        if (!desiredJob.trim() || desiredJob.trim().length > 100) {
          throw new Error("희망 직군을 1~100자로 입력해 주세요.");
        }
        await profileRequest("PUT", "/job", { desiredJob: desiredJob.trim() });
        router.replace("/experiences"); router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로필 저장에 실패했습니다.");
    } finally { setPending(false); }
  }
  const field = "w-full rounded-2xl border border-background-50 bg-background-30 p-4 outline-none focus:ring-2 focus:ring-primary-60";
  return (
    <main className="w-full max-w-lg rounded-[32px] bg-background-10 p-6 shadow-lg md:p-10">
      <h1 className="text-2xl font-semibold text-text-primary">기본 프로필 설정</h1>
      <p className="my-4 text-sm text-text-secondary">
        {stage === "BASIC" ? "1/2 · 기본 정보를 입력해 주세요." : "2/2 · 희망 직군을 입력해 주세요."}
      </p>
      {loading ? <p role="status">프로필을 확인하고 있습니다...</p> : (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          {stage === "BASIC" ? (
            <>
              <label className="flex flex-col gap-2 text-sm font-semibold">나이
                <input type="number" min={1} max={120} required value={age}
                  onChange={e => setAge(e.target.value)} className={field} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">성별
                <select required value={gender} onChange={e => setGender(e.target.value)} className={field}>
                  <option value="">선택하세요</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                  <option value="OTHER">기타</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">학교
                <input type="text" maxLength={150} required value={school}
                  onChange={e => setSchool(e.target.value)} className={field} />
              </label>
            </>
          ) : (
            <label className="flex flex-col gap-2 text-sm font-semibold">희망 직군
              <input type="text" required maxLength={100} value={desiredJob}
                onChange={e => setDesiredJob(e.target.value)}
                placeholder="예: BACKEND, FRONTEND, DESIGN" className={field} />
              <span className="text-xs font-normal text-text-secondary">직군 코드는 팀에서 정한 값을 입력해 주세요.</span>
            </label>
          )}
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={pending} type="submit"
            className="rounded-3xl bg-primary-60 px-6 py-3 font-medium text-white disabled:opacity-50">
            {pending ? "저장 중..." : stage === "BASIC" ? "다음 단계" : "완료하고 경험 정리하기"}
          </button>
        </form>
      )}
      {loading === false && error && stage === "BASIC" && (
        <button type="button" onClick={() => router.replace("/login?next=/onboarding")}
          className="mt-4 text-sm text-primary-60 underline">로그인 화면으로</button>
      )}
    </main>
  );
}
