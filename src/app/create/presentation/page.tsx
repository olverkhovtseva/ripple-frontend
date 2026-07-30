import type { Metadata } from "next";
import CreateProjectPage from "@/components/cabinet/CreateProjectPage";

export const metadata: Metadata = {
  title: "Создать презентацию — Prive Stories",
  description: "Кабинет организатора: создайте проект и начните сбор историй.",
};

export default function Page() {
  return <CreateProjectPage artifactType="presentation" />;
}
