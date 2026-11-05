import type { Metadata } from "next";
import { Lnb } from "@/components/experiences/Lnb";
import { ExperienceEditor } from "@/components/experiences/ExperienceEditor";

export const metadata: Metadata = { title: "경험 작성·수정 — 포핏 Pofit" };
export default async function ExperienceDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen w-full"
      style={{ backgroundImage: "linear-gradient(147.25deg, var(--color-primary-20) 4.93%, var(--color-primary-40) 91.3%)" }}>
      <div className="flex w-full items-stretch gap-4 p-4 md:gap-8 md:p-8">
        <Lnb />
        <ExperienceEditor id={id} />
      </div>
    </div>
  );
}
