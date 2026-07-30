"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { brand } from "@/components/home/data";
import {
  daysUntil,
  fillHeroName,
  getScenarioPromptItems,
} from "@/lib/cabinet/questions";
import { rememberOrganizerProject } from "@/lib/cabinet/organizerStorage";
import { joinUrl } from "@/lib/cabinet/serialize";
import type {
  ArtifactType,
  Audience,
  OrganizerProjectView,
} from "@/lib/cabinet/types";
import ProfileButton from "./ProfileButton";
import styles from "./Cabinet.module.css";

function rememberProject(project: OrganizerProjectView) {
  rememberOrganizerProject(project);
  window.dispatchEvent(new Event("prive-projects-changed"));
}

const COPY: Record<
  "presentation" | "book" | "video",
  {
    backHref: string;
    backLabel: string;
    eyebrow: string;
    title: string;
    lead: string;
    titlePlaceholder: (hero: string) => string;
    scenarioHint: string;
    inviteLead: string;
  }
> = {
  presentation: {
    backHref: "/artifacts/presentation",
    backLabel: "← К презентации",
    eyebrow: "Цифровая презентация",
    title: "Создайте проект сбора историй",
    lead: "Укажите героя, дату подарка и соберите сценарий из подсказок. Затем получите уникальную ссылку для участников.",
    titlePlaceholder: (hero) => `Книга ${hero || "Ольги"}`,
    scenarioHint:
      "Мы считаем, что 5–6 подсказок — оптимальное количество, чтобы участники затратили не более 20 минут, не утомлялись и вовлечённо, качественно и глубоко могли записать свои истории.",
    inviteLead:
      "Уникальная ссылка этого проекта. Участники перейдут по ней в свой кабинет и ответят на выбранные вопросы.",
  },
  book: {
    backHref: "/artifacts/book",
    backLabel: "← К книге",
    eyebrow: "Премиум-книга",
    title: "Создайте проект сбора историй",
    lead: "Укажите героя, дату подарка и соберите сценарий из подсказок. Затем получите уникальную ссылку для участников.",
    titlePlaceholder: (hero) => `Книга ${hero || "Ольги"}`,
    scenarioHint:
      "Мы считаем, что 5–6 подсказок — оптимальное количество, чтобы участники затратили не более 20 минут, не утомлялись и вовлечённо, качественно и глубоко могли записать свои истории.",
    inviteLead:
      "Уникальная ссылка этого проекта. Участники перейдут по ней в свой кабинет и ответят на выбранные вопросы.",
  },
  video: {
    backHref: "/artifacts/video",
    backLabel: "← К видео",
    eyebrow: "Видео-поздравление",
    title: "Создайте видео-обращение",
    lead: "Укажите героя, дату подарка и соберите сценарий вопросов. Участники запишут ответы на видео по вашей уникальной ссылке.",
    titlePlaceholder: (hero) => `Фильм для ${hero || "Ольги"}`,
    scenarioHint:
      "Мы считаем, что 5–6 подсказок — оптимальное количество, чтобы участники затратили не более 20 минут, не утомлялись и вовлечённо записали живые видео-истории.",
    inviteLead:
      "Уникальная ссылка этого проекта. Участники перейдут по ней в свой кабинет и запишут ответы на выбранные вопросы.",
  },
};

type Props = {
  artifactType: Extract<ArtifactType, "presentation" | "book" | "video">;
};

