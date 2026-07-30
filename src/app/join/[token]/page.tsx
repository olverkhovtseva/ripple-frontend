"use client";

import { useParams } from "next/navigation";
import JoinPage from "@/components/cabinet/JoinPage";

export default function Page() {
  const params = useParams<{ token: string }>();
  return <JoinPage token={params.token} />;
}
