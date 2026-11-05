// Development-only browser preview. Never forwards preview mutations to the EC2 API.
export const PREVIEW_COOKIE = "pofit_dev_preview";
const STORAGE_KEY = "pofit_dev_preview_store_v1";
export function isPreviewMode(): boolean {
  return process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    document.cookie.split("; ").includes(PREVIEW_COOKIE + "=1");
}
export function startPreviewMode(): void {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined" ||
      !["localhost", "127.0.0.1"].includes(window.location.hostname)) return;
  document.cookie = PREVIEW_COOKIE + "=1; Path=/; SameSite=Lax; Max-Age=86400";
}
export function stopPreviewMode(): void {
  if (typeof document === "undefined") return;
  document.cookie = PREVIEW_COOKIE + "=; Path=/; SameSite=Lax; Max-Age=0";
}

type Dict = Record<string, unknown>;
type Question = { id: string; questionText: string; characterLimit: number; answerText: string; displayOrder: number };
type Cover = { id: string; companyName: string; positionName: string; deadline: string | null; jdUrl: string | null;
  status: string; applicationStatus: string; createdAt: string; updatedAt: string };
type Experience = { id: string; tagCode: string; title: string; startedAt: string | null; endedAt: string | null;
  status: string; summary: string | null; creationMethod: string; updatedAt: string; createdAt: string };
type ExpAnswer = { id: string; experienceId: string; questionId: string | null; customLabel: string | null; content: string; displayOrder: number };
type Posting = { id: string; coverLetterId: string; url: string | null; jdOriginal: string | null;
  qualifications: string | null; preferences: string | null; hiringProcess: string | null };
type Version = { id: string; coverLetterId: string; label: string; createdAt: string; snapshotJson: string };
type Link = { id: string; questionId: string; experienceId: string; displayOrder: number };
type ApplicationDetails = {
  coverLetterId: string; deadline: string | null; interviewDate: string | null;
  documentResult: "PENDING" | "PASSED" | "FAILED" | null;
  hasResume: boolean; hasPortfolio: boolean;
};
type Store = { covers: Cover[]; questions: Record<string, Question[]>; versions: Record<string, Version[]>;
  postings: Record<string, Posting>; links: Record<string, Link[]>; experiences: Experience[];
  answers: Record<string, ExpAnswer[]>; applicationDetails: Record<string, ApplicationDetails> };
const fresh = (): Store => ({ covers: [], questions: {}, versions: {}, postings: {}, links: {}, experiences: [],
  answers: {}, applicationDetails: {} });
