import { Reveal } from "@/components/Reveal";

const BOXES_LEFT = [
  {
    label: "고민",
    className:
      "bg-gradient-to-br from-grayscale-20 to-grayscale-30 text-background-70",
  },
  {
    label: "정리",
    className:
      "bg-gradient-to-br from-primary-10 to-primary-40 text-black",
  },
];

const BOXES_RIGHT = [
  {
    label: "-->",
    className: "bg-primary-60 text-grayscale-10",
  },
  {
    label: "합격",
    className:
      "bg-gradient-to-tr from-primary-90 to-primary-60 text-grayscale-10",
  },
];

export function IntroStory() {
  return (
    <section className="relative w-full overflow-hidden px-6 lg:px-[60px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/home2-bg.png"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col items-center gap-40 py-[120px]">
        <div className="flex w-full flex-col items-center gap-20">
          {/* Heading + CTA */}
          <div className="flex w-full flex-col items-center gap-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Reveal>
                <h2 className="text-[36px] font-bold leading-[1.3] tracking-[-0.54px] text-text-primary">
                  함께라면,
                  <br />
                  자소서 걱정은 이제 끝이에요
                </h2>
              </Reveal>
              <Reveal delay={0.15}>
                <p className="text-[18px] font-medium leading-[1.45] tracking-[-0.09px] text-text-secondary">
                  포핏은{" "}
                  <span className="font-bold text-text-secondary">
                    경험 정리부터 기업 분석, 지원 일정, 면접 준비
                  </span>
                  까지
                  <br />
                  취업 준비의 모든 순간을 곁에서 함께해요
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.25} y={64}>
              <a
                href="#steps"
                className="flex h-16 items-center justify-center rounded-2xl bg-primary-100 px-12 py-[19px] text-[18px] font-medium leading-[1.45] tracking-[-0.09px] text-text-inverse transition-opacity hover:opacity-90"
              >
                기능 살펴보기 →
              </a>
            </Reveal>
          </div>

          {/* 고민 → 정리 → 합격 */}
          <div className="flex w-full flex-col items-center justify-center gap-4 md:flex-row">
            <div className="flex w-full flex-1 flex-wrap content-center items-center gap-4">
              {BOXES_LEFT.map((box, i) => (
                <Reveal
                  key={box.label}
                  delay={i * 0.12}
                  className="min-w-[140px] flex-1"
                >
                  <div
                    className={`flex h-[199px] items-center justify-center rounded-3xl ${box.className}`}
                  >
                    <span className="whitespace-nowrap text-center text-[44px] font-bold leading-[1.25] tracking-[-0.88px]">
                      {box.label}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="flex w-full flex-1 flex-wrap content-center items-center gap-4">
              {BOXES_RIGHT.map((box, i) => (
                <Reveal
                  key={box.label}
                  delay={0.24 + i * 0.12}
                  className="min-w-[140px] flex-1"
                >
                  <div
                    className={`flex h-[199px] items-center justify-center rounded-3xl ${box.className}`}
                  >
                    <span className="whitespace-nowrap text-center text-[44px] font-bold leading-[1.25] tracking-[-0.88px]">
                      {box.label}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
