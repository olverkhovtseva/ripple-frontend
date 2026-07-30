import type { Metadata } from "next";
import CreateVideoProjectPage from "@/components/video/CreateVideoProjectPage";

export const metadata: Metadata = {
  title: "Создать видео-обращение — Prive Stories",
  description:
    "Кабинет организатора: создайте проект видео-поздравления и получите ссылку для сбора роликов.",
};

export default function Page() {
  return <CreateVideoProjectPage />;
}
