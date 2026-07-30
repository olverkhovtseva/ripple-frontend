"use client";

import { useParams } from "next/navigation";
import VideoParticipantFlow from "@/components/video/VideoParticipantFlow";

export default function Page() {
  const params = useParams<{ share_slug: string }>();
  return <VideoParticipantFlow shareSlug={params.share_slug} />;
}
