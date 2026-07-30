"use client";

import { useParams } from "next/navigation";
import VideoAnalyticsPage from "@/components/video/VideoAnalyticsPage";

export default function Page() {
  const params = useParams<{ id: string }>();
  return <VideoAnalyticsPage projectId={params.id} />;
}
