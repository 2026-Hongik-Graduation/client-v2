import type { Application } from "./ApplicationCard";

export type Column = {
  title: string;
  count: number;
  /** column container background */
  bg: string;
  /** header status dot color */
  dot: string;
  cards: Application[];
};

const CARD = { role: "백엔드 개발자", company: "토스" };

export const COLUMNS: Column[] = [
  {
    title: "제출",
    count: 2,
    bg: "bg-background-40",
    dot: "bg-background-70",
    cards: [
      { ...CARD, progress: 1, status: "pending", statusLabel: "미제출", meta: "D-3", metaColor: "error", highlighted: true },
      { ...CARD, status: "submitted", statusLabel: "제출 완료", meta: "D-Day" },
      { ...CARD, progress: 1, status: "pending", statusLabel: "미제출", meta: "D-30" },
    ],
  },
  {
    title: "서류",
    count: 2,
    bg: "bg-primary-20",
    dot: "bg-primary-50",
    cards: [
      { ...CARD, status: "pass", statusLabel: "합격", meta: "1주 전" },
      { ...CARD, status: "waiting", statusLabel: "발표 대기", meta: "1주 전" },
      { ...CARD, status: "fail", statusLabel: "불합격", meta: "1주 전" },
    ],
  },
  {
    title: "면접",
    count: 2,
    bg: "bg-primary-30",
    dot: "bg-primary-50",
    cards: [{ ...CARD, status: "pass", statusLabel: "합격", meta: "1주 전" }],
  },
  {
    title: "최종",
    count: 2,
    bg: "bg-primary-40",
    dot: "bg-primary-50",
    cards: [{ ...CARD, status: "pass", statusLabel: "합격", meta: "1주 전" }],
  },
];
