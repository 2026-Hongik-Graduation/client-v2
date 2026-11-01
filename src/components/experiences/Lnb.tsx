import Link from "next/link";

type NavItem = {
  label: string;
  /** step number for inactive items; active item shows the brand dot */
  step?: number;
  href: string;
  active?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "경험", href: "/experiences", active: true },
  { label: "자소서", step: 2, href: "#" },
  { label: "지원", step: 3, href: "#" },
  { label: "면접", step: 4, href: "#" },
];

export function Lnb() {
  return (
    <nav className="flex w-[72px] shrink-0 flex-col items-center gap-40 rounded-2xl bg-gradient-to-t from-background-100 to-primary-90 px-3 py-6 drop-shadow-[0px_0px_7.5px_rgba(15,51,47,0.15)]">
      {/* Brand mark */}
      <Link href="/" className="block h-[22px] w-10 shrink-0" aria-label="포핏 홈">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/lnb-logo.svg" alt="포핏" className="h-full w-full" />
      </Link>

      {/* Steps */}
      <div className="flex w-full flex-col items-center gap-6">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex w-full flex-col items-center gap-1"
          >
            {item.active ? (
              <span className="block size-10 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/figma/lnb-dot.svg" alt="" className="h-full w-full" />
              </span>
            ) : (
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-background-90">
                <span className="text-[12px] font-semibold leading-[1.35] tracking-[0.12px] text-text-tertiary">
                  {item.step}
                </span>
              </span>
            )}
            <span
              className={`text-center text-[12px] leading-[1.5] tracking-[0.12px] ${
                item.active
                  ? "font-semibold text-text-inverse"
                  : "font-normal text-text-tertiary"
              }`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Profile */}
      <button type="button" className="size-9 shrink-0" aria-label="내 프로필">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/lnb-profile.svg" alt="" className="h-full w-full" />
      </button>
    </nav>
  );
}
