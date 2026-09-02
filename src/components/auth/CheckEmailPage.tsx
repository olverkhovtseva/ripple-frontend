"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { brand } from "@/components/home/data";
import styles from "@/components/cabinet/Cabinet.module.css";
import auth from "./Auth.module.css";

function Body() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "ваш email";
  const welcome = params.get("welcome") === "1";
  const linkError = params.get("error") ?? "";
  const [devLink, setDevLink] = useState("");

  useEffect(() => {
    setDevLink(sessionStorage.getItem("prive-dev-link") || "");
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) return;
        const next =
          sessionStorage.getItem("prive-auth-next") || "/cabinet";
        router.replace(next);
      })
      .catch(() => null);
  }, [router]);

  return (
    <div className={`${styles.page} ${styles.pageScenic}`}>
      <header className={styles.header}>
        <Link href="/auth/organizer" className={styles.back}>
          ← Изменить данные
        </Link>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoWhite} alt={brand.name} />
        </Link>
        <span className={styles.headerHint}>
          {welcome ? "Добро пожаловать" : "Письмо отправлено"}
        </span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>
          {welcome ? "Проверьте почту" : "Перейдите по ссылке из письма"}
        </h1>
        <p className={styles.lead}>
          {welcome ? (
            <>
              Мы отправили приветственное письмо на{" "}
              <strong>{email}</strong>. После перехода по ссылке на этом
              устройстве вы попадёте в кабинет организатора, и новый проект уже
              будет создан.
            </>
          ) : (
            <>
              Мы отправили одноразовую ссылку на <strong>{email}</strong>.
              Откройте её на этом устройстве — система войдёт в ваш кабинет.
            </>
          )}
        </p>
        <section className={styles.card}>
          <p className={styles.hint}>
            Ссылка действует 24 часа и срабатывает один раз. Если уже нажимали
            на неё — запросите новую на предыдущем шаге.
          </p>
          {linkError ? <p className={styles.error}>{linkError}</p> : null}
          {devLink ? (
            <div className={auth.inbox}>
              <p className={auth.inboxLabel}>
                {welcome
                  ? "Локальная проверка — ссылка из письма"
                  : "Локальная ссылка для проверки"}
              </p>
              <a className={auth.inboxLink} href={devLink}>
                Войти в кабинет
              </a>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <Body />
    </Suspense>
  );
}
