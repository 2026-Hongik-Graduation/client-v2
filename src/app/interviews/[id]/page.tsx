import type { Metadata } from "next";
import { Lnb } from "@/components/experiences/Lnb";
import { InterviewPractice } from "@/components/interviews/InterviewPractice";

export const metadata: Metadata = { title: "면접 답변 연습 — POFIT" };
export default async function InterviewPracticePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen w-full" style={{ backgroundImage:
      "linear-gradient(144.02deg, var(--color-primary-20) 4.93%, var(--color-primary-40) 91.3%)" }}>
      <div className="flex w-full items-stretch gap-4 p-4 md:gap-8 md:p-8">
        <Lnb active="면접" />
        <InterviewPractice id={id} />
      </div>
    </div>
  );
}
