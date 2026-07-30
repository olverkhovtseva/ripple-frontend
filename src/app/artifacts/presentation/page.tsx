import type { Metadata } from "next";
import PresentationPage from "@/components/product/presentation/PresentationPage";

export const metadata: Metadata = {
  title: "Цифровая презентация — Prive Stories",
  description:
    "Цифровая книга историй в PDF за 2 500 ₽. Сбор ответов, верстка и два формата файла — для экрана и для печати.",
};

export default function Page() {
  return <PresentationPage />;
}
