import Link from "next/link";
import type { ExperienceRecord } from "@/lib/experience-api";
import { tagInfo } from "@/lib/experience-api";

const CATEGORY_BARS = [
  { label: "STAR", fill: "bg-primary-30", value: "16%" },
  { label: "성장·가치관", fill: "bg-primary-40", value: "16%" },
  { label: "장단점", fill: "bg-primary-50", value: "16%" },
  { label: "협업", fill: "bg-primary-70", value: "16%" },
  { label: "학업·직무", fill: "bg-background-60", value: "16%" },
  { label: "도전·극복", fill: "bg-background-80", value: "16%" },
];

function AddExperiencePanel() {
  return (
    <div
      className="relative flex h-[304px] w-full min-w-0 flex-1 flex-col items-start overflow-hidden rounded-3xl border-[0.8px] border-white/80 p-8 drop-shadow-[0px_0px_15px_rgba(15,51,47,0.15)]"
      style={{
        backgroundImage:
          "linear-gradient(124.88deg, var(--color-primary-50) 6.2%, var(--color-primary-80) 84.76%)",
      }}
    >
      {/* Decorative overlay */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/exp-add-bg.png"
        alt=""
        className="pointer-events-none absolute right-0 top-0 h-full w-[60%] object-cover opacity-50 mix-blend-soft-light"
      />

      <div className="relative flex h-full w-full flex-1 flex-col justify-between gap-8">
        <div className="flex w-full flex-col items-start gap-4">
          <div
            className="flex size-12 items-center justify-center rounded-[12px] p-[9px]"
            style={{
              backgroundImage:
                "linear-gradient(153.77deg, rgba(252,252,252,0.7) 10.1%, rgba(188,230,225,0.7) 95.85%)",
            }}
          >
            <span className="block size-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/exp-add-icon.svg" alt="" className="h-full w-full" />
            </span>
          </div>
          <div className="flex w-full flex-col items-start gap-2">
            <p className="w-full text-[18px] font-bold leading-[1.45] tracking-[-0.09px] text-text-inverse">
              오늘 있었던 일도 좋은 경험이 될 수 있어요
            </p>
            <p className="w-full text-[12px] font-normal leading-[1.5] tracking-[0.12px] text-text-disabled">
              거창하지 않아도 괜찮아요. 포핏이 함께 정리해드려요.
            </p>
          </div>
        </div>

        <Link
          href="/experiences/new"
          className="flex h-12 items-center justify-center self-start rounded-[24px] bg-background-10 px-4 py-3 transition-opacity hover:opacity-90"
        >
          <span className="whitespace-nowrap text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-primary-60">
            새 경험 추가하기 →
          </span>
        </Link>
      </div>
    </div>
  );
}

function CategoryDistribution({ experiences }: { experiences: ExperienceRecord[] }) {
  return (
    <div className="flex h-[304px] w-full min-w-0 flex-1 flex-col items-start gap-4 sm:min-w-[457px] rounded-3xl border-[0.8px] border-white/80 bg-white/70 p-4 sm:p-8 shadow-[0px_0px_30px_0px_rgba(15,51,47,0.15)]">
      <div className="flex w-full flex-col items-start gap-2">
        <p className="w-full text-[16px] font-semibold leading-[1.5] text-text-primary">
          경험 카테고리 분포
        </p>
        <p className="w-full text-[12px] font-normal leading-[1.5] tracking-[0.12px] text-text-secondary">
          지금까지 쌓은 {experiences.length}개의 경험이 이렇게 나뉘어 있어요
        </p>
      </div>

      <div className="flex w-full flex-1 flex-col items-start gap-2">
        {CATEGORY_BARS.map((bar) => {
          const count = experiences.filter(e => tagInfo(e.tagCode).label === bar.label).length;
          const percent = experiences.length ? Math.round(count / experiences.length * 100) : 0;
          return (
          <div key={bar.label} className="flex w-full items-center gap-2 sm:gap-6">
            <div className="flex w-16 shrink-0 items-center p-1">
              <span className="whitespace-nowrap text-[11px] font-normal leading-[1.3] tracking-[0.165px] text-text-secondary">
                {bar.label}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-[14px]">
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-[100px] bg-background-30">
                <div className={`h-2 rounded-[100px] ${bar.fill}`} style={{ width: percent + "%" }} />
              </div>
              <span className="whitespace-nowrap text-right text-[12px] font-bold leading-[16.8px] text-text-primary">
                {percent}%
              </span>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}

export function TopPanels({ experiences }: { experiences: ExperienceRecord[] }) {
  return (
    <div className="flex w-full flex-col gap-8 sm:flex-row sm:flex-wrap sm:content-center sm:items-center sm:justify-center">
      <AddExperiencePanel />
      <CategoryDistribution experiences={experiences} />
    </div>
  );
}
