import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function Guard({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const preview = process.env.NODE_ENV === "development" &&
    store.get("pofit_dev_preview")?.value === "1";
  if (!preview && !store.has("pofit_qa_access") && !store.has("pofit_qa_refresh")) {
    redirect("/login?next=/cover-letters");
  }
  return children;
}
export default function CoverLetterLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8" role="status">접속 상태 확인 중...</p>}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}
