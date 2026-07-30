"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ProjectAnalyticsPage from "@/components/cabinet/ProjectAnalyticsPage";

function Inner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const secret = search.get("secret") ?? "";
  return <ProjectAnalyticsPage projectId={params.id} secret={secret} />;
}

export default function Page() {
  return (
    <Suspense fallback={<p style={{ padding: "2rem" }}>Загрузка…</p>}>
      <Inner />
    </Suspense>
  );
}
