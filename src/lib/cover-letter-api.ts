import { previewRequest } from "./dev-preview";

export type CoverStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED";
export type CoverLetter = {
  id: string; companyName: string; positionName: string; deadline: string | null;
  jdUrl: string | null; status: CoverStatus; applicationStatus: string; createdAt: string; updatedAt: string;
};
export type CoverQuestion = {
  id: string; coverLetterId: string; questionText: string;
  characterLimit: number; answerText: string; displayOrder: number; updatedAt: string;
};
export type CoverDetail = { coverLetter: CoverLetter; questions: CoverQuestion[] };
export type JobPosting = {
  id: string; coverLetterId: string; url: string | null;
  jdOriginal: string | null; qualifications: string | null;
  preferences: string | null; hiringProcess: string | null;
};
export type CoverVersion = {
  id: string; label: string; coverLetterId: string; snapshotJson: string; createdAt: string;
};
export type CoverExperienceLink = { id: string; questionId: string; experienceId: string; displayOrder: number };
export class CoverApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "CoverApiError"; }
}
type Envelope<T> = { success: boolean; data: T; message?: string; errorCode?: string };
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const preview = previewRequest<T>(path, init);
  if (preview) return preview;
  let response: Response;
  try {
    response = await fetch("/api/" + path, {
      credentials: "same-origin", cache: "no-store", ...init,
      headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    });
  } catch { throw new CoverApiError(0, "네트워크 연결을 확인해 주세요."); }
  const payload = await response.json().catch(() => null) as Envelope<T> | null;
  if (!response.ok || !payload?.success) {
    const message = response.status === 401 ? "세션이 만료되었습니다. 다시 로그인해 주세요."
      : response.status === 403 ? "접근 권한이 없습니다."
      : response.status === 404 ? "자료를 찾을 수 없습니다."
      : response.status >= 500 ? "서버 응답에 문제가 있습니다."
      : "입력값이나 요청 상태를 확인해 주세요.";
    throw new CoverApiError(response.status, message);
  }
  return payload.data;
}
const json = (value: unknown) => JSON.stringify(value);
const item = (id: string) => "cover-letters/" + encodeURIComponent(id);
const question = (id: string, questionId: string) => item(id) + "/questions/" + encodeURIComponent(questionId);
export const coverApi = {
  list: (filters: { keyword?: string; status?: string; page?: number; size?: number } = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    if (!params.has("size")) params.set("size", "100");
    return request<CoverLetter[]>("cover-letters?" + params);
  },
  detail: (id: string) => request<CoverDetail>(item(id)),
  create: (value: { companyName: string; positionName: string; deadline: string | null; jdUrl: string | null }) =>
    request<CoverLetter>("cover-letters", { method: "POST", body: json(value) }),
  patch: (id: string, value: Partial<Pick<CoverLetter, "companyName" | "positionName" | "deadline" | "status" | "jdUrl">>) =>
    request<CoverLetter>(item(id), { method: "PATCH", body: json(value) }),
  delete: (id: string) => request<{ deleted: boolean }>(item(id), { method: "DELETE" }),
  addQuestion: (id: string, questionText: string, characterLimit: number) =>
    request<CoverQuestion>(item(id) + "/questions", { method: "POST", body: json({ questionText, characterLimit }) }),
  patchQuestion: (id: string, questionId: string, input: { questionText?: string; answerText?: string; characterLimit?: number }) =>
    request<CoverQuestion>(question(id, questionId), { method: "PATCH", body: json(input) }),
  deleteQuestion: (id: string, questionId: string) =>
    request<{ deleted: boolean }>(question(id, questionId), { method: "DELETE" }),
  reorder: (id: string, questionIds: string[]) =>
    request<CoverQuestion[]>(item(id) + "/questions/order", { method: "PUT", body: json({ questionIds }) }),
  getPosting: (id: string) => request<JobPosting>(item(id) + "/posting"),
  savePosting: (id: string, input: { url: string | null; jdOriginal: string | null;
    qualifications: string | null; preferences: string | null; hiringProcess: string | null }) =>
    request<JobPosting>(item(id) + "/posting", { method: "PUT", body: json(input) }),
  deletePosting: (id: string) => request<{ deleted: boolean }>(item(id) + "/posting", { method: "DELETE" }),
  versions: (id: string) => request<CoverVersion[]>(item(id) + "/versions"),
  saveVersion: (id: string, label: string) =>
    request<CoverVersion>(item(id) + "/versions", { method: "POST", body: json({ label }) }),
  restoreVersion: (id: string, versionId: string) =>
    request<CoverQuestion[]>(item(id) + "/versions/" + encodeURIComponent(versionId) + "/restore", { method: "POST" }),
  linkedExperiences: (id: string, questionId: string) => request<CoverExperienceLink[]>(question(id, questionId) + "/experiences"),
  connectExperience: (id: string, questionId: string, experienceId: string) =>
    request<CoverExperienceLink>(question(id, questionId) + "/experiences", { method: "POST", body: json({ experienceId }) }),
  disconnectExperience: (id: string, questionId: string, experienceId: string) =>
    request<{ deleted: boolean }>(question(id, questionId) + "/experiences/" + encodeURIComponent(experienceId), { method: "DELETE" }),
};
