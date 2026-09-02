"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { brand } from "@/components/home/data";
import styles from "@/components/cabinet/Cabinet.module.css";
import auth from "./Auth.module.css";

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const projectSlug = params.get("project") ?? "";
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get("error") ?? "");
  const [projectInfo, setProjectInfo] = useState<{
    title: string;
    heroName: string;
  } | null>(null);

  useEffect(() => {
    if (!projectSlug) return;
    fetch(`/api/public/project-by-slug?slug=${encodeURIComponent(projectSlug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.project) setProjectInfo(data.project);
      })
      .catch(() => null);
  }, [projectSlug]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok || !projectSlug) return;
        router.replace(`/join/${projectSlug}`);
      })
      .catch(() => null);
  }, [projectSlug, router]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (!projectSlug) {
        throw new Error("Ссылка на проект не указана");
      }
      if (!termsAccepted) {
        throw new Error(
          "Чтобы продолжить, примите пользовательское соглашение и политику обработки персональных данных",
        );
      }
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          role: "participant",
          projectShareSlug: projectSlug,
          context: "signin",
          termsAccepted: true,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        email?: string;
        devLink?: string;
      };
      if (!res.ok) throw new Error(data.error || "Не удалось отправить ссылку");
      if (data.devLink) {
        sessionStorage.setItem("prive-dev-link", data.devLink);
      }
      const q = new URLSearchParams({ email: data.email || email });
      router.push(`/auth/check-email?${q.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${styles.page} ${styles.pageScenic}`}>
      <header className={styles.header}>
        <Link
          href={projectSlug ? `/join/${projectSlug}` : "/"}
          className={styles.back}
        >
          ← Назад
        </Link>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoWhite} alt={brand.name} />
        </Link>
        <span className={styles.headerHint}>Участник</span>
      </header>

      <main className={styles.main}>
        <p className={styles.eyebrow}>Prive Stories</p>
        <h1 className={styles.title}>Присоединиться как участник</h1>
        <p className={styles.lead}>
          {projectInfo
            ? `Вы приглашены поделиться воспоминаниями для «${projectInfo.title}»${projectInfo.heroName ? ` — ${projectInfo.heroName}` : ""}. `
            : "Вы приглашены поделиться воспоминаниями. "}
          Введите email — отправим одноразовую ссылку для входа. После входа
          вы сможете ответить на вопросы и загрузить фотографии.
        </p>

        <section className={styles.card}>
          <label className={styles.field}>
            <span>Фамилия</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </label>
          <label className={styles.field}>
            <span>Имя</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className={auth.consent}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span>
              Я принимаю{" "}
              <Link href="/legal/terms" target="_blank">
                пользовательское соглашение
              </Link>{" "}
              и{" "}
              <Link href="/legal/privacy" target="_blank">
                политику обработки персональных данных
              </Link>
            </span>
          </label>

          <button
            type="button"
            className={styles.primaryGold}
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? "Отправляем…" : "Получить ссылку для входа"}
          </button>
        </section>

        {error ? <p className={styles.error}>{error}</p> : null}
      </main>
    </div>
  );
}

export default function ParticipantSignInPage() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
