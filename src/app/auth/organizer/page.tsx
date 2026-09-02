import type { Metadata } from "next";
import OrganizerSignInPage from "@/components/auth/OrganizerSignInPage";

export const metadata: Metadata = {
  title: "Войдите как организатор — Prive Stories",
};

export default function Page() {
  return <OrganizerSignInPage />;
}
