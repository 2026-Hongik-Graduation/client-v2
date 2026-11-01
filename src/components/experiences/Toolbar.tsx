const SORT_PILLS = ["정렬선택", "사용여부"];
const FILTER_CATEGORIES = [
  "전체",
  "성장·가치관",
  "장단점",
  "학업·직무",
  "협업",
  "도전·극복",
];

export function Toolbar() {
  return (
    <div className="flex w-full flex-col items-start gap-4">
      {/* Search row */}
      <div className="flex w-full flex-wrap content-center items-center gap-x-10 gap-y-4">
        <div className="flex min-w-[320px] flex-1 items-center gap-6">
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-[30px] bg-background-40 px-4 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="block size-6 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/figma/icon-search.svg" alt="" className="h-full w-full" />
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

        <div className="flex h-12 shrink-0 items-start gap-4">
          {SORT_PILLS.map((label) => (
            <button
              key={label}
              type="button"
              className="flex h-12 items-center justify-center gap-[5px] rounded-[24px] border border-grayscale-40 bg-background-40 px-4 py-3"
            >
              <span className="whitespace-nowrap text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-secondary">
                {label}
              </span>
              <span className="block size-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/figma/icon-chevron.svg" alt="" className="h-full w-full" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap items-center gap-[18px]">
        {FILTER_CATEGORIES.map((label, i) => {
          const active = i === 0;
          return (
            <button
              key={label}
              type="button"
              className={`flex items-center justify-center rounded-[24px] px-4 py-2 ${
                active ? "bg-primary-60" : "bg-background-50"
              }`}
            >
              <span
                className={`whitespace-nowrap text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] ${
                  active ? "text-text-inverse" : "text-text-secondary"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
