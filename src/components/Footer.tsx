export function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-primary-10 to-primary-20 px-6 py-12 lg:px-[60px]">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col items-start gap-9">
        <div className="flex w-full items-start justify-between">
          <div className="h-[24.857px] w-24 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/logo-footer.svg" alt="포핏" className="h-full w-full" />
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-2">
          <p className="w-full text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-primary">
            이용약관 · 개인정보처리방침 · 문의하기
          </p>
          <div className="flex w-full items-end gap-11">
            <p className="flex-1 text-[12px] font-normal leading-[1.5] tracking-[0.12px] text-text-secondary">
              © 2026 POFIT. All rights reserved.
            </p>
            <div className="flex items-center gap-[11px]">
              <a href="#" aria-label="Instagram" className="block size-6 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/figma/icon-instagram.svg" alt="" className="h-full w-full" />
              </a>
              <a href="#" aria-label="Facebook" className="block size-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/figma/icon-facebook.svg" alt="" className="h-full w-full" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
