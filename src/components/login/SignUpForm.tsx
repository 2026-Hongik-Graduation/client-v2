"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Stage = "email" | "code" | "password";
async function post(path: string, body: unknown) {
  let response: Response;
  try {
    response = await fetch("/api/auth/" + path, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), credentials: "same-origin",
    });
  } catch { throw new Error("서버 연결에 실패했습니다."); }
  if (!response.ok) {
    if (response.status === 409) throw new Error("이미 가입된 이메일입니다.");
    if (response.status === 429) throw new Error("인증 요청이 너무 빠릅니다. 잠시 후 다시 시도해 주세요.");
    if (response.status >= 500) throw new Error("이메일 발송 서버 또는 백엔드 연결을 확인해 주세요.");
    throw new Error(path.includes("verify") ? "인증코드가 올바르지 않거나 만료되었습니다." :
      path.includes("signup") ? "회원가입 조건을 확인해 주세요." : "이메일 주소를 확인해 주세요.");
  }
}
export function SignUpForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const input = "w-full rounded-3xl border border-background-50 bg-background-30 px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary-60";

  async function action(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(""); setNotice("");
    if (stage === "code" && !/^\d{6}$/.test(code)) {
      setError("인증번호 6자리를 입력해 주세요."); return;
    }
    if (stage === "password" && (password.length < 8 || password.length > 72 || password !== confirm)) {
      setError("비밀번호는 8~72자이며, 확인 입력과 일치해야 합니다."); return;
    }
    setPending(true);
    try {
      if (stage === "email") {
        await post("email/send", { email: email.trim().toLowerCase() });
        setStage("code"); setNotice("인증번호를 이메일로 발송했습니다.");
      } else if (stage === "code") {
        await post("email/verify", { email: email.trim().toLowerCase(), code });
        setStage("password"); setNotice("이메일 인증을 완료했습니다.");
      } else {
        await post("signup", { email: email.trim().toLowerCase(), password });
        try {
          await post("login", { email: email.trim().toLowerCase(), password });
          router.replace("/onboarding"); router.refresh();
        } catch {
          router.replace("/login"); router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청 처리에 실패했습니다.");
    } finally { setPending(false); }
  }
  async function resend() {
    if (pending) return;
    setError(""); setNotice(""); setPending(true);
    try { await post("email/send", { email: email.trim().toLowerCase() }); setNotice("새 인증번호를 발송했습니다."); }
    catch (err) { setError(err instanceof Error ? err.message : "재발송에 실패했습니다."); }
    finally { setPending(false); }
  }
  return (
    <main className="flex w-full max-w-[516px] flex-col gap-6">
      <Link href="/" className="mb-5 w-fit text-2xl font-bold text-primary-60">POFIT</Link>
      <h1 className="text-3xl font-semibold text-text-primary">회원가입</h1>
      <p className="text-sm text-text-secondary">이메일 인증 → 비밀번호 설정 → 기본 프로필 등록</p>
      <p className="text-sm text-primary-60" aria-live="polite">
        {stage === "email" ? "1단계 · 이메일 입력" : stage === "code" ? "2단계 · 이메일 인증" : "3단계 · 비밀번호 설정"}
      </p>
      <form onSubmit={action} className="flex flex-col gap-5">
        {stage === "email" && (
          <label className="flex flex-col gap-2 text-sm font-semibold">
            이메일
            <input className={input} type="email" required maxLength={254}
              autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com" />
          </label>
        )}
        {stage === "code" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">{email}로 발송한 인증번호를 입력해 주세요.</p>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              6자리 인증번호
              <input className={input} type="text" inputMode="numeric" required
                autoComplete="one-time-code" maxLength={6} value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000" />
            </label>
            <button type="button" disabled={pending} onClick={resend}
              className="self-start text-sm text-primary-60 underline disabled:opacity-50">인증번호 재발송</button>
          </div>
        )}
        {stage === "password" && (
          <>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              비밀번호 (8~72자)
              <input className={input} type={showPw ? "text" : "password"} required
                minLength={8} maxLength={72} autoComplete="new-password" value={password}
                onChange={e => setPassword(e.target.value)} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              비밀번호 확인
              <input className={input} type={showPw ? "text" : "password"} required
                minLength={8} maxLength={72} autoComplete="new-password" value={confirm}
                onChange={e => setConfirm(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} />
              비밀번호 보기
            </label>
          </>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
        <button type="submit" disabled={pending}
          className="h-12 rounded-3xl bg-primary-60 px-6 text-white disabled:opacity-50">
          {pending ? "처리 중..." : stage === "email" ? "인증번호 받기" : stage === "code" ? "인증하기" : "가입 완료"}
        </button>
      </form>
      <div className="flex justify-between gap-3 text-sm">
        {stage !== "email" && <button type="button" onClick={() => {
          setError(""); setNotice(""); setStage(stage === "password" ? "code" : "email");
        }} className="text-text-secondary underline">이전 단계</button>}
        <Link href="/login" className="ml-auto text-primary-60 underline">이미 계정이 있나요? 로그인</Link>
      </div>
    </main>
  );
}
