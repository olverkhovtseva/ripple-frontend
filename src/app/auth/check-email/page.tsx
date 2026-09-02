import type { Metadata } from "next";
import CheckEmailPage from "@/components/auth/CheckEmailPage";

export const metadata: Metadata = {
  title: "Проверьте почту — Prive Stories",
};

export default function Page() {
  return <CheckEmailPage />;
}
