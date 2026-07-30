import type { Metadata } from "next";
import BookPage from "@/components/product/book/BookPage";

export const metadata: Metadata = {
  title: "Премиум-книга — Prive Stories",
  description:
    "Премиум-книга в тканевом или кожаном переплете из воспоминаний близких. Сбор, верстка, печать и подарочная упаковка — от 8 900 ₽.",
};

export default function Page() {
  return <BookPage />;
}