export default function CreateProjectPage({ artifactType }: Props) {
  const copy = COPY[artifactType];
  const [heroName, setHeroName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [audience, setAudience] = useState<Audience>("loved");
  const [selected, setSelected] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [inviteMessage, setInviteMessage] = useState("");
  const [project, setProject] = useState<OrganizerProjectView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const prompts = useMemo(() => getScenarioPromptItems(audience), [audience]);
  const daysLeft = deadline ? daysUntil(deadline) : null;
  const link = project ? joinUrl(project.token) : "";

  useEffect(() => {
    if (audience === "loved") {
      setSelected([0, 1, 2, 3, 4, 5]);
    } else {
      setSelected([0, 1, 2, 3, 4]);
    }
  }, [audience]);

  function toggleQuestion(index: number) {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  async function createProject() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifactType,
          heroName,
          projectTitle: projectTitle || undefined,
          deadline,
          audience,
          questionIndexes: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка создания");
      const created = data.project as OrganizerProjectView;
      setProject(created);
      setInviteMessage(created.inviteMessage);
      rememberProject(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function saveInviteAndStart() {
    if (!project) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: project.organizerSecret,
          inviteMessage,
          status: "collecting",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка запуска");
      const updated = data.project as OrganizerProjectView;
      setProject(updated);
      rememberProject(updated);
      window.location.href = `/cabinet/projects/${updated.id}?secret=${encodeURIComponent(updated.organizerSecret)}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className={`${styles.page} ${styles.pageScenic}`}>
      <header className={styles.header}>
        <Link href={copy.backHref} className={styles.back}>
          {copy.backLabel}
        </Link>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoWhite} alt={brand.name} />
        </Link>
        <div className={styles.headerRight}>
          <span className={styles.headerHint}>Кабинет организатора</span>
          <ProfileButton variant="light" />
        </div>
      </header>

      <main className={styles.main}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.lead}>{copy.lead}</p>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>1. Параметры проекта</h2>
          <label className={styles.field}>
            <span>Имя героя торжества</span>
            <input
              value={heroName}
              onChange={(e) => setHeroName(e.target.value)}
              placeholder="Например, Ольга"
              disabled={Boolean(project)}
            />
          </label>
          <label className={styles.field}>
            <span>Название проекта (необязательно)</span>
            <input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder={copy.titlePlaceholder(heroName)}
              disabled={Boolean(project)}
            />
          </label>
          <label className={styles.field}>
            <span>Дата подготовки подарка</span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={Boolean(project)}
            />
          </label>
          {daysLeft !== null ? (
            <p className={styles.daysLeft}>
              Осталось{" "}
              <strong>
                {daysLeft}{" "}
                {daysLeft === 1
                  ? "день"
                  : daysLeft < 5 && daysLeft > 0
                    ? "дня"
                    : "дней"}
              </strong>
              {daysLeft < 0 ? " — дата уже прошла" : ""}
            </p>
          ) : null}

          <fieldset className={styles.audience} disabled={Boolean(project)}>
            <legend>Для кого сценарий</legend>
            <label
              className={audience === "loved" ? styles.chipActive : styles.chip}
            >
              <input
                type="radio"
                name="audience"
                checked={audience === "loved"}
                onChange={() => setAudience("loved")}
              />
              Близкому
            </label>
            <label
              className={
                audience === "colleague" ? styles.chipActive : styles.chip
              }
            >
              <input
                type="radio"
                name="audience"
                checked={audience === "colleague"}
                onChange={() => setAudience("colleague")}
              />
              Коллеге
            </label>
          </fieldset>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>2. Соберите сценарий</h2>
          <p className={styles.hint}>{copy.scenarioHint}</p>
          <p className={styles.selectedCount}>
            Выбрано:{" "}
            <strong>{project ? project.questions.length : selected.length}</strong>
          </p>

          {project ? (
            <ol className={styles.scenarioPreview}>
              {project.questions.map((q, i) => (
                <li key={q.id}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p>{q.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <ul className={styles.questionList}>
              {prompts.map((prompt, index) => {
                const checked = selected.includes(index);
                const previewName = heroName.trim() || "[Имя]";
                return (
                  <li key={prompt.id}>
                    <label className={checked ? styles.qActive : styles.qItem}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleQuestion(index)}
                      />
                      <span>
                        <strong>{prompt.label}</strong>
                        <br />
                        {fillHeroName(prompt.question, previewName)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {!project ? (
              <button
                type="button"
                className={styles.primaryGold}
                disabled={busy}
                onClick={createProject}
              >
                {busy ? "Создаём…" : "Начать сбор"}
              </button>
          ) : null}
        </section>

        {project ? (
          <section className={styles.card} id="invite">
            <h2 className={styles.cardTitle}>3. Ссылка и приглашение</h2>
            <p className={styles.leadSmall}>{copy.inviteLead}</p>
            <div className={styles.linkRow}>
              <code className={styles.linkBox}>{link}</code>
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
                rows={12}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />
            </label>

            <button
              type="button"
              className={styles.primaryGold}
              disabled={busy}
              onClick={saveInviteAndStart}
            >
              {busy ? "Запускаем…" : "Начать сбор"}
            </button>
          </section>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
      </main>
    </div>
  );
}
