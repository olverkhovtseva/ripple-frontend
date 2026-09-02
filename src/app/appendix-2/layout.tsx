import type { Metadata } from "next";
import "./appendix.css";

export const metadata: Metadata = {
  title: "Appendix 2 — Current bonus scheme",
  description:
    "Current bonus scheme for Financial Advisors and Senior Financial Advisors",
};

export default function Appendix2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
