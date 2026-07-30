"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { hasOrganizerProjects } from "@/lib/cabinet/organizerStorage";
import styles from "./ProfileButton.module.css";

type Props = {
  variant?: "light" | "dark";
};

export default function ProfileButton({ variant = "dark" }: Props) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(hasOrganizerProjects());
    function onStorage() {
      setVisible(hasOrganizerProjects());
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("prive-projects-changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("prive-projects-changed", onStorage);
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`${styles.root} ${variant === "light" ? styles.light : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className={styles.avatar}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Профиль организатора"
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" aria-hidden width="18" height="18">
          <path
            fill="currentColor"
            d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-3.6 0-7.5 1.8-7.5 4.5V21h15v-2.25c0-2.7-3.9-4.5-7.5-4.5Z"
          />
        </svg>
      </button>
      {open ? (
        <div className={styles.menu} role="menu">
          <p className={styles.menuLabel}>Организатор</p>
          <Link
            href="/cabinet"
            className={styles.menuLink}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Перейти в профиль
          </Link>
        </div>
      ) : null}
    </div>
  );
}
