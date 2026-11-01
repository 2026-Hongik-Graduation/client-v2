import type { Metadata } from "next";
import { LoginCard } from "@/components/login/LoginCard";
import { FindPasswordForm } from "@/components/login/FindPasswordForm";

export const metadata: Metadata = {
  title: "비밀번호 찾기 — 포핏 Pofit",
  description: "이메일 인증 후 비밀번호 재설정을 진행해주세요.",
};

export default function FindPasswordPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background-20 px-6 py-16 md:px-[120px]">
      <div className="flex w-full max-w-[1184px] items-start justify-center gap-16 lg:gap-[202px]">
        <LoginCard />
        <FindPasswordForm />
      </div>
    </div>
  );
}
