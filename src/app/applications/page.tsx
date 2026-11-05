import type { Metadata } from "next";
import { Lnb } from "@/components/experiences/Lnb";
import { ApplicationsBoard } from "@/components/applications/ApplicationsBoard";

export const metadata: Metadata = {
  title: "지원 현황 관리 — 포핏 Pofit",
  description: "다양한 방식으로 지원 카드를 관리하고, 일정을 확인해요.",
};

export default function ApplicationsPage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage:
          "linear-gradient(144.02deg, var(--color-primary-20) 4.93%, var(--color-primary-40) 91.3%)",
      }}
    >
      <div className="flex w-full items-stretch gap-4 p-4 md:gap-8 md:p-8">
        <Lnb active="지원" />
        <ApplicationsBoard />
      </div>
    </div>
  );
}
