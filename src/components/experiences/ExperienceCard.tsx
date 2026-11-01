export type ExperienceStatus = "linked" | "unlinked" | "draft";

export type Experience = {
  category: string;
  /** outer card background color (Tailwind class) by category tier */
  bg: string;
  title: string;
  desc: string;
  updatedAt: string;
  status: ExperienceStatus;
  statusLabel: string;
};

const STATUS_COLOR: Record<ExperienceStatus, string> = {
  linked: "text-status-success",
  unlinked: "text-status-error",
  draft: "text-text-primary",
};

export function ExperienceCard({ exp }: { exp: Experience }) {
  return (
    <div
      className={`flex h-[240px] min-w-0 flex-1 flex-col items-start rounded-[32px] border-[0.8px] border-background-50 ${exp.bg}`}
    >
      <div className="flex h-full w-full flex-1 flex-col gap-[11px]">
        {/* Category tag */}
        <div className="flex items-center pb-1 pl-6 pt-3">
          <span className="flex items-center justify-center rounded-[24px] bg-grayscale-10 px-3 py-1">
            <span className="whitespace-nowrap text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-primary-60">
              {exp.category}
            </span>
          </span>
        </div>

        {/* Inner card */}
        <div className="flex min-h-0 w-full flex-1 flex-col rounded-b-[32px] rounded-t-3xl bg-gradient-to-b from-background-10 to-background-20 px-8 py-4">
          <div className="flex min-h-0 w-full flex-1 flex-col justify-between">
            <div className="flex min-h-0 w-full flex-1 flex-col gap-[10px] overflow-hidden">
              <p className="w-full text-[16px] font-semibold leading-[1.5] text-text-primary">
                {exp.title}
              </p>
              <p className="w-full text-[12px] font-normal leading-[1.5] tracking-[0.12px] text-text-secondary">
                {exp.desc}
              </p>
            </div>
            <div className="flex w-full items-center justify-between">
              <span className="text-[12px] font-normal leading-[1.5] tracking-[0.12px] text-text-tertiary">
                {exp.updatedAt}
              </span>
              <span
                className={`whitespace-nowrap text-right text-[12px] font-normal leading-[1.5] tracking-[0.12px] ${STATUS_COLOR[exp.status]}`}
              >
                {exp.statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
