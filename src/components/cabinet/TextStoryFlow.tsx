"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { brand } from "@/components/home/data";
import styles from "./Cabinet.module.css";

type Question = { id: string; text: string; hint: string | null };
type Answer = { questionId: string; text: string };
type Photo = { id: string; fileUrl: string; caption: string | null };

type Project = {
  id: string;
  projectTitle: string;
  heroName: string;
  daysLeft: number;
  deadline: string;
  questions: Question[];
};

type Participant = {
  id: string;
  status: string;
  name: string;
  answers: Answer[];
  photos: Photo[];
};

type Phase = "loading" | "auth" | "welcome" | "question" | "photos" | "done";

type Props = { shareSlug: string };

const MAX_TEXT = 400;

export default function TextStoryFlow({ shareSlug }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [project, setProject] = useState<Project | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [editable, setEditable] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoCaption, setPhotoCaption] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/join/${shareSlug}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Ссылка недействительна");
      setPhase("loading");
      return;
    }

    setProject(data.project);
    setAuthenticated(Boolean(data.authenticated));
    setEditable(Boolean(data.editable));
    setParticipant(data.participant ?? null);

    if (!data.authenticated) {
      setPhase("auth");
      return;
    }

    if (data.participant?.status === "submitted") {
      setPhase("done");
      return;
    }

    const answered = data.participant?.answers?.length ?? 0;
    if (answered === 0) {
      setPhase("welcome");
    } else if (answered >= data.project.questions.length) {
      setPhase("photos");
    } else {
      setPhase("question");
      setActiveIndex(answered);
    }
  }, [shareSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!project || phase !== "question") return;
    const q = project.questions[activeIndex];
    if (!q) return;
    const existing = participant?.answers.find((a) => a.questionId === q.id);
    setDraft(existing?.text ?? "");
  }, [activeIndex, participant, phase, project]);

  const answeredIds = useMemo(
    () => new Set(participant?.answers.map((a) => a.questionId) ?? []),
    [participant],
  );

  async function ensureParticipant() {
    const res = await fetch(`/api/join/${shareSlug}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось начать");
    setParticipant(data.participant);
    return data.participant as Participant;
  }

  async function saveAnswer(andNext = false) {
    if (!project) return;
    const question = project.questions[activeIndex];
    if (!question || !draft.trim()) return;
    setBusy(true);
    setError("");
    try {
      let p = participant;
      if (!p) p = await ensureParticipant();
      const res = await fetch(`/api/join/${shareSlug}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          text: draft.slice(0, MAX_TEXT),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось сохранить");
      setParticipant(data.participant);
      if (andNext) {
        if (activeIndex >= project.questions.length - 1) {
          setPhase("photos");
        } else {
          setActiveIndex((i) => i + 1);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File) {
    setBusy(true);
    setError("");
    try {
      let p = participant;
      if (!p) p = await ensureParticipant();
      const form = new FormData();
      form.set("file", file);
      form.set("caption", photoCaption);
      const res = await fetch(`/api/join/${shareSlug}/photos`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось загрузить");
      setParticipant(data.participant);
      setPhotoCaption("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function submitAll() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/join/${shareSlug}/submit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось отправить");
      setParticipant(data.participant);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  const deadlineNote = project
    ? `Редактировать ответы можно до ${new Date(project.deadline).toLocaleDateString("ru-RU")} (${project.daysLeft} дн.)`
    : "";

  if (error && !project) {
    return (
      <div className={`${styles.page} ${styles.pageScenic}`}>
        <p className={styles.error}>{error}</p>
        <Link href="/">На главную</Link>
      </div>
    );
  }

  if (!project || phase === "loading") {
    return (
      <div className={`${styles.page} ${styles.pageScenic}`}>
        <p className={styles.lead}>Открываем проект…</p>
      </div>
    );
  }

  if (phase === "auth") {
    return (
      <div className={`${styles.page} ${styles.pageScenic} ${styles.joinInvitePage}`}>
        <main className={styles.joinInviteMain}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.joinInviteLogo} src={brand.logo} alt={brand.name} />
          <h1 className={styles.joinInviteTitle}>
            Вы приглашены поделиться памятью
            {project.heroName ? ` о ${project.heroName}` : ""}
          </h1>
          <p className={styles.joinInviteBody}>
            Проект «{project.projectTitle}». Чтобы передать ответы, войдите по
            email — мы отправим одноразовую ссылку.
          </p>
          <p className={styles.joinInviteNote}>{deadlineNote}</p>
          <Link
            href={`/auth/participant?project=${encodeURIComponent(shareSlug)}`}
            className={styles.joinInviteCta}
          >
            Присоединиться как участник →
          </Link>
        </main>
      </div>
    );
  }

  if (phase === "welcome") {
    return (
      <div className={`${styles.page} ${styles.pageScenic} ${styles.joinInvitePage}`}>
        <main className={styles.joinInviteMain}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.joinInviteLogo} src={brand.logo} alt={brand.name} />
          <h1 className={styles.joinInviteTitle}>
            Добро пожаловать в Prive Stories
          </h1>
          <p className={styles.joinInviteBody}>
            Вы помогаете создать особенный подарок
            {project.heroName ? ` для ${project.heroName}` : ""}. Ответьте на{" "}
            {project.questions.length}{" "}
            {project.questions.length === 1 ? "вопрос" : "вопроса"} и при
            желании добавьте памятные фотографии.
          </p>
          <p className={styles.joinInviteNote}>{deadlineNote}</p>
          <button
            type="button"
            className={styles.joinInviteCta}
            onClick={() => void ensureParticipant().then(() => setPhase("question"))}
          >
            Перейти к первому вопросу →
          </button>
          <Link href="/cabinet" className={styles.joinInviteNote}>
            Мои проекты
          </Link>
        </main>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className={`${styles.page} ${styles.pageScenic}`}>
        <main className={styles.main}>
          <p className={styles.eyebrow}>Спасибо</p>
          <h1 className={styles.title}>Ответы отправлены</h1>
          <p className={styles.lead}>
            Ваши воспоминания сохранены. {editable ? deadlineNote : "Срок редактирования истёк."}
          </p>
          {editable ? (
            <button
              type="button"
              className={styles.primaryGold}
              onClick={() => {
                setPhase("question");
                setActiveIndex(0);
              }}
            >
              Редактировать ответы
            </button>
          ) : null}
          <Link href="/cabinet" className={styles.secondary}>
            К моим проектам
          </Link>
        </main>
      </div>
    );
  }

  const current = project.questions[activeIndex];

  if (phase === "photos") {
    return (
      <div className={`${styles.page} ${styles.pageScenic}`}>
        <header className={styles.header}>
          <Link href="/cabinet" className={styles.back}>
            ← Кабинет
          </Link>
          <Link href="/" className={styles.logo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.logoWhite} alt={brand.name} />
          </Link>
          <span className={styles.headerHint}>{project.projectTitle}</span>
        </header>
        <main className={styles.main}>
          <p className={styles.eyebrow}>Фотографии</p>
          <h1 className={styles.title}>Памятные фото с героем торжества</h1>
          <p className={styles.lead}>
            Загрузите фотографии с компьютера или телефона и добавьте подпись к
            каждой. Это необязательный шаг.
          </p>
          <p className={styles.hint}>{deadlineNote}</p>

          <section className={styles.card}>
            <label className={styles.field}>
              <span>Подпись к следующему фото</span>
              <input
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="Год, место или короткая история"
              />
            </label>
            <label className={styles.field}>
              <span>Выберите файл</span>
              <input
                type="file"
                accept="image/*"
                disabled={busy || !editable}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPhoto(file);
                  e.target.value = "";
                }}
              />
            </label>
          </section>

          {participant?.photos.length ? (
            <ul className={styles.photoGrid}>
              {participant.photos.map((photo) => (
                <li key={photo.id} className={styles.photoCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.fileUrl} alt={photo.caption || "Фото"} />
                  {photo.caption ? <p>{photo.caption}</p> : null}
                </li>
              ))}
            </ul>
          ) : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setPhase("question");
                setActiveIndex(project.questions.length - 1);
              }}
            >
              ← К вопросам
            </button>
            <button
              type="button"
              className={styles.primaryGold}
              disabled={busy || !editable}
              onClick={() => void submitAll()}
            >
              {busy ? "Отправляем…" : "Отправить ответы"}
            </button>
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
        </main>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${styles.pageScenic}`}>
      <header className={styles.header}>
        <Link href="/cabinet" className={styles.back}>
          ← Кабинет
        </Link>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoWhite} alt={brand.name} />
        </Link>
        <span className={styles.headerHint}>
          {activeIndex + 1} / {project.questions.length}
        </span>
      </header>

      <main className={styles.main}>
        <p className={styles.hint}>{deadlineNote}</p>

        {current ? (
          <section className={styles.card}>
            <p className={styles.questionLabel}>
              Вопрос {activeIndex + 1} из {project.questions.length}
            </p>
            <h2 className={styles.questionTitle}>{current.text}</h2>
            {current.hint ? (
              <p className={styles.participantHint}>
                <span className={styles.participantHintLabel}>Подсказка</span>
                {current.hint}
              </p>
            ) : null}
            <textarea
              className={styles.answerArea}
              rows={8}
              maxLength={MAX_TEXT}
              value={draft}
              disabled={!editable}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_TEXT))}
              placeholder="Напишите историю здесь…"
            />
            <p className={styles.selectedCount}>
              {draft.length} / {MAX_TEXT}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              >
                Назад
              </button>
              <button
                type="button"
                className={styles.primaryGold}
                disabled={busy || !draft.trim() || !editable}
                onClick={() => void saveAnswer(true)}
              >
                {busy ? "Сохраняем…" : "Далее"}
              </button>
            </div>
          </section>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}

        <ol className={styles.timeline}>
          {project.questions.map((q, index) => {
            const done = answeredIds.has(q.id);
            const active = index === activeIndex;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  className={[
                    styles.timelineItem,
                    done ? styles.timelineDone : "",
                    active ? styles.timelineActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setActiveIndex(index);
                    setPhase("question");
                  }}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.timelineText}>{q.text}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}
