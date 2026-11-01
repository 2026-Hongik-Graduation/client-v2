import type { Metadata } from "next";
import { Lnb } from "@/components/experiences/Lnb";
import { NewCoverLetterForm } from "@/components/cover-letters/NewCoverLetterForm";

export const metadata: Metadata = {
  title: "새 자소서 만들기 — 포핏 Pofit",
  description:
    "채용공고를 입력하면, 자소서 작성에 필요한 기업 분석 결과를 확인할 수 있어요.",
};

export default function NewCoverLetterPage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage:
          "linear-gradient(151.19deg, var(--color-primary-20) 4.93%, var(--color-primary-40) 91.3%)",
      }}
    >
      <div className="flex w-full items-stretch gap-8 p-8">
        <Lnb active="자소서" />
        <NewCoverLetterForm />
      </div>
    </div>
  );
}
