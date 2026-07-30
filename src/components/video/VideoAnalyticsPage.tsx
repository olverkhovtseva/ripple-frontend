"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { brand } from "@/components/home/data";
import ProfileButton from "@/components/cabinet/ProfileButton";
import styles from "@/components/cabinet/Cabinet.module.css";

type Analytics = {
  project: {
    id: string;
    title: string;
    heroName: string;
    deadline: string;
    shareSlug: string;
    status: string;
  };
  total_invited: number;
  in_progress_count: number;
  submitted_count: number;
  participants: Array<{
    id: string;
    name: string;
    status: string;
    videosCount: number;
    totalQuestions: number;
    updatedAt: string;
  }>;
};

type Props = { projectId: string };

function statusLabel(status: string) {
  if (status === "submitted") return { text: "Ответ получен", tone: "ok" };
  if (status === "in_progress") return { text: "В процессе", tone: "warn" };
  return { text: "Ссылка открыта", tone: "muted" };
}

function relativeRu(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин. назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Вчера";
  return `${days} дн. назад`;
}

export default function VideoAnalyticsPage({ projectId }: Props) {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/analytics`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Ошибка загрузки");
      return;
    }
    setData(json);
  }, [projectId]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 6000);
    return () => window.clearInterval(id);
  }, [load]);

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <p className={styles.lead}>Загрузка аналитики…</p>
      </div>
    );
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/v/${data.project.shareSlug}`
      : `/v/${data.project.shareSlug}`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/cabinet" className={styles.back}>
          ← К профилю
        </Link>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoBlack} alt={brand.name} />
        </Link>
        <div className={styles.headerRight}>
          <span className={styles.headerHint}>Аналитика</span>
          <ProfileButton />
        </div>
      </header>

      <main className={styles.mainWide}>
        <p className={styles.eyebrow}>Видео-проект</p>
        <h1 className={styles.title}>{data.project.title}</h1>
        <p className={styles.lead}>
          Герой: <strong>{data.project.heroName}</strong>
        </p>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Ссылка для участников</h2>
          <div className={styles.linkRow}>
            <code className={styles.linkBox}>{shareUrl}</code>
            <button
              type="button"
              className={styles.secondary}
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
        </section>

        <section className={styles.statsRow}>
          <article className={styles.statCard}>
            <strong>{data.total_invited}</strong>
            <span>Всего участников</span>
          </article>
          <article className={styles.statCard}>
            <strong>{data.in_progress_count}</strong>
            <span>В процессе</span>
          </article>
          <article className={styles.statCard}>
            <strong>{data.submitted_count}</strong>
            <span>Ответ получен</span>
          </article>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Участники</h2>
          {data.participants.length === 0 ? (
            <p className={styles.hint}>Пока никто не начал запись.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Статус</th>
                    <th>Загружено видео</th>
                    <th>Последняя активность</th>
                  </tr>
                </thead>
                <tbody>
                  {data.participants.map((p) => {
                    const st = statusLabel(p.status);
                    return (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>
                          <span
                            className={
                              st.tone === "ok"
                                ? styles.badgeOk
                                : st.tone === "warn"
                                  ? styles.badgeWarn
                                  : styles.badgeMuted
                            }
                          >
                            {st.text}
                          </span>
                        </td>
                        <td>
                          {p.videosCount} / {p.totalQuestions}
                        </td>
                        <td>{relativeRu(p.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
