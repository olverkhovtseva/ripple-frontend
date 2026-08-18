import type { Metadata } from "next";
import ProfilePage from "@/components/cabinet/ProfilePage";

export const metadata: Metadata = {
  title: "Профиль организатора — Prive Stories",
  description: "Список ваших проектов сбора историй",
};

export default function Page() {
  return <ProfilePage />;
}
