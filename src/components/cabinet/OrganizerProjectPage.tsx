"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { brand } from "@/components/home/data";
import ProfileButton from "./ProfileButton";
import styles from "./Cabinet.module.css";

type ProjectData = {
  id: string;
  title: string;
  heroName: string;
  status: string;
  statusLabel: string;
  daysLeft: number;
  shareUrl: string;
  inviteMessage: string;
  questions: Array<{ id: string; text: string; hint: string | null }>;
  responseCount: number;
  participants: Array<{
    id: string;
    name: string;
    status: string;
    answeredCount: number;
    photoCount: number;
    updatedAt: string;
  }>;
};

type Props = { projectId: string };

export default function OrganizerProjectPage({ projectId }: Props) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [inviteMessage, setInviteMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedInvite, setSavedInvite] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/me/projects/${projectId}`);
    if (res.status === 401) {
      router.replace("/auth/organizer?next=/cabinet");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Не удалось загрузить проект");
      return;
    }
    setProject(data.project);
    setInviteMessage(data.project.inviteMessage);
  }, [projectId, router]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(id);
  }, [load]);

  async function saveInvite() {
    setBusy(true);
    try {
      const res = await fetch(`/api/me/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteMessage }),
      });
      if (!res.ok) throw new Error("Не удалось сохранить текст");
      setSavedInvite(true);
      setTimeout(() => setSavedInvite(false), 1600);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!project) return;
    await navigator.clipboard.writeText(project.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (error && !project) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error}</p>
        <Link href="/cabinet">← К проектам</Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.page}>
        <p className={styles.lead}>Загрузка проекта…</p>
      </div>
    );
  }

  const collecting =
    project.status === "collecting" || project.status === "active";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/cabinet" className={styles.back}>
          ← К проектам
        </Link>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoBlack} alt={brand.name} />
        </Link>
        <div className={styles.headerRight}>
          <ProfileButton />
        </div>
      </header>

      <main className={styles.main}>
        <p className={styles.eyebrow}>Кабинет организатора</p>
        <h1 className={styles.title}>{project.title}</h1>
        <p className={styles.lead}>
          Герой торжества: <strong>{project.heroName}</strong>
          {" · "}
          Статус: <strong>{project.statusLabel}</strong>
          {" · "}
          До дедлайна: <strong>{project.daysLeft} дн.</strong>
        </p>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Сценарий</h2>
          <ol className={styles.scenarioPreview}>
            {project.questions.map((q, i) => (
              <li key={q.id}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p>{q.text}</p>
                  {q.hint ? (
                    <p className={styles.scenarioHint}>{q.hint}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Ссылка для участников</h2>
          <p className={styles.hint}>
            Отправьте эту ссылку каждому участнику. В сообщении будет уникальный
            адрес проекта — участник авторизуется по email и передаёт ответы в
            приложении Prive Stories.
          </p>
          <div className={styles.linkRow}>
            <code className={styles.linkBox}>{project.shareUrl}</code>
            <button type="button" className={styles.secondary} onClick={copyLink}>
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
          <label className={styles.field}>
            <span>Текст приглашения (можно редактировать)</span>
            <textarea
              rows={12}
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={styles.secondary}
            disabled={busy}
            onClick={() => void saveInvite()}
          >
            {savedInvite ? "Сохранено" : "Сохранить текст"}
          </button>
        </section>

        {!collecting ? (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Начать сбор ответов</h2>
            <p className={styles.hint}>
              Ответы участников будут собираться прямо в приложении Prive
              Stories: тексты по сценарию и памятные фотографии с подписями.
              Когда придут ответы от 5 и более участников, мы отправим вам
              уведомление на email.
            </p>
            <button
              type="button"
              className={styles.primaryGold}
              onClick={() => router.push(`/cabinet/projects/${projectId}/checkout`)}
            >
              Начать сбор ответов
            </button>
          </section>
        ) : (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Сбор ответов</h2>
            <p className={styles.stat}>
              Получено ответов от{" "}
              <strong>{project.responseCount}</strong>{" "}
              {project.responseCount === 1 ? "участника" : "участников"}
            </p>
            {project.participants.length === 0 ? (
              <p className={styles.hint}>
                Пока никто не отправил ответы. Разошлите ссылку участникам.
              </p>
            ) : (
              <ul className={styles.people}>
                {project.participants.map((person) => (
                  <li key={person.id} className={styles.person}>
                    <div>
                      <strong>{person.name}</strong>
                      <span>
                        {person.answeredCount} ответов · {person.photoCount}{" "}
                        фото · {person.status === "submitted" ? "отправлено" : "в процессе"}
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
        )}

        {error ? <p className={styles.error}>{error}</p> : null}
      </main>
    </div>
  );
}
