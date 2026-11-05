import type { Metadata } from "next";
import { Lnb } from "@/components/experiences/Lnb";
import { InterviewDashboard } from "@/components/interviews/InterviewDashboard";

export const metadata: Metadata = {
  title: "면접 준비 — POFIT", description: "지원한 기업에 맞춰 면접 질문을 연습해요.",
};
export default function InterviewsPage() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundImage:
      "linear-gradient(144.02deg, var(--color-primary-20) 4.93%, var(--color-primary-40) 91.3%)" }}>
      <div className="flex w-full items-stretch gap-4 p-4 md:gap-8 md:p-8">
        <Lnb active="면접" />
        <InterviewDashboard />
      </div>
    </div>
  );
}
