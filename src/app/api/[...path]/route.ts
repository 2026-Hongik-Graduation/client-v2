import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ path: string[] }> };
type Tokens = { accessToken: string; refreshToken: string };

const ACCESS = "pofit_qa_access";
const REFRESH = "pofit_qa_refresh";
const KEEP = "pofit_qa_keep";
const TWO_WEEKS = 14 * 24 * 60 * 60;

function setSession(res: NextResponse, tokens: Tokens, keep: boolean) {
  const base = { httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const, path: "/" };
  res.cookies.set(ACCESS, tokens.accessToken, { ...base, maxAge: 15 * 60 });
  res.cookies.set(REFRESH, tokens.refreshToken, {
    ...base, ...(keep ? { maxAge: TWO_WEEKS } : {}),
  });
  res.cookies.set(KEEP, keep ? "1" : "0", {
    ...base, ...(keep ? { maxAge: TWO_WEEKS } : {}),
  });
}

function getTokens(payload: unknown): Tokens | null {
  if (!payload || typeof payload !== "object" || !("data" in payload)) return null;
  const data = payload.data;
  if (!data || typeof data !== "object" || !("accessToken" in data)
      || !("refreshToken" in data)) return null;
  return typeof data.accessToken === "string" && typeof data.refreshToken === "string"
    ? { accessToken: data.accessToken, refreshToken: data.refreshToken } : null;
}

async function route(request: NextRequest, context: RouteContext) {
  const backend = process.env.QA_BACKEND_ORIGIN?.replace(/\/+$/, "");
  if (!backend) {
    return NextResponse.json({ error: "QA_BACKEND_ORIGIN is not configured" }, { status: 503 });
  }

  const { path } = await context.params;
  if (!path?.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const action = path.join("/");
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin && !["GET", "HEAD"].includes(request.method)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const url = backend + "/api/" + path.map(encodeURIComponent).join("/") + request.nextUrl.search;
  const access = request.cookies.get(ACCESS)?.value;
  const refresh = request.cookies.get(REFRESH)?.value;
  const keep = request.cookies.get(KEEP)?.value === "1";

  if (action === "auth/logout" && request.method === "POST") {
    if (refresh) {
      try {
        await fetch(backend + "/api/auth/logout", { method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refresh }), cache: "no-store" });
      } catch { /* Invalidate local session even if the QA backend is unavailable. */ }
    }
    const res = NextResponse.json({ success: true });
    for (const cookie of [ACCESS, REFRESH, KEEP]) res.cookies.delete(cookie);
    return res;
  }

  if (action === "auth/refresh" && !refresh) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const body: BodyInit | undefined = action === "auth/refresh"
    ? JSON.stringify({ refreshToken: refresh })
    : ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();

  const callBackend = (token?: string) => {
    const headers = new Headers();
    const contentType = action === "auth/refresh" ? "application/json"
      : request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    if (request.headers.get("accept")) headers.set("Accept", request.headers.get("accept")!);
    if (token) headers.set("Authorization", "Bearer " + token);
    return fetch(url, { method: request.method, headers, body,
      redirect: "manual", cache: "no-store" });
  };

  try {
    let upstream = await callBackend(action === "auth/login" ? undefined : access);
    let renewed: Tokens | null = null;

    if (upstream.status === 401 && refresh && !action.startsWith("auth/")) {
      const retry = await fetch(backend + "/api/auth/refresh", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }), cache: "no-store",
      });
      if (retry.ok) {
        renewed = getTokens(await retry.json());
        if (renewed) upstream = await callBackend(renewed.accessToken);
      }
    }

    if (upstream.ok && (action === "auth/login" || action === "auth/refresh")) {
      const tokens = getTokens(await upstream.json());
      if (!tokens) return NextResponse.json({ error: "Invalid auth response" }, { status: 502 });
      const res = NextResponse.json({ success: true, data: { authenticated: true } });
      setSession(res, tokens, action === "auth/login"
        ? request.headers.get("x-pofit-keep-login") === "1" : keep);
      return res;
    }

    const headers = new Headers({ "Cache-Control": "no-store" });
    for (const name of ["content-type", "content-disposition"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    const content = [204, 304].includes(upstream.status) ? null : await upstream.arrayBuffer();
    const res = new NextResponse(content, { status: upstream.status, headers });
    if (renewed) setSession(res, renewed, keep);
    return res;
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: RouteContext) { return route(req, ctx); }
export async function POST(req: NextRequest, ctx: RouteContext) { return route(req, ctx); }
export async function PUT(req: NextRequest, ctx: RouteContext) { return route(req, ctx); }
export async function PATCH(req: NextRequest, ctx: RouteContext) { return route(req, ctx); }
export async function DELETE(req: NextRequest, ctx: RouteContext) { return route(req, ctx); }
