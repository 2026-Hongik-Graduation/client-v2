export const TAGS = [
  { code: "STAR", label: "STAR", bg: "bg-primary-20" },
  { code: "GROWTH_VALUES", label: "성장·가치관", bg: "bg-primary-30" },
  { code: "STRENGTH_WEAKNESS", label: "장단점", bg: "bg-primary-40" },
  { code: "COLLABORATION", label: "협업", bg: "bg-primary-50" },
  { code: "ACADEMIC_CAREER", label: "학업·직무", bg: "bg-primary-70" },
  { code: "CHALLENGE", label: "도전·극복", bg: "bg-primary-80" },
] as const;
export type TagCode = (typeof TAGS)[number]["code"];
export type ExperienceStatus = "DRAFT" | "COMPLETED";
export type ExperienceRecord = {
  id: string; tagCode: TagCode; title: string; startedAt: string | null;
  endedAt: string | null; status: ExperienceStatus; summary: string | null;
  updatedAt: string; creationMethod: string;
};
export type ExperienceQuestion = {
  id: string; code: string; label: string; prompt: string;
  required: boolean; displayOrder: number;
};
export type ExperienceAnswer = {
  questionId: string | null; customLabel: string | null;
  content: string | null; displayOrder: number;
};
export type ExperienceDetail = {
  experience: ExperienceRecord; answers: ExperienceAnswer[]; progress: number;
};
export type ExperienceInput = {
  title: string; tagCode: TagCode; creationMethod: "QUICK";
  startedAt: string | null; endedAt: string | null;
};
export type AnswerInput = {
  questionId?: string; customLabel?: string; content: string; displayOrder: number;
};
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
type Envelope<T> = { success: boolean; data: T };
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api/" + path, {
      credentials: "same-origin", cache: "no-store", ...init,
      headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    });
  } catch {
    throw new ApiError(0, "네트워크나 백엔드 연결을 확인해 주세요.");
  }
  const payload = await response.json().catch(() => null) as Envelope<T> | null;
  if (!response.ok || !payload?.success) {
    const message = response.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요."
      : response.status === 403 ? "접근 권한이 없습니다."
      : response.status === 404 ? "경험을 찾을 수 없습니다."
      : response.status >= 500 ? "서버 연결이나 상태를 확인해 주세요."
      : "입력값을 확인하고 다시 시도해 주세요.";
    throw new ApiError(response.status, message);
  }
  return payload.data;
}
const json = (data: unknown) => JSON.stringify(data);
const item = (id: string) => "experiences/" + encodeURIComponent(id);
export const experienceApi = {
  list: (filters: { keyword?: string; tagCode?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
    query.set("size", "100");
    return request<ExperienceRecord[]>("experiences?" + query);
  },
  questions: (tag: TagCode) => request<ExperienceQuestion[]>("experience-tags/" + tag + "/questions"),
  detail: (id: string) => request<ExperienceDetail>(item(id)),
  create: (input: ExperienceInput) => request<ExperienceRecord>("experiences", { method: "POST", body: json(input) }),
  patch: (id: string, input: { title: string; summary: string; startedAt: string | null; endedAt: string | null }) =>
    request<ExperienceRecord>(item(id), { method: "PATCH", body: json(input) }),
  saveAnswers: (id: string, answers: AnswerInput[]) =>
    request<ExperienceAnswer[]>(item(id) + "/answers", { method: "PUT", body: json({ answers }) }),
  setStatus: (id: string, status: ExperienceStatus) =>
    request<ExperienceRecord>(item(id) + "/status", { method: "PATCH", body: json({ status }) }),
  delete: (id: string) => request<{ deleted: boolean }>(item(id), { method: "DELETE" }),
};
export const tagInfo = (code: string) => TAGS.find((tag) => tag.code === code) ?? TAGS[0];
