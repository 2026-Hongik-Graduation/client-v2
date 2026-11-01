import type { Metadata } from "next";
import { Lnb } from "@/components/experiences/Lnb";
import { NewExperienceForm } from "@/components/experiences/NewExperienceForm";

export const metadata: Metadata = {
  title: "경험 추가하기 — 포핏 Pofit",
  description: "제목과 경험 태그를 정한 뒤, 어떤 방식으로 정리할지 선택하세요.",
};

export default function NewExperiencePage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage:
          "linear-gradient(147.25deg, var(--color-primary-20) 4.93%, var(--color-primary-40) 91.3%)",
      }}
    >
      <div className="flex w-full items-stretch gap-8 p-8">
        <Lnb />
        <NewExperienceForm />
      </div>
    </div>
  );
}
