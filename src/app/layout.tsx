import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "포핏 Pofit — 당신의 자소서 작성 메이트",
  description:
    "경험 정리부터 기업 분석, 지원 일정, 면접 준비까지. 취업 준비의 모든 순간을 곁에서 함께하는 포핏.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-grayscale-10 text-text-primary">
        {children}
      </body>
    </html>
  );
}
