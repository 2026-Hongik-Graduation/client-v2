const NAV_ITEMS = ["경험정리", "자소서 관리", "지원현황", "면접"];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-grayscale-10/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-2">
        {/* Left: logo + primary nav */}
        <div className="flex flex-1 items-center gap-8">
          <a href="#" className="block h-12 w-[70px] shrink-0" aria-label="포핏 홈">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/figma/logo-header.svg"
              alt="포핏"
              className="h-full w-full object-contain"
            />
          </a>
          <nav className="hidden items-center gap-4 md:flex">
            {NAV_ITEMS.map((label) => (
              <a
                key={label}
                href="#"
                className="flex items-center justify-center whitespace-nowrap p-4 text-[14px] font-medium tracking-[0.07px] text-text-secondary transition-colors hover:text-text-primary"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right: auth pills */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="flex flex-col items-center justify-center rounded-[24px] bg-primary-20 px-3 py-1 transition-opacity hover:opacity-90"
          >
            <span className="whitespace-nowrap text-center text-[14px] font-medium tracking-[0.07px] text-status-success">
              회원가입하기
            </span>
          </a>
          <a
            href="#"
            className="flex flex-col items-center justify-center rounded-[24px] bg-primary-60 px-3 py-1 transition-opacity hover:opacity-90"
          >
            <span className="whitespace-nowrap text-center text-[14px] font-medium tracking-[0.07px] text-text-inverse">
              로그인하기
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
