"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { brand } from "@/components/home/data";
import ProfileButton from "@/components/cabinet/ProfileButton";
import {
  clearCreateDraft,
  readCreateDraft,
  resumeNextPath,
  saveCreateDraft,
  type VideoCreateDraft,
} from "@/lib/cabinet/createDraft";
import {
  rememberVideoProject,
  rememberOrganizerProfile,
} from "@/lib/cabinet/organizerStorage";
import { daysUntil } from "@/lib/cabinet/questions";
import {
  VIDEO_SCENARIO_PROMPTS,
  fillVideoPrompt,
  todayDateInputValue,
  isDeadlineNotBeforeToday,
} from "@/lib/video/questions";
import styles from "@/components/cabinet/Cabinet.module.css";

function daysWord(n: number) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "дней";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дня";
  return "дней";
}

function formatDeadlineLabel(ymd: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!match) return ymd;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CreateVideoProjectPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [organizerName, setOrganizerName] = useState("");
  const [title, setTitle] = useState("");
  const [heroName, setHeroName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [videoFormat, setVideoFormat] = useState<"vertical" | "horizontal">(
    "vertical",
  );
  const [selected, setSelected] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customHint, setCustomHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [projectId, setProjectId] = useState("");
  const [createdTitle, setCreatedTitle] = useState("");
  const [createdHero, setCreatedHero] = useState("");
  const [createdDeadline, setCreatedDeadline] = useState("");
  const [createdFormat, setCreatedFormat] = useState<"vertical" | "horizontal">(
    "vertical",
  );
  const [inviteMessage, setInviteMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const resumeStarted = useRef(false);

  const minDeadline = useMemo(() => todayDateInputValue(), []);
  const created = Boolean(shareUrl && projectId);
  const daysLeft = createdDeadline ? daysUntil(createdDeadline) : null;

  const preview = useMemo(
    () => VIDEO_SCENARIO_PROMPTS.map((p) => fillVideoPrompt(p, heroName.trim())),
    [heroName],
  );

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return;
        const me = (await res.json()) as { name?: string };
        setOrganizerName(me.name || "");
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!created) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [created]);

  function toggle(index: number) {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  function buildDraft(): VideoCreateDraft {
    return {
      kind: "video",
      title: title.trim(),
      heroName: heroName.trim(),
      deadline: deadline.trim(),
      videoFormat,
      selected: selected.slice(),
      customQuestion: customQuestion.trim(),
      customHint: customHint.trim(),
    };
  }

  function validateDraft(draft: VideoCreateDraft) {
    if (!draft.title) throw new Error("Укажите название события");
    if (!draft.heroName) throw new Error("Укажите имя героя торжества");
    if (!draft.deadline) throw new Error("Укажите дедлайн сбора");
    if (!isDeadlineNotBeforeToday(draft.deadline)) {
      throw new Error("Дедлайн не может быть раньше сегодняшнего дня");
    }
    if (draft.selected.length < 1 && !draft.customQuestion) {
      throw new Error("Выберите хотя бы один вопрос или добавьте свой");
    }
  }

  const createFromDraft = useCallback(async (draft: VideoCreateDraft) => {
    setBusy(true);
    setError("");
    try {
      const selected_prompts = draft.selected
        .slice()
        .sort((a, b) => a - b)
        .map((i) => ({
          question: VIDEO_SCENARIO_PROMPTS[i].question,
          hint: VIDEO_SCENARIO_PROMPTS[i].hint,
        }));

      const custom = draft.customQuestion
        ? [
            {
              question: draft.customQuestion,
              hint: draft.customHint || undefined,
            },
          ]
        : [];

      const res = await fetch("/api/projects/create-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          hero_name: draft.heroName,
          deadline: draft.deadline,
          video_format: draft.videoFormat,
          selected_prompts,
          custom_prompts: custom,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");

      if (data.organizerId) {
        rememberVideoProject(data.projectId, data.organizerId);
        rememberOrganizerProfile({
          organizerId: data.organizerId,
          name: organizerName || "Организатор",
          phone: data.phone || "",
        });
      }
      setShareUrl(data.shareUrl);
      setProjectId(data.projectId);
      setCreatedTitle(data.title || draft.title);
      setCreatedHero(data.heroName || draft.heroName);
      setCreatedDeadline(data.deadline || draft.deadline);
      setCreatedFormat(
        data.videoFormat === "horizontal" ? "horizontal" : "vertical",
      );
      setInviteMessage(data.inviteMessage || "");
      clearCreateDraft();
      window.history.replaceState({}, "", pathname);
      window.dispatchEvent(new Event("prive-projects-changed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }, [organizerName, pathname]);

  useEffect(() => {
    if (resumeStarted.current) return;
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("resume") !== "1") {
      return;
    }

    const draft = readCreateDraft();
    if (!draft || draft.kind !== "video") return;

    resumeStarted.current = true;
    setTitle(draft.title);
    setHeroName(draft.heroName);
    setDeadline(draft.deadline);
    setVideoFormat(draft.videoFormat);
    setSelected(draft.selected);
    setCustomQuestion(draft.customQuestion);
    setCustomHint(draft.customHint);

    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          window.location.replace(
            `/auth/organizer?next=${encodeURIComponent(resumeNextPath(pathname))}`,
          );
          return;
        }
        const me = (await res.json()) as { name?: string };
        setOrganizerName(me.name || "");
        await createFromDraft(draft);
      })
      .catch(() => {
        window.location.replace(
          `/auth/organizer?next=${encodeURIComponent(resumeNextPath(pathname))}`,
        );
      });
  }, [createFromDraft, pathname]);

  async function createProject() {
    setBusy(true);
    setError("");
    try {
      const draft = buildDraft();
      validateDraft(draft);

      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        saveCreateDraft(draft);
        window.location.href = `/auth/organizer?next=${encodeURIComponent(resumeNextPath(pathname))}`;
        return;
      }

      await createFromDraft(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function copyInvite() {
    if (!inviteMessage) return;
    await navigator.clipboard.writeText(inviteMessage);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 1600);
  }

  return (
    <div className={`${styles.page} ${styles.pageScenic}`}>
      <header className={styles.header}>
        <Link href="/artifacts/video" className={styles.back}>
          ← К видео
        </Link>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoWhite} alt={brand.name} />
        </Link>
        <div className={styles.headerRight}>
          <span className={styles.headerHint}>
            {created ? "Проект создан" : "Создание видео"}
          </span>
          <ProfileButton variant="light" />
        </div>
      </header>

      <main className={styles.main}>
        {!created ? (
          <>
            <p className={styles.eyebrow}>Видео-поздравление</p>
            <h1 className={styles.title}>Создайте проект сбора роликов</h1>
            <p className={styles.lead}>
              Укажите событие, героя и дедлайн, соберите сценарий из вопросов —
              получите уникальную ссылку для участников
            </p>
            {organizerName ? (
              <p className={styles.hint}>
                Организатор: <strong>{organizerName}</strong>
              </p>
            ) : null}

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Параметры проекта</h2>
              <label className={styles.field}>
                <span>Название события</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Юбилей. Мамы"
                />
              </label>
              <label className={styles.field}>
                <span>Имя героя торжества</span>
                <input
                  value={heroName}
                  onChange={(e) => setHeroName(e.target.value)}
                  placeholder="Татьяна"
                />
              </label>
              <label className={styles.field}>
                <span>Дедлайн сбора</span>
                <input
                  type="date"
                  value={deadline}
                  min={minDeadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </label>
              <fieldset className={styles.audience}>
                <legend>Формат видео</legend>
                <label
                  className={
                    videoFormat === "vertical" ? styles.chipActive : styles.chip
                  }
                >
                  <input
                    type="radio"
                    name="videoFormat"
                    checked={videoFormat === "vertical"}
                    onChange={() => setVideoFormat("vertical")}
                  />
                  Вертикальный
                </label>
                <label
                  className={
                    videoFormat === "horizontal"
                      ? styles.chipActive
                      : styles.chip
                  }
                >
                  <input
                    type="radio"
                    name="videoFormat"
                    checked={videoFormat === "horizontal"}
                    onChange={() => setVideoFormat("horizontal")}
                  />
                  Горизонтальный
                </label>
              </fieldset>
              <p className={styles.hint}>
                Именно этот формат будет предложен участникам при записи
                видео-ответов, чтобы итоговый файл получился единообразным
              </p>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Конструктор сценария</h2>
              <p className={styles.hint}>
                Выберите 5–6 вопросов. Участник увидит вопрос и мелкую подсказку
                к нему при записи
              </p>
              <ul className={styles.questionList}>
                {preview.map((item, index) => {
                  const checked = selected.includes(index);
                  const meta = VIDEO_SCENARIO_PROMPTS[index];
                  return (
                    <li key={meta.id}>
                      <label className={checked ? styles.qActive : styles.qItem}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(index)}
                        />
                        <span>
                          <strong>{meta.label}</strong>
                          <br />
                          {item.question}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <label className={styles.field}>
                <span>Добавить свой вопрос (начиная с «Расскажите...»)</span>
                <input
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Расскажите, как вы познакомились с [Имя]?"
                />
              </label>
              <label className={styles.field}>
                <span>Подсказка к своему вопросу (необязательно)</span>
                <input
                  value={customHint}
                  onChange={(e) => setCustomHint(e.target.value)}
                  placeholder="Коротко подскажите, о чём можно рассказать…"
                />
              </label>
              <button
                type="button"
                className={styles.primaryGold}
                disabled={busy}
                onClick={() => void createProject()}
              >
                {busy ? "Создаём…" : "Создать проект и получить ссылку"}
              </button>
            </section>
          </>
        ) : null}

        {created ? (
          <>
            <p className={styles.eyebrow}>Видео-поздравление</p>
            <h1 className={styles.title}>Проект создан</h1>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Параметры проекта</h2>
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <span>Название</span>
                  <p className={styles.statCardText}>{createdTitle}</p>
                </div>
                <div className={styles.statCard}>
                  <span>Дедлайн</span>
                  <p className={styles.statCardText}>
                    {formatDeadlineLabel(createdDeadline)}
                  </p>
                </div>
                <div className={styles.statCard}>
                  <span>Осталось</span>
                  <strong>
                    {daysLeft === null
                      ? "—"
                      : daysLeft < 0
                        ? "0"
                        : String(daysLeft)}
                  </strong>
                  <span>
                    {daysLeft === null
                      ? ""
                      : daysLeft < 0
                        ? "дата уже прошла"
                        : daysWord(daysLeft)}
                  </span>
                </div>
              </div>
              <p className={styles.projectMeta}>
                Герой: <strong>{createdHero}</strong>
                {" · "}
                Формат:{" "}
                <strong>
                  {createdFormat === "horizontal"
                    ? "горизонтальный"
                    : "вертикальный"}
                </strong>
                {" · "}
                ID: <code>{projectId}</code>
              </p>
            </section>

            <section className={styles.card} id="invite">
              <h2 className={styles.cardTitle}>Ссылка для участников</h2>
              <p className={styles.leadSmall}>
                Отправьте эту ссылку близким. Каждый участник запишет
                видео-ответы в своём кабинете
              </p>
              <div className={styles.linkRow}>
                <code className={styles.linkBox}>{shareUrl}</code>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={copyLink}
                >
                  {copied ? "Скопировано" : "Копировать"}
                </button>
              </div>

              <label className={styles.field}>
                <span>Вовлекающий текст (можно скорректировать)</span>
                <textarea
                  rows={14}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
              </label>
              <button
                type="button"
                className={styles.secondary}
                onClick={copyInvite}
              >
                {copiedInvite
                  ? "Текст скопирован"
                  : "Скопировать текст приглашения"}
              </button>

              <div className={styles.profileActions}>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={!projectId}
                  onClick={() => router.push(`/cabinet/video/${projectId}`)}
                >
                  Смотреть аналитику
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => router.push("/cabinet")}
                >
                  К профилю
                </button>
              </div>
            </section>
          </>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
      </main>
    </div>
  );
}