const load = (): Store => {
  try { return { ...fresh(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return fresh(); }
};
const save = (store: Store) => localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
const requireFound = <T>(value: T | undefined, type: string): T => {
  if (!value) throw new Error(type + "을(를) 찾을 수 없습니다.");
  return value;
};
const QUESTIONS: Record<string, Array<[string, string]>> = {
  STAR: [["Situation", "배경 / 상황"], ["Task", "역할 / 과제"], ["Action", "행동"], ["Result", "결과"]],
  GROWTH_VALUES: [["성장 배경", "어떤 환경과 경험 속에서 성장했나요?"], ["가치관", "어떤 가치관을 갖게 됐나요?"], ["실천 사례", "실제 사례가 있나요?"], ["현재의 나", "지금의 나에게 어떤 영향을 주었나요?"]],
  STRENGTH_WEAKNESS: [["성격의 강점", "나의 강점은 무엇인가요?"], ["성격의 단점", "보완할 점은 무엇인가요?"], ["보완 노력", "어떤 노력을 했나요?"], ["현재의 변화", "무엇이 달라졌나요?"]],
  COLLABORATION: [["협업 상황", "어떤 협업이었나요?"], ["나의 역할", "역할과 책임은 무엇이었나요?"], ["협업 방식", "어떻게 조율했나요?"], ["결과와 배운 점", "결과와 배운 점은 무엇인가요?"]],
  ACADEMIC_CAREER: [["경험 배경", "어떤 경험이었나요?"], ["역할과 목표", "목표는 무엇이었나요?"], ["수행 과정", "어떻게 수행했나요?"], ["성과와 역량", "무엇을 배웠나요?"]],
  CHALLENGE: [["도전 상황", "어려웠던 경험은 무엇인가요?"], ["문제와 목표", "어떤 목표를 세웠나요?"], ["극복 과정", "어떻게 극복했나요?"], ["결과와 성장", "무엇이 달라졌나요?"]],
};
function experienceQuestions(code: string) {
  return (QUESTIONS[code] || QUESTIONS.STAR).map(([label, prompt], i) => ({
    id: "preview-" + code + "-" + (i + 1), tagCode: code, label,
    code: label, prompt, displayOrder: i + 1, required: true,
  }));
}
function handler(path: string, init: RequestInit = {}): unknown {
  const url = new URL(path, "http://preview.local/");
  const parts = url.pathname.split("/").filter(Boolean);
  const method = (init.method || "GET").toUpperCase();
  const data = init.body ? JSON.parse(String(init.body)) as Dict : {};
  const store = load();
  const done = <T>(result: T): T => { save(store); return result; };
  const bad = () => { throw new Error("미리보기에서 지원하지 않는 요청입니다: " + method + " " + url.pathname); };
  const [section, id, child, sub, extra] = parts;
  if (section === "experience-tags" && child === "questions" && method === "GET")
    return experienceQuestions(id);
  if (section === "experiences") {
    if (!id && method === "GET") {
      const keyword = url.searchParams.get("keyword") || "";
      const tag = url.searchParams.get("tagCode") || "";
      const status = url.searchParams.get("status") || "";
      const page = Number(url.searchParams.get("page") || 0);
      const size = Number(url.searchParams.get("size") || 20);
      return store.experiences.filter(e => (!keyword || e.title.includes(keyword) || (e.summary || "").includes(keyword)) &&
        (!tag || e.tagCode === tag) && (!status || e.status === status)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(page * size, (page + 1) * size);
    }
    if (!id && method === "POST") {
      const value: Experience = { id: uuid(), tagCode: String(data.tagCode || "STAR"), title: String(data.title || ""),
        startedAt: data.startedAt ? String(data.startedAt) : null, endedAt: data.endedAt ? String(data.endedAt) : null,
        summary: null, status: "DRAFT", creationMethod: "QUICK", createdAt: now(), updatedAt: now() };
      if (!value.title.trim()) throw new Error("제목을 입력해주세요.");
      store.experiences.push(value); return done(value);
    }
    const exp = requireFound(store.experiences.find(e => e.id === id), "경험");
    if (!child && method === "GET") {
      const answers = store.answers[id] || [];
      const filled = experienceQuestions(exp.tagCode).filter(q => answers.some(a => a.questionId === q.id && a.content.trim())).length;
      return { experience: exp, answers, progress: filled * 25 };
    }
    if (!child && method === "PATCH") return done(Object.assign(exp, data, { updatedAt: now() }));
    if (!child && method === "DELETE") {
      store.experiences = store.experiences.filter(e => e.id !== id);
      delete store.answers[id];
      for (const key of Object.keys(store.links)) store.links[key] = store.links[key].filter(l => l.experienceId !== id);
      return done({ deleted: true });
    }
    if (child === "answers" && method === "PUT") {
      const entries = (data.answers as Array<Dict>) || [];
      store.answers[id] = entries.map((entry, i) => ({
        id: uuid(), experienceId: id, questionId: entry.questionId ? String(entry.questionId) : null,
        customLabel: entry.customLabel ? String(entry.customLabel) : null, content: String(entry.content || ""),
        displayOrder: Number(entry.displayOrder ?? i + 1),
      }));
      return done(store.answers[id]);
    }
    if (child === "status" && method === "PATCH") {
      if (data.status === "COMPLETED") {
        const filled = (store.answers[id] || []).filter(a => a.questionId && a.content.trim());
        if (!exp.startedAt || !exp.endedAt || filled.length < 4) throw new Error("필수 질문과 기간을 입력해 주세요.");
      }
      exp.status = String(data.status || "DRAFT"); exp.updatedAt = now(); return done(exp);
    }
    return bad();
  }
  if (section === "application-board") {
    const stages = ["PLANNED", "PREPARING", "SUBMITTED", "CLOSED"];
    if (!id && method === "GET") {
      const columns = Object.fromEntries(stages.map(stage => [stage, store.covers
        .filter(cover => (cover.applicationStatus || "PLANNED") === stage)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))]));
      return { stages, columns };
    }
    if (id && child === "status" && method === "PATCH") {
      if (!stages.includes(String(data.status))) throw new Error("지원 단계가 올바르지 않습니다.");
      const cover = requireFound(store.covers.find(c => c.id === id), "지원 카드");
      cover.applicationStatus = String(data.status);
      cover.updatedAt = now();
      return done(cover);
    }
    return bad();
  }
  if (section !== "cover-letters") return bad();
  if (!id && method === "GET") {
    const keyword = url.searchParams.get("keyword") || "";
    const status = url.searchParams.get("status") || "";
    const page = Number(url.searchParams.get("page") || 0);
    const size = Number(url.searchParams.get("size") || 20);
    return store.covers.filter(c => (!keyword || c.companyName.includes(keyword) || c.positionName.includes(keyword)) &&
      (!status || c.status === status)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(page * size, (page + 1) * size);
  }
  if (!id && method === "POST") {
    const created: Cover = { id: uuid(), companyName: String(data.companyName || ""), positionName: String(data.positionName || ""),
      deadline: data.deadline ? String(data.deadline) : null, jdUrl: data.jdUrl ? String(data.jdUrl) : null,
      status: "DRAFT", applicationStatus: "PLANNED", createdAt: now(), updatedAt: now() };
    if (!created.companyName.trim() || !created.positionName.trim()) throw new Error("기업명과 직무명을 입력해 주세요.");
    store.covers.push(created); return done(created);
  }
  const cover = requireFound(store.covers.find(c => c.id === id), "자소서");
  if (!child && method === "GET") return { coverLetter: cover, questions: store.questions[id] || [] };
  if (!child && method === "PATCH") return done(Object.assign(cover, data, { updatedAt: now() }));
  if (!child && method === "DELETE") {
    store.covers = store.covers.filter(c => c.id !== id);
    delete store.questions[id]; delete store.versions[id]; delete store.postings[id];
    delete store.applicationDetails[id];
    return done({ deleted: true });
  }
  if (child === "application-detail") {
    if (method === "GET") return store.applicationDetails[id] || {
      coverLetterId: id, deadline: cover.deadline, interviewDate: null,
      documentResult: null, hasResume: false, hasPortfolio: false,
    };
    if (method === "PUT") {
      const result = data.documentResult;
      if (result != null && !["PENDING", "PASSED", "FAILED"].includes(String(result)))
        throw new Error("서류 결과를 확인해 주세요.");
      cover.deadline = data.deadline ? String(data.deadline) : null;
      cover.updatedAt = now();
      const detail: ApplicationDetails = {
        coverLetterId: id, deadline: cover.deadline,
        interviewDate: data.interviewDate ? String(data.interviewDate) : null,
        documentResult: result == null ? null : String(result) as ApplicationDetails["documentResult"],
        hasResume: data.hasResume === true, hasPortfolio: data.hasPortfolio === true,
      };
      store.applicationDetails[id] = detail;
      return done(detail);
    }
    return bad();
  }
  if (child === "posting") {
    if (method === "GET") return requireFound(store.postings[id], "채용공고");
    if (method === "DELETE") { delete store.postings[id]; return done({ deleted: true }); }
    if (method === "PUT") {
      const value: Posting = { id: store.postings[id]?.id || uuid(), coverLetterId: id,
        url: data.url ? String(data.url) : null,
        jdOriginal: data.jdOriginal ? String(data.jdOriginal) : null,
        qualifications: data.qualifications ? String(data.qualifications) : null,
        preferences: data.preferences ? String(data.preferences) : null,
        hiringProcess: data.hiringProcess ? String(data.hiringProcess) : null };
      store.postings[id] = value; return done(value);
    }
  }
  if (child === "questions") {
    const list = store.questions[id] || [];
    if (!sub && method === "POST") {
      const q: Question = { id: uuid(), questionText: String(data.questionText || ""),
        characterLimit: Number(data.characterLimit || 1000), answerText: "", displayOrder: list.length + 1 };
      if (!q.questionText.trim()) throw new Error("문항을 입력해 주세요.");
      store.questions[id] = [...list, q]; return done(q);
    }
    if (sub === "order" && method === "PUT") {
      const ids = data.questionIds as string[];
      if (!ids || ids.length !== list.length || new Set(ids).size !== list.length) throw new Error("정렬값 오류");
      store.questions[id] = ids.map((qid, i) => ({ ...requireFound(list.find(q => q.id === qid), "문항"), displayOrder: i + 1 }));
      return done(store.questions[id]);
    }
    const q = requireFound(list.find(item => item.id === sub), "문항");
    if (!extra && method === "PATCH") return done(Object.assign(q, data));
    if (!extra && method === "DELETE") {
      store.questions[id] = list.filter(item => item.id !== sub).map((item, i) => ({ ...item, displayOrder: i + 1 }));
      delete store.links[sub]; return done({ deleted: true });
    }
    if (extra === "experiences") {
      const links = store.links[sub] || [];
      if (!parts[5] && method === "GET") return links;
      if (!parts[5] && method === "POST") {
        if (!store.experiences.some(e => e.id === data.experienceId)) throw new Error("경험을 찾을 수 없습니다.");
        if (links.some(l => l.experienceId === data.experienceId)) throw new Error("이미 연결된 경험입니다.");
        const link = { id: uuid(), questionId: sub, experienceId: String(data.experienceId), displayOrder: links.length + 1 };
        store.links[sub] = [...links, link]; return done(link);
      }
      if (parts[5] && method === "DELETE") {
        store.links[sub] = links.filter(l => l.experienceId !== parts[5]).map((l, i) => ({ ...l, displayOrder: i + 1 }));
        return done({ deleted: true });
      }
    }
  }
  if (child === "versions") {
    const versions = store.versions[id] || [];
    if (!sub && method === "GET") return [...versions].reverse();
    if (!sub && method === "POST") {
      const label = String(data.label || "");
      if (!label.trim()) throw new Error("버전 이름을 입력해 주세요.");
      const v: Version = { id: uuid(), coverLetterId: id, label, createdAt: now(),
        snapshotJson: JSON.stringify({ questions: store.questions[id] || [] }) };
      store.versions[id] = [...versions, v]; return done(v);
    }
    const v = requireFound(versions.find(version => version.id === sub), "버전");
    if (!extra && method === "GET") return v;
    if (extra === "restore" && method === "POST") {
      const snap = JSON.parse(v.snapshotJson) as { questions: Question[] };
      const restored = snap.questions.map((q, i) => ({ ...q, displayOrder: i + 1 }));
      store.questions[id] = restored;
      for (const key of Object.keys(store.links)) if (!restored.some(q => q.id === key)) delete store.links[key];
      return done(restored);
    }
  }
  return bad();
}
export function previewRequest<T>(path: string, init: RequestInit = {}): Promise<T> | null {
  if (!isPreviewMode()) return null;
  try { return Promise.resolve(handler(path, init) as T); }
  catch (error) { return Promise.reject(error); }
}
