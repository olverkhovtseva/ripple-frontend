"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { clearOrganizerLocal, hasOrganizerProjects } from "@/lib/cabinet/organizerStorage";
import styles from "./ProfileButton.module.css";
import auth from "@/components/auth/Auth.module.css";

type Props = {
  variant?: "light" | "dark";
};

export default function ProfileButton({ variant = "dark" }: Props) {
  const [visible, setVisible] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function refresh() {
      setVisible(hasOrganizerProjects());
      fetch("/api/auth/me")
        .then((res) => {
          setHasSession(res.ok);
          if (res.ok) setVisible(true);
        })
        .catch(() => null);
    }
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("prive-projects-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("prive-projects-changed", refresh);
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function logout() {
    clearOrganizerLocal();
    window.dispatchEvent(new Event("prive-projects-changed"));
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

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
            Мои проекты
          </Link>
          {hasSession ? (
            <button type="button" className={auth.logout} onClick={() => void logout()}>
              Выйти
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
