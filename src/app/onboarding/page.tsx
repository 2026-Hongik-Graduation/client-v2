import type { Metadata } from "next";
import { OnboardingForm } from "@/components/login/OnboardingForm";

export const metadata: Metadata = { title: "프로필 설정 — 포핏 Pofit" };
export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-20 p-5 md:p-12">
      <OnboardingForm />
    </div>
  );
}
