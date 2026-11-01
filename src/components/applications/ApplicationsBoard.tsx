import Link from "next/link";
import { ApplicationCard } from "./ApplicationCard";
import { COLUMNS } from "./kanban-data";

const STATS = [
  {
    icon: "/figma/icon-stat-doc.svg",
    gradient:
      "linear-gradient(-38.11deg, var(--color-primary-50) 5.49%, var(--color-primary-30) 87.93%)",
    value: "3",
    label: "미제출",
  },
  {
    icon: "/figma/icon-stat-urgent.svg",
    gradient:
      "linear-gradient(-28.35deg, var(--color-status-error) 2.49%, var(--color-grayscale-30) 91.86%)",
    value: "1",
    label: "마감임박",
  },
  {
    icon: "/figma/icon-stat-done.svg",
    gradient:
      "linear-gradient(140deg, var(--color-primary-50) 0%, var(--color-primary-80) 92.67%)",
    value: "1",
    label: "제출완료",
  },
  {
    icon: "/figma/icon-stat-total.svg",
    gradient:
      "linear-gradient(143.13deg, var(--color-background-60) 6.12%, var(--color-background-80) 95.41%)",
    value: "6",
    label: "전체 자소서",
  },
];

function StatCard({ stat }: { stat: (typeof STATS)[number] }) {
  return (
    <div className="flex min-w-[220px] flex-1 items-center gap-4 rounded-3xl border border-background-40 bg-background-30 px-6 py-4">
      <div
        className="flex size-14 shrink-0 items-center justify-center rounded-[12px] p-4"
        style={{ backgroundImage: stat.gradient }}
      >
        <span className="block size-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stat.icon} alt="" className="h-full w-full" />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="w-full text-[20px] font-semibold leading-[1.4] tracking-[-0.1px] text-text-primary">
          {stat.value}
        </p>
        <p className="w-full text-[16px] font-normal leading-[1.6] text-text-secondary">
          {stat.label}
        </p>
      </div>
    </div>
  );
}

function ViewToggle() {
  return (
    <div className="flex h-12 w-[172px] shrink-0 items-center rounded-full border border-text-disabled p-1">
      <span className="flex h-full flex-1 items-center justify-center rounded-full bg-primary-80 px-3 py-1 text-center text-[12px] leading-[1.5] tracking-[0.12px] text-text-inverse">
        칸반보드
      </span>
      <span className="flex h-full flex-1 items-center justify-center rounded-full px-3 py-1 text-center text-[12px] leading-[1.5] tracking-[0.12px] text-text-tertiary">
        캘린더
      </span>
    </div>
  );
}

