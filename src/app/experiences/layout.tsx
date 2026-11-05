import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function Authenticated({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  // The Spring API validates actual ownership and authorization on each request.
  if (!store.has("pofit_qa_access") && !store.has("pofit_qa_refresh")) {
    redirect("/login?next=/experiences");
  }
  return children;
}
export default function ExperiencesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8" role="status">로그인 상태 확인 중...</div>}>
      <Authenticated>{children}</Authenticated>
    </Suspense>
  );
}
