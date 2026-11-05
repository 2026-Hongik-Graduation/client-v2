import { previewRequest } from "./dev-preview";
import type { CoverLetter } from "./cover-letter-api";

export const STAGES = [
  { code: "PLANNED", label: "지원 예정", bg: "bg-background-40", dot: "bg-background-70" },
  { code: "PREPARING", label: "서류 준비", bg: "bg-primary-20", dot: "bg-primary-50" },
  { code: "SUBMITTED", label: "제출 완료", bg: "bg-primary-30", dot: "bg-primary-50" },
  { code: "CLOSED", label: "전형 종료", bg: "bg-primary-40", dot: "bg-primary-60" },
] as const;
export type Stage = (typeof STAGES)[number]["code"];
export type DocumentResult = "PENDING" | "PASSED" | "FAILED" | null;
export type ApplicationDetail = {
  coverLetterId: string;
  deadline: string | null;
  interviewDate: string | null;
  documentResult: DocumentResult;
  hasResume: boolean;
  hasPortfolio: boolean;
};
export type Board = { stages: Stage[]; columns: Record<Stage, CoverLetter[]> };
type Envelope<T> = { success: boolean; data: T };
export class ApplicationApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "ApplicationApiError"; }
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const preview = previewRequest<T>(path, init);
  if (preview) return preview;
  let response: Response;
  try {
    response = await fetch("/api/" + path, {
      credentials: "same-origin", cache: "no-store", ...init,
      headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    });
  } catch { throw new ApplicationApiError(0, "서버 네트워크 연결을 확인해 주세요."); }
  const payload = await response.json().catch(() => null) as Envelope<T> | null;
  if (!response.ok || !payload?.success) {
    const message = response.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요."
      : response.status === 403 ? "접근 권한이 없습니다."
      : response.status === 404 ? "지원 정보를 찾을 수 없습니다."
      : response.status >= 500 ? "서버에 문제가 발생했습니다."
      : "요청한 내용을 확인해 주세요.";
    throw new ApplicationApiError(response.status, message);
  }
  return payload.data;
}
export const applicationApi = {
  board: () => request<Board>("application-board"),
  move: (id: string, status: Stage) =>
    request<CoverLetter>("application-board/" + encodeURIComponent(id) + "/status", {
      method: "PATCH", body: JSON.stringify({ status }),
    }),
  detail: (id: string) =>
    request<ApplicationDetail>("cover-letters/" + encodeURIComponent(id) + "/application-detail"),
  saveDetail: (id: string, value: Omit<ApplicationDetail, "coverLetterId">) =>
    request<ApplicationDetail>("cover-letters/" + encodeURIComponent(id) + "/application-detail", {
      method: "PUT", body: JSON.stringify(value),
    }),
};
