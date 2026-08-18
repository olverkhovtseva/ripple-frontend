"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { brand } from "@/components/home/data";
import type { Answer, PublicProject } from "@/lib/cabinet/types";
import styles from "./Cabinet.module.css";

type Props = { token: string };

type ParticipantState = {
  id: string;
  name: string;
  answers: Answer[];
};

const storageKey = (token: string) => `prive-participant:${token}`;

export default function JoinPage({ token }: Props) {
  const [project, setProject] = useState<PublicProject | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"invite" | "answers">("invite");
  const [name, setName] = useState("");
  const [participant, setParticipant] = useState<ParticipantState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/join/${token}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ссылка недействительна");
        return;
      }
      setProject(data.project);

      try {
        const raw = localStorage.getItem(storageKey(token));
        if (!raw) return;
        const saved = JSON.parse(raw) as { participantId: string; name: string };
        setName(saved.name || "");
        const pRes = await fetch(
          `/api/join/${token}/answers?participantId=${encodeURIComponent(saved.participantId)}`,
        );
        const pData = await pRes.json();
        if (pData.participant) {
          setParticipant(pData.participant);
          setName(pData.participant.name);
        }
      } catch {
        /* ignore */
      }
    }
    void load();
  }, [token]);

  const answeredIds = useMemo(
    () => new Set(participant?.answers.map((a) => a.questionId) ?? []),
    [participant],
  );

  useEffect(() => {
    if (!project) return;
    const current = project.questions[activeIndex];
    if (!current || !participant) {
      setDraft("");
      return;
    }
    const existing = participant.answers.find((a) => a.questionId === current.id);
    setDraft(existing?.text ?? "");
  }, [activeIndex, participant, project]);

  async function saveAnswer() {
    if (!project) return;
    const question = project.questions[activeIndex];
    if (!question) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/join/${token}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: participant?.id,
          name,
          questionId: question.id,
          text: draft,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось сохранить");
      const next = data.participant as ParticipantState;
      setParticipant(next);
      localStorage.setItem(
        storageKey(token),
        JSON.stringify({ participantId: next.id, name: next.name }),
      );
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1400);

      const nextUnanswered = project.questions.findIndex(
        (q, i) => i > activeIndex && !next.answers.some((a) => a.questionId === q.id),
      );
      if (nextUnanswered >= 0) setActiveIndex(nextUnanswered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  if (error && !project) {
    return (
      <div className={`${styles.page} ${styles.pageScenic}`}>
        <p className={styles.error}>{error}</p>
        <Link href="/">На главную</Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={`${styles.page} ${styles.pageScenic}`}>
        <p className={styles.lead}>Открываем кабинет участника…</p>
      </div>
    );
  }

  const current = project.questions[activeIndex];

  if (phase === "invite") {
    return (
      <div className={`${styles.page} ${styles.pageScenic} ${styles.joinInvitePage}`}>
        <main className={styles.joinInviteMain}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.joinInviteLogo}
            src={brand.logo}
            alt={brand.name}
          />
          <h1 className={styles.joinInviteTitle}>
            Вы приглашены поделиться памятью о важном человеке
          </h1>
          <p className={styles.joinInviteBody}>
            Ответьте на несколько вопросов и помогите создать особенный подарок
            {project.heroName ? ` для ${project.heroName}` : ""}
          </p>

          <label className={styles.joinInviteField}>
            <span>Ваше имя</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как вас подписать в книге"
            />
          </label>

          <button
            type="button"
            className={styles.joinInviteCta}
            disabled={!name.trim()}
            onClick={() => setPhase("answers")}
          >
            Ответить на вопросы →
          </button>
          <p className={styles.joinInviteNote}>Это займет не более 10 минут</p>
        </main>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${styles.pageScenic}`}>
      <header className={styles.header}>
        <span className={styles.back}>Кабинет участника</span>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoWhite} alt={brand.name} />
        </Link>
        <span className={styles.headerHint}>{project.projectTitle}</span>
      </header>

      <main className={styles.main}>
        <p className={styles.eyebrow}>Ответы</p>
        <h1 className={styles.title}>Поделитесь воспоминанием</h1>
        <p className={styles.lead}>
          Ответы сохраняются только когда вы нажимаете «Сохранить ответ»
          На таймлайне отмечены уже сохранённые вопросы
        </p>

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
                  onClick={() => setActiveIndex(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.timelineText}>{q.text}</span>
                </button>
              </li>
            );
          })}
        </ol>

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
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Напишите историю здесь…"
            />
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
                disabled={busy || !draft.trim()}
                onClick={saveAnswer}
              >
                {busy ? "Сохраняем…" : savedFlash ? "Сохранено" : "Сохранить ответ"}
              </button>
              <button
                type="button"
                className={styles.secondary}
                disabled={activeIndex >= project.questions.length - 1}
                onClick={() =>
                  setActiveIndex((i) =>
                    Math.min(project.questions.length - 1, i + 1),
                  )
                }
              >
                Далее
              </button>
            </div>
          </section>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
      </main>
    </div>
  );
}
