"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { brand } from "@/components/home/data";
import { readCreateDraft, draftDisplayTitle } from "@/lib/cabinet/createDraft";
import styles from "@/components/cabinet/Cabinet.module.css";
import auth from "./Auth.module.css";

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get("error") ?? "");

  const next = params.get("next") || "/cabinet";
  const fromCreate = next.includes("resume=1");
  const draft = useMemo(
    () => (fromCreate ? readCreateDraft() : null),
    [fromCreate],
  );

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) return;
        router.replace(next);
      })
      .catch(() => null);
  }, [next, router]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
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
          role: "organizer",
          next: "/cabinet",
          context: fromCreate ? "welcome" : "signin",
          projectTitle: draft ? draftDisplayTitle(draft) : undefined,
          draft: draft ?? undefined,
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
      sessionStorage.setItem("prive-auth-next", "/cabinet");
      const q = new URLSearchParams({
        email: data.email || email,
        ...(fromCreate ? { welcome: "1" } : {}),
      });
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
        <Link href="/" className={styles.back}>
          ← На главную
        </Link>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoWhite} alt={brand.name} />
        </Link>
        <span className={styles.headerHint}>Организатор</span>
      </header>

      <main className={styles.main}>
        {fromCreate ? (
          <>
            <p className={styles.eyebrow}>Почти готово</p>
            <h1 className={styles.title}>Осталось войти в кабинет</h1>
            <p className={styles.lead}>
              {draft
                ? `Сценарий для «${draftDisplayTitle(draft)}» сохранён. `
                : "Сценарий сохранён. "}
              Введите email — отправим приветственное письмо со ссылкой для
              входа. После перехода по ссылке на этом устройстве вы попадёте в
              кабинет организатора, и новый проект уже будет создан.
            </p>
          </>
        ) : (
          <>
            <p className={styles.eyebrow}>Создать подарок</p>
            <h1 className={styles.title}>Войдите как организатор</h1>
            <p className={styles.lead}>
              Введите фамилию, имя и email — откроем кабинет, где будут храниться
              ваши проекты
            </p>
          </>
        )}

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Ваши данные</h2>
          <div className={auth.row}>
            <label className={styles.field}>
              <span>Фамилия</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Иванова"
                autoComplete="family-name"
              />
            </label>
            <label className={styles.field}>
              <span>Имя</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Анна"
                autoComplete="given-name"
              />
            </label>
          </div>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anna@email.ru"
              autoComplete="email"
            />
          </label>
          <p className={styles.hint}>
            На этот адрес придёт одноразовая ссылка для входа в кабинет.
          </p>
          <label className={auth.consent}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span>
              Я принимаю{" "}
              <Link href="/legal/terms" target="_blank" rel="noopener noreferrer">
                Пользовательское соглашение
              </Link>{" "}
              и{" "}
              <Link
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Политику обработки персональных данных
              </Link>
            </span>
          </label>
          {error ? <p className={styles.error}>{error}</p> : null}
          <button
            type="button"
            className={styles.primaryGold}
            disabled={busy || !termsAccepted}
            onClick={() => void submit()}
          >
            {busy ? "Отправляем письмо…" : "Получить ссылку для входа"}
          </button>
        </section>
      </main>
    </div>
  );
}

export default function OrganizerSignInPage() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
