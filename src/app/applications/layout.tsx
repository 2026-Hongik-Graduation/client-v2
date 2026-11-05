import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function Authenticated({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const preview = process.env.NODE_ENV === "development" &&
    store.get("pofit_dev_preview")?.value === "1";
  if (!preview && !store.has("pofit_qa_access") && !store.has("pofit_qa_refresh")) {
    redirect("/login?next=/applications");
  }
  return children;
}
export default function ApplicationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8" role="status">로그인 상태 확인 중...</p>}>
      <Authenticated>{children}</Authenticated>
    </Suspense>
  );
}
