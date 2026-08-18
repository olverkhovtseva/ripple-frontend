import type { Metadata } from "next";
import VideoPage from "@/components/product/video/VideoPage";

export const metadata: Metadata = {
  title: "Видео-поздравление — Prive Stories",
  description:
    "Кинематографичное видео-поздравление из живых голосов близких и коллег. Монтаж, звук, музыка и титры — от 2 900 ₽",
};

export default function Page() {
  return <VideoPage />;
}
