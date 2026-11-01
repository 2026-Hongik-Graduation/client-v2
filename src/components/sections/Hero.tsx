"use client";

import { motion } from "motion/react";

function ReportCard() {
  return (
    <motion.div
      className="absolute left-[5.18%] right-[50.23%] top-[92px] flex flex-col items-start rounded-[20px] bg-white px-6 py-8 drop-shadow-[0px_30px_30px_rgba(9,27,24,0.16)]"
      initial={{ opacity: 0, y: -43 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.9, ease: [0.7, -0.4, 0.4, 1.4] }}
    >
      <div className="flex w-full flex-col items-start gap-3">
        {/* Brand row */}
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/rc-logo.svg" alt="" className="h-full w-full" />
          </div>
          <div className="flex w-[125px] flex-col items-start gap-px">
            <p className="w-full text-[18px] font-bold leading-[1.45] tracking-[-0.09px] text-primary-90">
              포핏 Pofit
            </p>
            <p className="w-full text-[12px] font-normal leading-[1.5] tracking-[0.12px] text-text-tertiary">
              당신의 자소서 작성 메이트
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-[315px] bg-primary-20" />

        <div className="flex w-full flex-col items-start gap-4">
          {/* 인재상 */}
          <motion.div
            className="flex w-full flex-col items-start gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.3 }}
          >
            <p className="w-full text-[12px] font-semibold leading-[1.35] tracking-[0.12px] text-text-tertiary">
              인재상
            </p>
            <div className="flex w-[175px] flex-wrap content-center items-center gap-2">
              {["맞춤형", "체계적", "연결성"].map((tag) => (
                <span
                  key={tag}
                  className="flex flex-1 items-center justify-center whitespace-nowrap rounded-[100px] bg-primary-20 px-3 py-1 text-[11px] font-normal leading-[1.3] tracking-[0.165px] text-primary-60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* 최근 이슈 */}
          <motion.div
            className="flex w-full flex-col items-start gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.6 }}
          >
            <p className="w-full text-[12px] font-semibold leading-[1.35] tracking-[0.12px] text-text-tertiary">
              최근 이슈
            </p>
            <div className="flex w-full items-center justify-center rounded-[10px] bg-[#f5f6f6] px-3 py-2">
              <p className="flex-1 whitespace-pre-wrap text-[12px] font-normal leading-[1.5] tracking-[0.12px] text-text-secondary">
                경험을 정리하는 순간부터 면접을 준비하는 순간까지,
                <br aria-hidden />
                {` 포핏이 취업 준비의 모든 과정을 함께해요.`}
              </p>
            </div>
          </motion.div>

          {/* 추천 키워드 */}
          <motion.div
            className="flex w-full flex-col items-start gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.9 }}
          >
            <p className="w-full text-[12px] font-semibold leading-[1.35] tracking-[0.12px] text-text-tertiary">
              추천 키워드
            </p>
            <div className="flex w-[215px] flex-wrap content-center items-center gap-2">
              {["경험정리", "자소서생성", "기업분석"].map((tag) => (
                <span
                  key={tag}
                  className="flex flex-1 items-center justify-center whitespace-nowrap rounded-[100px] bg-primary-20 px-3 py-1 text-[11px] font-normal leading-[1.3] tracking-[0.165px] text-primary-60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function MacbookMockup() {
  return (
    <motion.div
      className="absolute left-[calc(50%+256px)] top-[calc(50%+33px)] h-[592px] w-[982px] -translate-x-1/2 drop-shadow-[0px_10px_20px_rgba(0,0,0,0.5)]"
      initial={{ x: 635 }}
      animate={{ x: 0 }}
      transition={{ duration: 1, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Body (bottom deck) */}
      <div className="absolute inset-[93.16%_0_0_0]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/macbook-body.svg" alt="" className="h-full w-full" />
      </div>

      {/* Display */}
      <div className="absolute inset-[0_5.91%_6.84%_8.88%] contents">
        <div className="absolute inset-[0_8.81%_6.84%_8.88%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/macbook-screen.svg" alt="" className="h-full w-full" />
        </div>

        {/* Screen contents */}
        <div className="absolute left-[calc(50%+24.86px)] top-[calc(50%-12.5px)] -translate-x-1/2 -translate-y-1/2 contents">
          <div
            className="absolute left-[calc(50%+24.86px)] top-[calc(50%-12.5px)] h-[529px] w-[816.285px] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
            style={{
              backgroundImage:
                "linear-gradient(-42.72deg, var(--color-primary-20) 25.809%, var(--color-primary-40) 82.427%)",
            }}
          >
            <ReportCard />
          </div>
        </div>

        {/* Notch */}
        <div className="absolute inset-[2.47%_45.21%_95.28%_45.31%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/macbook-notch.svg" alt="" className="h-full w-full" />
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="w-full bg-grayscale-10">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap content-start items-start justify-center gap-8 px-6 py-6 lg:h-[828px] lg:px-[60px]">
        {/* Left: headline + CTAs */}
        <div className="flex h-[760px] w-full max-w-[644px] flex-col items-start justify-center rounded-[24px] bg-gradient-to-b from-primary-20 to-primary-30 px-8 py-[224px] md:px-12 lg:w-[644px]">
          <div className="flex flex-col items-start justify-center gap-16">
            <div className="flex flex-col items-start gap-4">
              <p className="text-[18px] font-medium leading-[1.45] tracking-[-0.09px] text-text-primary">
                어떤 경험을 선택할지 막막하고,
                <br />
                자소서는 늘 비슷하고, 기업분석은 어렵다면
              </p>
              <div className="flex items-center">
                <div className="flex items-center gap-3">
                  <div className="h-[35.505px] w-[137.122px] shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/figma/logo-pofit-hero.svg"
                      alt="포핏"
                      className="h-full w-full"
                    />
                  </div>
                  <p className="whitespace-nowrap text-[36px] font-bold leading-[1.3] tracking-[-0.54px] text-text-primary">
                    과 함께하세요.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-start gap-4">
              <a
                href="#"
                className="flex w-full items-center justify-center rounded-full bg-primary-60 px-10 py-4 text-center text-[18px] font-medium leading-[1.45] tracking-[-0.09px] text-text-inverse transition-opacity hover:opacity-90"
              >
                내 경험 정리하러가기
              </a>
              <a
                href="#"
                className="flex w-full items-center justify-center rounded-full bg-background-10 px-10 py-4 text-center text-[18px] font-medium leading-[1.45] tracking-[-0.09px] text-text-secondary transition-opacity hover:opacity-90"
              >
                자소서 생성하러 가기
              </a>
            </div>
          </div>
        </div>

        {/* Right: device mockup */}
        <div className="relative h-[760px] w-full max-w-[644px] overflow-hidden rounded-[24px] lg:w-[644px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/figma/hero-bg.png"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full rounded-[24px] object-cover"
          />
          <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-t from-primary-10 to-[rgba(252,252,252,0.3)]" />
          <MacbookMockup />
        </div>
      </div>
    </section>
  );
}
