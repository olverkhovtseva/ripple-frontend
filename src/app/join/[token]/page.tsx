"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import JoinPage from "@/components/cabinet/JoinPage";
import TextStoryFlow from "@/components/cabinet/TextStoryFlow";

export default function Page() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [source, setSource] = useState<"loading" | "prisma" | "legacy">(
    "loading",
  );

  useEffect(() => {
    async function detect() {
      const res = await fetch(`/api/join/${token}`);
      const data = await res.json();
      if (data.source === "prisma") {
        setSource("prisma");
      } else if (res.ok) {
        setSource("legacy");
      } else {
        const pub = await fetch(
          `/api/public/project-by-slug?slug=${encodeURIComponent(token)}`,
        );
        setSource(pub.ok ? "prisma" : "legacy");
      }
    }
    void detect();
  }, [token]);

  if (source === "loading") return null;
  if (source === "prisma") return <TextStoryFlow shareSlug={token} />;
  return <JoinPage token={token} />;
}
