"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout");
      router.replace("/login");
      router.refresh();
    } catch {
      setPending(false);
      window.alert("로그아웃에 실패했습니다. 다시 시도해 주세요.");
    }
  }
  return (
    <button type="button" onClick={logout} disabled={pending}
      className="rounded-lg p-1 text-center text-[11px] text-text-inverse underline hover:opacity-80"
      aria-label="로그아웃">
      {pending ? "종료 중" : "로그아웃"}
    </button>
  );
}
