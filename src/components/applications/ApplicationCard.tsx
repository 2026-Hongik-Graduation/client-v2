export type StatusVariant =
  | "pending" // 미제출
  | "submitted" // 제출 완료
  | "pass" // 합격
  | "waiting" // 발표 대기
  | "fail"; // 불합격

const STATUS_STYLE: Record<StatusVariant, string> = {
  pending: "bg-background-40 text-text-secondary",
  submitted: "bg-primary-20 text-status-success",
  pass: "bg-primary-20 text-status-success",
  waiting: "bg-background-70 text-text-inverse",
  fail: "bg-[rgba(239,68,68,0.2)] text-status-error",
};

export type Application = {
  role: string;
  company: string;
  /** number of filled segments out of 4; omit to hide the progress block */
  progress?: number;
  status: StatusVariant;
  statusLabel: string;
  meta: string;
  metaColor?: "error" | "muted";
  highlighted?: boolean;
};

function CompanyLogo() {
  return (
    <div
      className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px]"
      style={{
        backgroundImage:
          "linear-gradient(-23.66deg, var(--color-background-40) 15.38%, var(--color-background-10) 81.24%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/card-company-logo.png" alt="" className="size-7 object-contain" />
    </div>
  );
}

function Progress({ filled }: { filled: number }) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-background-40 p-3">
      <div className="flex h-[9px] w-full items-center gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-[9px] min-w-0 flex-1 rounded-full ${
              i < filled ? "bg-primary-50" : "bg-primary-20"
            }`}
          />
        ))}
      </div>
      <div className="flex w-full items-center gap-[9px] text-[14px] tracking-[0.07px] text-text-secondary">
        <span className="whitespace-nowrap">
          문항 <span className="font-semibold">{filled * 25}%</span>
        </span>
        <span className="flex-1 text-right font-normal leading-[1.55]">작성 완료</span>
      </div>
    </div>
  );
}

export function ApplicationCard({ app }: { app: Application }) {
  return (
    <div
      className={`flex w-full flex-col items-start rounded-2xl bg-background-10 p-4 ${
        app.highlighted
          ? "border-[0.8px] border-primary-60"
          : "border-[0.8px] border-background-50"
      }`}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full items-center gap-4">
            <CompanyLogo />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
              <p className="w-full text-[14px] font-semibold leading-[1.45] tracking-[0.07px] text-text-primary">
                {app.role}
              </p>
              <p className="w-full text-[12px] font-normal leading-[1.5] tracking-[0.12px] text-text-secondary">
                {app.company}
              </p>
            </div>
          </div>
          {app.progress !== undefined && <Progress filled={app.progress} />}
        </div>

        <div className="flex w-full items-center justify-between">
          <span
            className={`flex items-center justify-center rounded-[24px] px-3 py-1 text-[14px] font-medium leading-[1.55] tracking-[0.07px] ${STATUS_STYLE[app.status]}`}
          >
            {app.statusLabel}
          </span>
          <span
            className={`text-right text-[12px] font-normal leading-[1.5] tracking-[0.12px] ${
              app.metaColor === "error" ? "text-status-error" : "text-primary-70"
            }`}
          >
            {app.meta}
          </span>
        </div>
      </div>
    </div>
  );
}
