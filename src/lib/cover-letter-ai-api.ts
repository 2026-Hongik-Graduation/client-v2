import { previewRequest } from "./dev-preview";
import { CoverApiError } from "./cover-letter-api";

export const QUESTION_TYPES = [
  { code: "MOTIVATION", label: "지원 동기" },
  { code: "JOB_COMPETENCY", label: "직무 역량" },
  { code: "COLLABORATION", label: "협업" },
  { code: "PROBLEM_SOLVING", label: "문제 해결" },
  { code: "CHALLENGE", label: "도전" },
  { code: "STRENGTH_WEAKNESS", label: "성격의 장단점" },
  { code: "GROWTH", label: "성장 과정" },
  { code: "FUTURE_PLAN", label: "입사 후 포부" },
] as const;
export type QuestionType = typeof QUESTION_TYPES[number]["code"];
export const REVISION_TYPES = [
  { code: "GENERAL", label: "전체 다듬기" },
  { code: "LOGIC", label: "논리 개선" },
  { code: "CONCISE", label: "간결하게" },
  { code: "JOB_FIT", label: "직무 적합성" },
  { code: "GRAMMAR", label: "문장·맞춤법" },
  { code: "IMPACT", label: "성과 강조" },
] as const;
export type RevisionType = typeof REVISION_TYPES[number]["code"];

export type AiMetadata = {
  warnings: string[]; provider: string; isMock: boolean;
  promptVersion: string; correlationId?: string;
};
export type ClassificationPreview = AiMetadata & {
  questionType: QuestionType; evaluationIntent: string;
  evidenceQuote: string; recommendedSkills: string[];
};
export type StrategyPreview = AiMetadata & {
  strengths: string[]; evidenceGaps: string[]; nextActions: string[];
};
export type TextPreview = AiMetadata & {
  text: string; characterCount: number; characterLimit: number;
  usedExperienceIds: string[]; changeReasons: string[];
};
export type EditingTurn = {
  sequenceNo: number; requestId: string; questionType: QuestionType;
  experienceIds: string[]; originalText: string; instruction: string;
  revisionType: RevisionType; revisedText: string; characterCount: number;
  changeReasons: string[]; warnings: string[]; provider: string;
  isMock: boolean; promptVersion: string; createdAt: string;
};
type Envelope<T> = { success: boolean; data: T; message?: string; errorCode?: string };
async function call<T>(path: string, init: RequestInit): Promise<T> {
  const preview = previewRequest<T>(path, init);
  if (preview) return preview;
  let response: Response;
  try {
    response = await fetch("/api/" + path, {
      credentials: "same-origin", cache: "no-store", ...init,
      headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    });
  } catch { throw new CoverApiError(0, "서버 연결을 확인해 주세요."); }
  const body = await response.json().catch(() => null) as Envelope<T> | null;
  if (!response.ok || !body?.success) {
    const message = response.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요."
      : response.status === 403 ? "이 문항의 AI 요청 권한이 없습니다."
      : response.status === 404 ? "자소서 또는 문항을 찾을 수 없습니다."
      : response.status === 429 ? "AI 요청이 많습니다. 잠시 후 다시 시도해 주세요."
      : response.status >= 500 ? "AI 서비스가 일시적으로 응답하지 않습니다."
      : "요청 내용을 확인해 주세요. 선택한 경험이 연결·요약되었는지도 확인해 주세요.";
    throw new CoverApiError(response.status, message);
  }
  return body.data;
}
function path(coverId: string, questionId: string, action: string) {
  return `cover-letters/${encodeURIComponent(coverId)}/questions/${encodeURIComponent(questionId)}/${action}`;
}
function post<T>(url: string, data?: unknown) {
  return call<T>(url, { method: "POST", ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
}
export const coverAiApi = {
  analyze: (coverId: string, questionId: string) =>
    post<ClassificationPreview>(path(coverId, questionId, "analyze")),
  strategy: (coverId: string, questionId: string, questionType: QuestionType, experienceIds: string[]) =>
    post<StrategyPreview>(path(coverId, questionId, "strategy"), { questionType, experienceIds }),
  draft: (coverId: string, questionId: string, questionType: QuestionType, experienceIds: string[]) =>
    post<TextPreview>(path(coverId, questionId, "draft"), { questionType, experienceIds }),
  revise: (coverId: string, questionId: string, input: {
    questionType: QuestionType; experienceIds: string[];
    originalText: string; revisionType: RevisionType; instruction: string;
  }) => post<TextPreview>(path(coverId, questionId, "revise"), input),
  history: async (coverId: string, questionId: string) => {
    const url = path(coverId, questionId, "ai-chat/turns");
    const first = await call<EditingTurn[]>(url + "?page=0&size=50", { method: "GET" });
    if (first.length < 50) return first;
    const second = await call<EditingTurn[]>(url + "?page=1&size=50", { method: "GET" });
    return [...first, ...second];
  },
  chat: (coverId: string, questionId: string, input: {
    questionType: QuestionType; experienceIds: string[]; currentDraft: string;
    revisionType: RevisionType; instruction: string; requestId: string;
  }) => post<EditingTurn>(path(coverId, questionId, "ai-chat/turns"), input),
};
