/** Left-hand branded illustration for the login screen (490 × 680 in Figma). */
export function LoginCard() {
  return (
    <div className="relative hidden h-[680px] w-[490px] shrink-0 lg:block">
      {/* Card background illustration */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/login-card.svg"
        alt=""
        className="absolute inset-0 h-full w-full"
      />

      {/* PoFit wordmark */}
      <div className="absolute left-[34px] top-[34px] h-[26px] w-[131px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/login-card-logo.svg" alt="PoFit" className="h-full w-full" />
      </div>

      {/* Check badge */}
      <div className="absolute left-[374px] top-[176px] flex size-[57px] items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/login-check-circle.svg" alt="" className="absolute inset-0 h-full w-full" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/login-check.svg" alt="" className="relative h-[18px] w-[27px]" />
      </div>

      {/* Headline */}
      <p className="absolute left-[34px] top-[429px] whitespace-nowrap text-[36px] font-bold leading-[1.3] tracking-[-0.54px] text-text-inverse">
        내 경험에 딱 맞는 자소서,
        <br />
        POFIT이 함께 만들어요.
      </p>

      {/* Subtitle */}
      <p className="absolute left-[39px] top-[542px] whitespace-nowrap text-[16px] font-normal leading-[1.6] text-text-disabled">
        지원 기업과 직무에 맞는 경험을 찾아,
        <br />
        원하는 기업에 핏한 자소서로 완성해보세요.
      </p>
    </div>
  );
}
