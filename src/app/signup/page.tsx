import type { Metadata } from "next";
import { LoginCard } from "@/components/login/LoginCard";
import { SignUpForm } from "@/components/login/SignUpForm";

export const metadata: Metadata = { title: "회원가입 — 포핏 Pofit" };
export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-20 px-6 py-12 md:px-20">
      <div className="flex w-full max-w-[1184px] items-start justify-center gap-16 lg:gap-[150px]">
        <LoginCard />
        <SignUpForm />
      </div>
    </div>
  );
}