function Banner() {
  return (
    <div
      className="relative flex w-full flex-col gap-2.5 overflow-hidden rounded-[24px] px-6 py-4"
      style={{
        backgroundImage:
          "linear-gradient(91.59deg, var(--color-primary-50) 4.44%, var(--color-primary-80) 86.28%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/banner-deco.png"
        alt=""
        className="pointer-events-none absolute right-0 top-0 h-full w-[40%] object-cover opacity-50 mix-blend-soft-light"
      />
      <div className="relative flex items-center gap-[42px]">
        <div
          className="flex size-16 shrink-0 items-center justify-center rounded-[12px] p-[9px]"
          style={{
            backgroundImage:
              "linear-gradient(153.77deg, rgba(252,252,252,0.7) 10.1%, rgba(188,230,225,0.7) 95.85%)",
          }}
        >
          <span className="block size-[42px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/icon-banner.svg" alt="" className="h-full w-full" />
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="w-full text-[16px] font-semibold leading-[1.5] text-text-inverse">
              오늘 있었던 일도 좋은 경험이 될 수 있어요
            </p>
            <p className="w-full text-[14px] font-normal leading-[1.55] tracking-[0.07px] text-text-disabled">
              거창하지 않아도 괜찮아요. 포핏이 몇 가지만 물어보면, 나머지는 함께 정리해드려요.
            </p>
          </div>
          <Link
            href="/experiences/new"
            className="flex h-12 shrink-0 items-center justify-center rounded-[24px] bg-background-10 px-4 py-3 transition-opacity hover:opacity-90"
          >
            <span className="whitespace-nowrap text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-primary-60">
              새 경험 추가하기 →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SearchBar() {
  return (
    <div className="flex w-full items-center gap-6">
      <div className="flex h-12 min-w-0 flex-1 items-center rounded-[30px] bg-background-40 px-4 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="block size-6 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/icon-search-kanban.svg" alt="" className="h-full w-full" />
          </span>
          <input
            type="text"
            placeholder="키워드, 태그, 작성일로 검색..."
            className="min-w-0 flex-1 bg-transparent text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        </div>
      </div>
      <button
        type="button"
        className="flex h-12 shrink-0 items-center justify-center rounded-[24px] bg-background-100 px-6 py-3"
      >
        <span className="whitespace-nowrap text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-inverse">
          검색하기
        </span>
      </button>
    </div>
  );
}

function DropZone() {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-[9px] rounded-[12px] border-[0.8px] border-dashed border-primary-30 bg-grayscale-10 px-3 py-1"
    >
      <span className="block size-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/icon-add-card.svg" alt="" className="h-full w-full" />
      </span>
      <span className="whitespace-nowrap py-1 text-[12px] font-semibold leading-[1.35] tracking-[0.12px] text-primary-40">
        카드 추가하기
      </span>
    </button>
  );
}

export function ApplicationsBoard() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 rounded-[40px] bg-background-10 px-6 py-8 md:px-[60px]">
      <div className="flex w-full flex-col gap-10">
        {/* Header */}
        <div className="flex w-full flex-wrap items-end justify-between gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h1 className="text-[28px] font-semibold leading-[1.3] tracking-[-0.28px] text-text-primary">
              지원 현황 관리
            </h1>
            <p className="text-[16px] font-normal leading-[1.6] text-text-secondary">
              다양한 방식으로 지원 카드를 관리하고, 일정을 확인해요.
            </p>
          </div>
          <ViewToggle />
        </div>

        {/* Stats */}
        <div className="flex w-full flex-wrap items-center gap-4">
          {STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        <Banner />
        <SearchBar />
      </div>

      {/* Kanban board */}
      <div className="flex w-full items-start gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((col) => (
          <div
            key={col.title}
            className={`flex shrink-0 items-start rounded-3xl p-4 ${col.bg}`}
          >
            <div className="flex w-[228px] flex-col items-center gap-4">
              {/* Column header */}
              <div className="flex w-full items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 shrink-0 rounded-[4px] ${col.dot}`} />
                    <p className="whitespace-nowrap text-[16px] font-semibold leading-[1.5] text-text-primary">
                      {col.title}
                    </p>
                  </div>
                  <p className="min-w-0 flex-1 text-[12px] font-semibold leading-[1.35] tracking-[0.12px] text-text-secondary">
                    ({col.count})
                  </p>
                </div>
                <span className="block size-[22px] shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/figma/icon-col-menu.svg" alt="" className="h-full w-full" />
                </span>
              </div>

              {/* Cards */}
              <div className="flex w-full flex-col gap-[15px]">
                {col.cards.map((card, i) => (
                  <ApplicationCard key={`${col.title}-${i}`} app={card} />
                ))}
                <DropZone />
              </div>
            </div>
          </div>
        ))}

        {/* Empty "add column" */}
        <div className="flex min-h-[232px] shrink-0 items-center rounded-3xl border-[0.8px] border-dashed border-text-tertiary bg-primary-10 p-4">
          <div className="flex w-[66px] flex-col items-center gap-3">
            <span className="block size-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/icon-add-col.svg" alt="" className="h-full w-full" />
            </span>
            <p className="w-full text-center text-[12px] font-semibold leading-[1.35] tracking-[0.12px] text-text-tertiary">
              카드 추가하기
            </p>
          </div>
        </div>
      </div>

      {/* Progress track */}
      <div className="h-[5px] w-full overflow-hidden rounded-[100px] bg-text-disabled">
        <div className="h-[6px] w-[60%] rounded-[100px] bg-[#267e72]" />
      </div>
    </main>
  );
}
