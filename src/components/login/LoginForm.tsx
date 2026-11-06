"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { isPreviewAvailable } from "@/lib/preview-host";
import { startPreviewMode, stopPreviewMode } from "@/lib/dev-preview";

const subscribe = () => () => {};
const serverSnapshot = () => false;

export function LoginForm() {
  const router = useRouter();
  const demoAvailable = useSyncExternalStore(subscribe, isPreviewAvailable, serverSnapshot);
  const [showPw, setShowPw] = useState(false);
  const [keepLogin, setKeepLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function enterPreview() {
    startPreviewMode();
    router.replace("/cover-letters");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          "x-pofit-keep-login": keepLogin ? "1" : "0" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(res.status === 401
        ? "이메일 또는 비밀번호를 확인해 주세요."
        : res.status >= 500 ? "백엔드 연결을 확인해 주세요." : "로그인 요청을 확인해 주세요.");
      // Real login always exits the local-only preview, avoiding mock data shadowing authenticated data.
      stopPreviewMode();
      const requested = new URLSearchParams(window.location.search).get("next");
      const safeNext = requested &&
        /^\/(?:(?:experiences|cover-letters|interviews)(?:\/[a-zA-Z0-9-]+)?|applications|onboarding)$/.test(requested)
        ? requested : "/experiences";
      try {
        const profileRes = await fetch("/api/members/me/profile", { cache: "no-store" });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile?.data?.onboardingStep !== "COMPLETED") {
            router.replace("/onboarding"); router.refresh(); return;
          }
        }
      } catch { /* Leave profile errors to the onboarding screen. */ }
      router.replace(safeNext);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full max-w-[516px] flex-1 flex-col gap-20">
      {/* Brand logo */}
      <div className="h-9 w-[63px] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/login-logo.svg" alt="POFIT" className="h-full w-full" />
      </div>

      <form className="flex w-full flex-1 flex-col gap-8" onSubmit={handleSubmit}>
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col gap-4">
            {/* Email */}
            <div className="flex w-full flex-col gap-2">
              <label htmlFor="login-email" className="text-[14px] font-semibold leading-[1.45] tracking-[0.07px] text-text-primary">
                이메일
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@email.com"
                className="h-12 w-full rounded-[24px] border border-grayscale-40 bg-background-30 px-4 py-3 text-[16px] font-normal leading-[1.6] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-40"
              />
            </div>

            {/* Password */}
            <div className="flex w-full flex-col gap-2">
              <label htmlFor="login-password" className="text-[14px] font-semibold leading-[1.45] tracking-[0.07px] text-text-primary">
                비밀번호
              </label>
              <div className="flex h-12 w-full items-center justify-between rounded-[24px] border border-grayscale-40 bg-background-30 px-4 py-3 focus-within:ring-2 focus-within:ring-primary-40">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="password"
                  className="min-w-0 flex-1 bg-transparent text-[16px] font-normal leading-[1.6] text-text-primary placeholder:text-text-tertiary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="block size-6 shrink-0"
                  aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/figma/icon-eye.svg" alt="" className="h-full w-full" />
                </button>
              </div>
            </div>
          </div>

          {/* Keep login */}
          <button
            type="button"
            onClick={() => setKeepLogin((v) => !v)}
            className="flex items-center gap-[9px]"
          >
            <span
              className={`flex size-5 items-center justify-center rounded-full border-2 ${
                keepLogin ? "border-primary-60 bg-primary-60" : "border-background-60"
              }`}
            >
              {keepLogin && (
                <span className="size-1.5 rounded-full bg-text-inverse" />
              )}
            </span>
            <span className="whitespace-nowrap text-[14px] font-semibold leading-[1.45] tracking-[0.07px] text-text-secondary">
              로그인 유지
            </span>
          </button>
        </div>

        <div className="flex w-full flex-1 flex-col gap-4">
          <div className="flex w-full flex-col items-end gap-6">
            {/* Login button */}
            <button
              type="submit"
              disabled={pending}
              className="flex h-12 w-full items-center justify-center rounded-[24px] bg-background-70 px-4 py-3 disabled:opacity-50"
            >
              <span className="text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-primary">
                {pending ? "로그인 중..." : "로그인하기"}
              </span>
            </button>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {demoAvailable && (
              <div className="w-full rounded-2xl border border-primary-40 bg-primary-10 p-3">
                <button type="button" onClick={enterPreview}
                  className="w-full rounded-3xl border border-primary-60 bg-white px-4 py-3 text-sm font-semibold text-primary-60 hover:bg-primary-20">
                  로그인 건너뛰기 (데모) →
                </button>
                <p className="mt-2 text-center text-xs text-text-secondary">
                  데모 모드 · 실제 계정 로그인이나 서버 저장 없이, 이 브라우저에서만 데이터를 저장하며 화면을 둘러볼 수 있어요.
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="flex w-full items-center gap-[21px]">
              <span className="h-px min-w-0 flex-1 bg-grayscale-40" />
              <span className="text-[14px] font-semibold leading-[1.45] tracking-[0.07px] text-text-tertiary">
                or
              </span>
              <span className="h-px min-w-0 flex-1 bg-grayscale-40" />
            </div>

            {/* Google login */}
            <button
              type="button"
              disabled
              title="구글 로그인은 현재 준비 중입니다."
              className="flex h-12 w-full items-center justify-center rounded-[24px] border border-text-tertiary bg-background-10 px-4 py-3 disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <span className="block size-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/figma/icon-google.svg" alt="" className="h-full w-full" />
                </span>
                <span className="text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-primary">
                  구글 로그인 (준비 중)
                </span>
              </span>
            </button>
          </div>

          {/* Footer links */}
          <div className="flex w-full items-center justify-between px-2.5">
            <Link
              href="/signup"
              className="text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-primary-60 underline"
            >
              회원가입하기
            </Link>
            <Link
              href="/find-password"
              className="text-right text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-secondary underline"
            >
              비밀번호 찾기
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
