"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { brand } from "@/components/home/data";
import { russianNameCases } from "@/lib/cabinet/questions";
import styles from "@/components/cabinet/Cabinet.module.css";
import videoStyles from "./VideoParticipant.module.css";

type Question = {
  id: string;
  text: string;
  hint?: string | null;
  orderIndex: number;
};
type Answer = {
  id: string;
  questionId: string;
  fileUrl: string;
  fileMimeType?: string | null;
};

type ProjectMeta = {
  title: string;
  heroName: string;
  organizerName: string;
  deadlineLabel: string;
  deadline: string;
  shareSlug: string;
  videoFormat: "vertical" | "horizontal";
  questions: Question[];
};

type Props = { shareSlug: string };

const storageKey = (slug: string) => `prive-video-participant:${slug}`;

export default function VideoParticipantFlow({ shareSlug }: Props) {
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"landing" | "record" | "done">("landing");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/public/project/${shareSlug}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ссылка недействительна");
        return;
      }
      setMeta(data);

      try {
        const raw = localStorage.getItem(storageKey(shareSlug));
        if (!raw) return;
        const saved = JSON.parse(raw) as {
          participantId: string;
          firstName: string;
          lastName: string;
          completed?: boolean;
        };
        setParticipantId(saved.participantId);
        setFirstName(saved.firstName || "");
        setLastName(saved.lastName || "");
        if (saved.completed) setPhase("done");
      } catch {
        /* ignore */
      }
    }
    void load();
  }, [shareSlug]);

  const answeredMap = useMemo(() => {
    const map = new Map<string, Answer>();
    for (const a of answers) map.set(a.questionId, a);
    return map;
  }, [answers]);

  const skippedSet = useMemo(() => new Set(skippedIds), [skippedIds]);

  const current = questions[activeIndex];

  function markSkipped(questionId: string) {
    setSkippedIds((prev) =>
      prev.includes(questionId) ? prev : [...prev, questionId],
    );
  }

  function clearSkipped(questionId: string) {
    setSkippedIds((prev) => prev.filter((id) => id !== questionId));
  }

  function goNext(fromIndex: number, asSkip: boolean) {
    const q = questions[fromIndex];
    if (q && asSkip && !answeredMap.has(q.id)) {
      markSkipped(q.id);
    }
    if (fromIndex >= questions.length - 1) {
      void complete();
      return;
    }
    setActiveIndex(fromIndex + 1);
  }

  async function startRecording() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/public/participant/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          share_slug: shareSlug,
          firstName,
          lastName,
          participantId: participantId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setParticipantId(data.participantId);
      setQuestions(data.questions);
      setAnswers(data.answers || []);
      localStorage.setItem(
        storageKey(shareSlug),
        JSON.stringify({
          participantId: data.participantId,
          firstName,
          lastName,
          completed: false,
        }),
      );
      setPhase("record");
      setActiveIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File) {
    if (!current || !participantId) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("participantId", participantId);
      form.append("questionId", current.id);
      form.append("file", file);
      const res = await fetch("/api/public/upload-video", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      setAnswers((prev) => {
        const rest = prev.filter((a) => a.questionId !== current.id);
        return [
          ...rest,
          {
            id: data.answerId,
            questionId: current.id,
            fileUrl: data.fileUrl,
            fileMimeType: data.fileMimeType,
          },
        ];
      });
      clearSkipped(current.id);
      setPreviewUrl(data.fileUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAnswer(answerId: string) {
    if (!participantId) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/public/media/${answerId}?participantId=${encodeURIComponent(participantId)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setAnswers((prev) => prev.filter((a) => a.id !== answerId));
      setPreviewUrl(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!participantId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/public/participant/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      localStorage.setItem(
        storageKey(shareSlug),
        JSON.stringify({
          participantId,
          firstName,
          lastName,
          completed: true,
        }),
      );
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!current) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(answeredMap.get(current.id)?.fileUrl ?? null);
  }, [current, answeredMap]);

  if (error && !meta) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error}</p>
        <Link href="/">На главную</Link>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className={styles.page}>
        <p className={styles.lead}>Открываем приглашение…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.back}>Участник</span>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoBlack} alt={brand.name} />
        </Link>
        <span className={styles.headerHint}>{meta.title}</span>
      </header>

      <main className={styles.main}>
        {phase === "landing" ? (
          <>
            <p className={videoStyles.deadline}>
              Сбор видео до: {meta.deadlineLabel}
            </p>
            <h1 className={styles.title}>
              {brand.name} — сервис сбора коллективных форматов памяти
            </h1>
            <p className={styles.lead}>
              Вы приглашены стать участником в создании уникального подарка
            </p>
            <article className={styles.inviteBox}>
              <p>
                Здравствуйте! Вы здесь, потому что{" "}
                <strong>{meta.organizerName}</strong> собирает секретный
                видео-альманах для{" "}
                <strong>{russianNameCases(meta.heroName).gen}</strong>. Это не
                просто поздравление, а живой архив памяти, где сохранятся ваши
                искренние эмоции, смех и теплота
              </p>
              <p>
                Не переживайте о съёмке: нам не нужна студийная картинка или
                идеальный дубль. Самое ценное — это вы и ваши настоящие
                воспоминания
              </p>
              <p className={styles.hint}>
                Простые советы перед началом:
                <br />
                • Держите телефон{" "}
                {meta.videoFormat === "horizontal"
                  ? "горизонтально"
                  : "вертикально"}
                Это поможет соблюсти целостность финального общего видео
                <br />
                • Будьте собой. Чем искреннее будут ваши эмоции, тем больше
                эмоций будет у героя поздравления
                <br />
                • Длительность: от 30 секунд до 5 минут на каждый ответ
                <br />• Вопрос можно пропустить — но ваш голос и любая памятная
                мелочь могут быть особенно важны
              </p>
            </article>

            <div className={videoStyles.nameRow}>
              <label className={styles.field}>
                <span>Имя</span>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Имя"
                />
              </label>
              <label className={styles.field}>
                <span>Фамилия</span>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Фамилия"
                />
              </label>
            </div>
            <button
              type="button"
              className={styles.primary}
              disabled={busy || !firstName.trim()}
              onClick={startRecording}
            >
              {busy
                ? "Открываем…"
                : participantId
                  ? "Продолжить запись"
                  : "Начать запись"}
            </button>
          </>
        ) : null}

        {phase === "record" && current ? (
          <>
            <ol className={videoStyles.qTimeline} aria-label="Прогресс по вопросам">
              {questions.map((q, index) => {
                const done = answeredMap.has(q.id);
                const skipped = !done && skippedSet.has(q.id);
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      aria-label={`Вопрос ${index + 1}${
                        done ? ", загружен" : skipped ? ", пропущен" : ""
                      }`}
                      aria-current={index === activeIndex ? "step" : undefined}
                      className={[
                        videoStyles.qStep,
                        done ? videoStyles.qStepDone : "",
                        skipped ? videoStyles.qStepSkipped : "",
                        index === activeIndex ? videoStyles.qStepActive : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setActiveIndex(index)}
                    >
                      {index + 1}
                    </button>
                  </li>
                );
              })}
            </ol>

            <h2 className={styles.questionTitle}>{current.text}</h2>
            {current.hint ? (
              <p className={videoStyles.hint}>
                <span className={videoStyles.hintLabel}>Подсказка</span>
                {current.hint}
              </p>
            ) : null}

            <section className={styles.card}>
              <label className={videoStyles.dropzone}>
                <input
                  type="file"
                  accept="video/*,.mp4,.mov,.webm,.m4v,.quicktime"
                  capture="environment"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadFile(file);
                    e.target.value = "";
                  }}
                />
                <span>
                  {busy
                    ? "Загружаем…"
                    : "Записать на камеру / Выбрать видеофайл"}
                </span>
                <small>mp4, mov, webm, m4v</small>
              </label>

              {previewUrl ? (
                <div className={videoStyles.preview}>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video src={previewUrl} controls playsInline />
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={busy}
                    onClick={() => {
                      const ans = answeredMap.get(current.id);
                      if (ans) void deleteAnswer(ans.id);
                    }}
                  >
                    Удалить и перезаписать
                  </button>
                </div>
              ) : null}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => goNext(activeIndex, true)}
                >
                  Пропустить этот вопрос
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() =>
                    goNext(activeIndex, !answeredMap.has(current.id))
                  }
                >
                  {activeIndex >= questions.length - 1
                    ? "Завершить"
                    : "Далее"}
                </button>
              </div>
            </section>
          </>
        ) : null}

        {phase === "done" ? (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Спасибо! Ваши теплые слова сохранены</h2>
            <p className={styles.leadSmall}>
              Вы сделали ценный вклад в этот подарок. Мы бережно смонтируем ваше
              видео в общий фильм для {meta.heroName}
            </p>
            <p className={styles.hint}>
              Вы можете вернуться по этой же ссылке до {meta.deadlineLabel},
              чтобы пересмотреть, удалить или загрузить новое видео
            </p>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                if (questions.length === 0) {
                  void startRecording();
                } else {
                  setPhase("record");
                }
              }}
            >
              Вернуться к ответам
            </button>
          </section>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
      </main>
    </div>
  );
}
