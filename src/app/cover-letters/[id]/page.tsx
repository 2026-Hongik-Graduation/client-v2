import type { Metadata } from "next";
import { Lnb } from "@/components/experiences/Lnb";
import { CoverLetterEditor } from "@/components/cover-letters/CoverLetterEditor";
export const metadata: Metadata = { title: "자기소개서 편집 — POFIT" };
export default async function CoverLetterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen w-full" style={{ backgroundImage:
      "linear-gradient(147.25deg, var(--color-primary-20) 4.93%, var(--color-primary-40) 91.3%)" }}>
      <div className="flex items-stretch gap-4 p-4 md:gap-8 md:p-8">
        <Lnb active="자소서" />
        <CoverLetterEditor id={id} />
      </div>
    </div>
  );
}
