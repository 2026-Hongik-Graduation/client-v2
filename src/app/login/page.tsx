import type { Metadata } from "next";
import { LoginCard } from "@/components/login/LoginCard";
import { LoginForm } from "@/components/login/LoginForm";

export const metadata: Metadata = {
  title: "로그인 — 포핏 Pofit",
  description:
    "지원 기업과 직무에 맞는 경험을 찾아, 원하는 기업에 핏한 자소서로 완성해보세요.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background-20 px-6 py-16 md:px-[120px]">
      <div className="flex w-full max-w-[1184px] items-start justify-center gap-16 lg:gap-[202px]">
        <LoginCard />
        <LoginForm />
      </div>
    </div>
  );
}
