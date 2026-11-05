import type { CoverQuestion } from "./cover-letter-api";
import { isPreviewMode } from "./dev-preview";

export type InterviewCategory = "기본 질문" | "직무·회사" | "자소서 기반";
export type InterviewPrompt = {
  id: string; category: InterviewCategory; question: string;
  hint: string; referenceAnswer?: string;
};
export type InterviewRecord = {
  version: 1; coverId: string; answers: Record<string, string>;
  completed: string[]; savedAt: string;
};
const KEY_PREFIX = "pofit_interview_practice_v1_";
const MAX_ANSWER = 6000;

export function buildInterviewPrompts(
  company: string, position: string, questions: CoverQuestion[],
): InterviewPrompt[] {
  const standard: InterviewPrompt[] = [
    { id: "base-self", category: "기본 질문", question: "1분 자기소개를 해주세요.",
      hint: "현재 역량 → 대표 경험 → 지원 직무와의 연결 순서로 간결하게 말해보세요." },
    { id: "base-strength", category: "기본 질문", question: "본인의 가장 큰 강점과 이를 증명하는 경험은 무엇인가요?",
      hint: "강점 하나를 선택하고 실제 행동과 결과를 함께 말해보세요." },
    { id: "base-weakness", category: "기본 질문", question: "본인의 약점을 어떻게 보완하고 있나요?",
      hint: "실제 약점, 그로 인해 겪은 어려움, 개선 행동과 변화를 설명해보세요." },
    { id: "base-team", category: "기본 질문", question: "협업 과정에서 갈등이 생긴 적이 있나요? 어떻게 해결했나요?",
      hint: "상황·나의 역할·갈등 해결 행동·결과를 구분해서 설명해보세요." },
    { id: "base-failure", category: "기본 질문", question: "실패하거나 어려움을 겪었던 경험에서 무엇을 배웠나요?",
      hint: "실패의 원인과 이후 개선한 구체적인 행동에 초점을 맞춰보세요." },
    { id: "base-question", category: "기본 질문", question: "마지막으로 면접관에게 질문하고 싶은 것이 있나요?",
      hint: "실제 직무, 팀 협업, 성장 기회와 관련된 질문을 준비해보세요." },
    { id: "job-why", category: "직무·회사", question: `왜 ${company}의 ${position} 직무에 지원했나요?`,
      hint: "회사에 관심을 갖게 된 근거와 자신이 기여할 수 있는 역량을 분리해서 말해보세요." },
    { id: "job-role", category: "직무·회사", question: `${position} 직무에서 중요하다고 생각하는 역량은 무엇인가요?`,
      hint: "역량의 중요성, 해당 역량을 발휘한 경험, 앞으로의 활용을 연결해보세요." },
    { id: "job-fit", category: "직무·회사", question: `${company}에서 일하게 된다면 초기에 어떤 방식으로 기여하고 싶나요?`,
      hint: "확인한 채용 정보와 자신의 강점을 연결하되 확인하지 않은 기업 정보를 단정하지 마세요." },
  ];
  const fromCover = [...questions].sort((a, b) => a.displayOrder - b.displayOrder)
    .filter(item => item.questionText.trim()).slice(0, 20).map((item, index) => ({
      id: "cover-" + item.id, category: "자소서 기반" as const,
      question: `자기소개서 ${index + 1}번 문항에 작성한 내용을 실제 사례와 함께 설명해주세요. (${item.questionText.trim().slice(0, 90)}${item.questionText.length > 90 ? "…" : ""})`,
      hint: "자기소개서와 같은 사실을 유지하면서, 당시 내가 직접 한 행동과 성과를 구체화해보세요.",
      referenceAnswer: item.answerText?.trim() || undefined,
    }));
  return [...standard, ...fromCover];
}
export async function resolveInterviewScope(): Promise<string | null> {
  if (isPreviewMode()) return "preview";
  try {
    const response = await fetch("/api/members/me/profile", {
      credentials: "same-origin", cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const id = payload?.data?.memberId;
    if (typeof id !== "string" || !/^[a-f0-9-]{36}$/i.test(id)) return null;
    return "member-" + id;
  } catch { return null; }
}
function key(scope: string, coverId: string) {
  return KEY_PREFIX + scope + "_" + coverId;
}
export function readInterviewRecord(scope: string, coverId: string): InterviewRecord | null {
  try {
    const raw = localStorage.getItem(key(scope, coverId));
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    const parsed = data as Partial<InterviewRecord>;
    if (parsed.version !== 1 || parsed.coverId !== coverId ||
        !parsed.answers || typeof parsed.answers !== "object" ||
        !Array.isArray(parsed.completed)) return null;
    const answers: Record<string, string> = {};
    for (const [id, value] of Object.entries(parsed.answers)) {
      if (typeof value === "string" && value.length <= MAX_ANSWER) answers[id] = value;
    }
    return {
      version: 1, coverId, answers,
      completed: parsed.completed.filter((value): value is string => typeof value === "string"),
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
    };
  } catch { return null; }
}
export function saveInterviewRecord(
  scope: string, coverId: string, answers: Record<string, string>, completed: string[],
): InterviewRecord {
  if (!scope || !coverId || Object.keys(answers).length > 60 ||
      Object.values(answers).some(value => typeof value !== "string" || [...value].length > MAX_ANSWER))
    throw new Error("연습 답변이 저장 가능한 글자 수를 초과했습니다.");
  const record: InterviewRecord = {
    version: 1, coverId, answers, completed, savedAt: new Date().toISOString(),
  };
  localStorage.setItem(key(scope, coverId), JSON.stringify(record));
  return record;
}
export function clearInterviewRecord(scope: string, coverId: string) {
  localStorage.removeItem(key(scope, coverId));
}
export function interviewTranscript(
  company: string, position: string, prompts: InterviewPrompt[],
  answers: Record<string, string>, completed: string[],
): string {
  const lines = [
    "POFIT 면접 연습 기록", `기업: ${company}`, `직무: ${position}`,
    `내보낸 날짜: ${new Date().toLocaleString("ko-KR")}`, "",
    "이 기록은 AI 평가가 아닌 본인이 작성한 연습 답변입니다.", "",
  ];
  prompts.forEach((prompt, index) => {
    lines.push(`[${index + 1}] ${prompt.category} | ${completed.includes(prompt.id) ? "연습 완료" : "연습 중"}`);
    lines.push("질문: " + prompt.question);
    lines.push("답변: " + (answers[prompt.id]?.trim() || "(미작성)"), "");
  });
  return lines.join("\n");
}
