"use client";

import Link from "next/link";

function InlineField({
  label,
  placeholder,
  action,
}: {
  label: string;
  placeholder: string;
  action: string;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label className="text-[14px] font-semibold leading-[1.45] tracking-[0.07px] text-text-primary">
        {label}
      </label>
      <div className="flex h-12 w-full items-center justify-between gap-2 rounded-[24px] border border-grayscale-40 bg-background-30 px-4 py-3 focus-within:ring-2 focus-within:ring-primary-40">
        <input
          type="text"
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[16px] font-normal leading-[1.6] text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
        <button
          type="button"
          className="flex shrink-0 items-center justify-center rounded-[24px] bg-background-70 px-3 py-1"
        >
          <span className="whitespace-nowrap text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-inverse">
            {action}
          </span>
        </button>
      </div>
    </div>
  );
}

export function FindPasswordForm() {
  return (
    <div className="flex min-h-[680px] w-full max-w-[483px] flex-1 flex-col justify-between gap-20 self-stretch">
      <div className="flex w-full flex-1 flex-col gap-8">
        {/* Progress (step 1 of 2) */}
        <div className="flex h-[9px] w-full items-center gap-[23px]">
          <span className="h-[9px] min-w-0 flex-1 rounded-[2px] bg-primary-50" />
          <span className="h-[9px] min-w-0 flex-1 rounded-[2px] bg-primary-20" />
        </div>

        {/* Heading */}
        <div className="flex w-full flex-col gap-8">
          <div className="flex w-full flex-col gap-3.5">
            <div className="flex w-full items-center gap-2">
              <Link href="/login" className="block size-6 shrink-0" aria-label="뒤로">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/figma/icon-back.svg" alt="" className="h-full w-full" />
              </Link>
              <h1 className="min-w-0 flex-1 text-[20px] font-semibold leading-[1.4] tracking-[-0.1px] text-text-primary">
                비밀번호 찾기
              </h1>
            </div>
            <div className="flex w-full items-center px-8">
              <p className="min-w-0 flex-1 text-[16px] font-normal leading-[1.6] text-text-primary">
                비밀번호를 잊으셨나요?
                <br />
                이메일 인증 후 비밀번호 재설정을 진행해주세요.
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="flex w-full flex-col gap-4">
            <InlineField
              label="이메일"
              placeholder="example@email.com"
              action="인증코드 발송"
            />
            <InlineField
              label="이메일 인증코드"
              placeholder="인증코드 6자리를 입력해주세요."
              action="인증하기"
            />
          </div>
        </div>
      </div>

      {/* Next button */}
      <button
        type="button"
        className="flex h-12 w-full items-center justify-center rounded-[24px] bg-background-70 px-4 py-3"
      >
        <span className="text-center text-[14px] font-medium leading-[1.55] tracking-[0.07px] text-text-disabled">
          다음
        </span>
      </button>
    </div>
  );
}
