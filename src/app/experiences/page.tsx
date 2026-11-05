import type { Metadata } from "next";
import { ExperienceDashboard } from "@/components/experiences/ExperienceDashboard";

export const metadata: Metadata = {
  title: "경험 대시보드 — 포핏 Pofit",
  description: "나의 경험을 등록하고 STAR 문항으로 정리하세요.",
};
export default function ExperiencesPage() {
  return <ExperienceDashboard />;
}
