"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { brand } from "@/components/home/data";
import { joinUrl } from "@/lib/cabinet/serialize";
import type { OrganizerProjectView } from "@/lib/cabinet/types";
import ProfileButton from "./ProfileButton";
import styles from "./Cabinet.module.css";

type Props = {
  projectId: string;
  secret: string;
};

export default function ProjectAnalyticsPage({ projectId, secret }: Props) {
  const [project, setProject] = useState<OrganizerProjectView | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/projects/${projectId}?secret=${encodeURIComponent(secret)}`,
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Не удалось загрузить проект");
      return;
    }
    setProject(data.project);
  }, [projectId, secret]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, [load]);

  async function copyLink() {
    if (!project) return;
    await navigator.clipboard.writeText(joinUrl(project.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error}</p>
        <Link href="/create/presentation">Создать новый проект</Link>
      </div>
    );
  }

  if (!project) {
    return <div className={styles.page}><p className={styles.lead}>Загрузка кабинета…</p></div>;
  }

  const link = joinUrl(project.token);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← На главную
        </Link>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoBlack} alt={brand.name} />
        </Link>
        <div className={styles.headerRight}>
          <span className={styles.headerHint}>Аналитика сбора</span>
          <ProfileButton />
        </div>
      </header>

      <main className={styles.main}>
        <p className={styles.eyebrow}>Проект запущен</p>
        <h1 className={styles.title}>{project.projectTitle}</h1>
        <p className={styles.lead}>
          Герой: <strong>{project.heroName}</strong> · Осталось{" "}
          <strong>{project.daysLeft} дн.</strong> · Статус:{" "}
          <strong>
            {project.status === "collecting" ? "идёт сбор" : project.status}
          </strong>
        </p>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Ссылка для участников</h2>
          <div className={styles.linkRow}>
            <code className={styles.linkBox}>{link}</code>
            <button type="button" className={styles.secondary} onClick={copyLink}>
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Аналитика ответов</h2>
          <p className={styles.stat}>
            Получено ответов от{" "}
            <strong>{project.responseCount}</strong>{" "}
            {project.responseCount === 1 ? "участника" : "участников"}
          </p>

          {project.participants.length === 0 ? (
            <p className={styles.hint}>
              Пока никто не ответил. Отправьте ссылку близким или коллегам
            </p>
          ) : (
            <ul className={styles.people}>
              {project.participants.map((person) => (
                <li key={person.id} className={styles.person}>
                  <div>
                    <strong>{person.name}</strong>
                    <span>
                      {person.answeredCount} из {person.totalQuestions} вопросов
                    </span>
                  </div>
                  <span className={styles.personMeta}>
                    {new Date(person.updatedAt).toLocaleString("ru-RU")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Сценарий проекта</h2>
          <ol className={styles.scenarioPreview}>
            {project.questions.map((q, i) => (
              <li key={q.id}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p>{q.text}</p>
                  {q.hint ? <p className={styles.scenarioHint}>{q.hint}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
