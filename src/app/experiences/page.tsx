import type { Metadata } from "next";
import { Lnb } from "@/components/experiences/Lnb";
import { TopPanels } from "@/components/experiences/TopPanels";
import { Toolbar } from "@/components/experiences/Toolbar";
import { ExperienceCard } from "@/components/experiences/ExperienceCard";
import { EXPERIENCES } from "@/components/experiences/experiences-data";

export const metadata: Metadata = {
  title: "경험 대시보드 — 포핏 Pofit",
  description:
    "지금까지 쌓아온 나의 경험이 카드로 정리되어 자소서의 근거가 돼요.",
};

export default function ExperiencesPage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage:
          "linear-gradient(132.6deg, var(--color-primary-20) 4.93%, var(--color-primary-40) 91.3%)",
      }}
    >
      <div className="flex w-full items-start gap-8 p-8">
        <Lnb />

        <main className="flex min-w-0 flex-1 flex-col gap-10 rounded-[40px] bg-background-10 px-6 py-8 md:px-[60px]">
          {/* Heading */}
          <div className="flex w-full flex-col items-start gap-2">
            <h1 className="text-[28px] font-semibold leading-[1.3] tracking-[-0.28px] text-text-primary">
              경험 대시보드
            </h1>
            <p className="text-[16px] font-normal leading-[1.6] text-text-secondary">
              지금까지 쌓아온 나의 경험이 카드로 정리되어 자소서의 근거가 돼요
            </p>
          </div>

          <TopPanels />

          <Toolbar />

          {/* Experience card grid */}
          <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {EXPERIENCES.map((exp, i) => (
              <ExperienceCard key={`${exp.title}-${i}`} exp={exp} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
