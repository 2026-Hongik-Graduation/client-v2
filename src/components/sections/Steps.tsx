import { Reveal } from "@/components/Reveal";
import type { ReactNode } from "react";

type StepRowProps = {
  kicker: string;
  title: string;
  desc: ReactNode;
  visual: ReactNode;
  reverse?: boolean;
  fromX: number;
};

function StepRow({ kicker, title, desc, visual, reverse, fromX }: StepRowProps) {
  return (
    <Reveal x={fromX} amount={0.4}>
      <div
        className={`flex flex-col items-center gap-10 md:gap-16 ${
          reverse ? "md:flex-row-reverse" : "md:flex-row"
        }`}
      >
        <div className="w-full shrink-0 md:w-[300px]">{visual}</div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-4">
          <div className="flex w-full flex-col gap-3">
            <p className="text-[18px] font-bold leading-[1.45] tracking-[-0.09px] text-primary-60">
              {kicker}
            </p>
            <h3 className="text-[28px] font-semibold leading-[1.3] tracking-[-0.28px] text-text-primary">
              {title}
            </h3>
          </div>
          <p className="w-full text-[18px] font-semibold leading-[1.45] tracking-[-0.09px] text-text-secondary">
            {desc}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function Divider() {
  return (
    <div className="h-px w-full bg-primary-30/70" aria-hidden />
  );
}

export function Steps() {
  return (
    <section
      id="steps"
      className="w-full overflow-x-clip bg-gradient-to-b from-grayscale-10 to-primary-20 px-6 lg:px-[60px]"
    >
      <div className="mx-auto w-full max-w-[1320px] py-[120px]">
        <div className="flex w-full flex-col items-start gap-10">
          <h2 className="text-[28px] font-semibold leading-[1.3] tracking-[-0.28px] text-text-primary">
            고민에서 합격까지, 단 4단계
          </h2>

          <div className="flex w-full flex-col gap-10">
            <StepRow
              fromX={-80}
              kicker="01 경험정리"
              title="흩어진 경험을 한 곳에"
              desc={
                <>
                  어떤 경험을 써야할지 몰라도 괜찮아요. 포핏이 질문을 던지며
                  이끌어내도록 도와주고, 자소서에 바로 쓸 수 있는 섹션 문장으로
                  정리해드려요.
                </>
              }
              visual={
                <div className="flex h-[224px] items-center justify-center rounded-3xl bg-gradient-to-b from-primary-80 to-primary-60 p-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/figma/step01-icon.svg"
                    alt=""
                    className="h-[96px] w-[116px]"
                  />
                </div>
              }
            />

            <Divider />

            <StepRow
              reverse
              fromX={80}
              kicker="02 자소서 관리"
              title="초안부터 첨삭까지 한번에"
              desc={
                <>
                  기업을 상세하게 분석해주고, 공고의 문항별로 자세한 초안을
                  생성해요. 여러 버전을 비교하며 최적의 자소서를 완성할 수 있어요.
                </>
              }
              visual={
                <div
                  className="flex h-[224px] items-center justify-center rounded-3xl p-16"
                  style={{
                    backgroundImage:
                      "linear-gradient(-34.18deg, var(--color-primary-50) 0.4%, var(--color-primary-60) 91.9%)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/figma/step02-icon.svg"
                    alt=""
                    className="h-[116px] w-[111px]"
                  />
                </div>
              }
            />

            <Divider />

            <StepRow
              fromX={-80}
              kicker="03 지원 현황"
              title="어지러운 지원 현황을 한눈에 관리"
              desc={
                <>
                  서류부터 면접까지 전형 단계를 보드로 확인해요. 마감일이 다가오면
                  알려드리니 일정을 놓칠 걱정이 없어요.
                </>
              }
              visual={
                <div className="h-[224px] w-full overflow-hidden rounded-3xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/figma/step03-img.svg"
                    alt=""
                    className="h-full w-full"
                  />
                </div>
              }
            />

            <Divider />

            <StepRow
              reverse
              fromX={80}
              kicker="04 면접 준비"
              title="내 자소서 기반 예상 질문 연습"
              desc={
                <>
                  제출한 자소서를 바탕으로 나올 법한 질문을 뽑아드려요. 실전처럼
                  답변을 연습하고 피드백을 받아보세요.
                </>
              }
              visual={
                <div className="h-[224px] w-full overflow-hidden rounded-3xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/figma/step04-img.svg"
                    alt=""
                    className="h-full w-full"
                  />
                </div>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
