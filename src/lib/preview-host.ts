// Public demo is available only on the designated deployment; never grants backend auth.
export const PREVIEW_COOKIE = "pofit_dev_preview";
export function isPreviewHost(hostname: string): boolean {
  const host = hostname.toLowerCase().split(":")[0];
  if (host === "localhost" || host === "127.0.0.1") return true;
  return process.env.NODE_ENV === "production" && host === "client-v2-one.vercel.app";
}
export function isPreviewAvailable(): boolean {
  return typeof window !== "undefined" && isPreviewHost(window.location.hostname);
}
