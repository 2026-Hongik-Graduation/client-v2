"use client";
import { useSyncExternalStore } from "react";
import { isPreviewMode } from "@/lib/dev-preview";
const subscribe = () => () => {};
const serverSnapshot = () => false;

export function PreviewBadge() {
  const preview = useSyncExternalStore(subscribe, isPreviewMode, serverSnapshot);
  return preview ? (
    <span className="rounded-lg border border-amber-300 bg-amber-100 px-1 py-1 text-center text-[10px] font-semibold leading-tight text-amber-800"
      title="이 화면은 브라우저 로컬 미리보기 데이터만 사용합니다. EC2에는 저장되지 않습니다.">
      미리보기
    </span>
  ) : null;
}
