"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { brand } from "@/components/home/data";
import ProfileButton from "@/components/cabinet/ProfileButton";
import {
  rememberVideoProject,
  readOrganizerUserId,
} from "@/lib/cabinet/organizerStorage";
import {
  VIDEO_SCENARIO_PROMPTS,
  fillVideoPrompt,
} from "@/lib/video/questions";
import styles from "@/components/cabinet/Cabinet.module.css";

export default function CreateVideoProjectPage() {
  const [title, setTitle] = useState("");
  const [heroName, setHeroName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selected, setSelected] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customHint, setCustomHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [projectId, setProjectId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const preview = useMemo(
    () =>
      VIDEO_SCENARIO_PROMPTS.map((p) =>
        fillVideoPrompt(p, heroName.trim() || "[Имя]"),
      ),
    [heroName],
  );

  function toggle(index: number) {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  async function createProject() {
    setBusy(true);
    setError("");
    try {
      const selected_prompts = selected
        .slice()
        .sort((a, b) => a - b)
        .map((i) => ({
          question: VIDEO_SCENARIO_PROMPTS[i].question,
          hint: VIDEO_SCENARIO_PROMPTS[i].hint,
        }));

      const custom = customQuestion.trim()
        ? [
            {
              question: customQuestion.trim(),
              hint: customHint.trim() || undefined,
            },
          ]
        : [];

      const res = await fetch("/api/projects/create-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          hero_name: heroName,
          deadline,
          selected_prompts,
          custom_prompts: custom,
          organizerId: readOrganizerUserId(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");

      if (data.organizerId) {
        rememberVideoProject(data.projectId, data.organizerId);
      }
      setShareUrl(data.shareUrl);
      setProjectId(data.projectId);
      setInviteMessage(data.inviteMessage || "");
      window.dispatchEvent(new Event("prive-projects-changed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
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
          <span className={styles.headerHint}>Создание видео</span>
          <ProfileButton variant="light" />
        </div>
      </header>

      <main className={styles.main}>
        <p className={styles.eyebrow}>Видео-поздравление</p>
        <h1 className={styles.title}>Создайте проект сбора роликов</h1>
        <p className={styles.lead}>
          Укажите событие, героя и дедлайн, соберите сценарий из вопросов —
          получите уникальную ссылку для участников.
        </p>

        {!shareUrl ? (
          <>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Параметры проекта</h2>
              <label className={styles.field}>
                <span>Название события</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Юбилей Мамы"
                />
              </label>
              <label className={styles.field}>
                <span>Имя виновника торжества</span>
                <input
                  value={heroName}
                  onChange={(e) => setHeroName(e.target.value)}
                  placeholder="Татьяна"
                />
              </label>
              <label className={styles.field}>
                <span>Дедлайн сбора (дата и время)</span>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </label>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Конструктор сценария</h2>
              <p className={styles.hint}>
                Выберите 5–6 вопросов. Участник увидит вопрос и мелкую подсказку
                к нему при записи.
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
                  placeholder='Расскажите, как вы познакомились с [Имя]?'
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
                onClick={createProject}
              >
                {busy ? "Создаём…" : "Создать проект и получить ссылку"}
              </button>
            </section>
          </>
        ) : (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Ссылка для участников</h2>
            <p className={styles.leadSmall}>
              Отправьте эту ссылку близким. Каждый участник запишет видео-ответы
              в своём кабинете.
            </p>
            <div className={styles.linkRow}>
              <code className={styles.linkBox}>{shareUrl}</code>
              <button type="button" className={styles.secondary} onClick={copyLink}>
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
              {copiedInvite ? "Текст скопирован" : "Скопировать текст приглашения"}
            </button>

            <div className={styles.profileActions}>
              <Link
                href={`/cabinet/video/${projectId}`}
                className={styles.primary}
              >
                Открыть аналитику
              </Link>
              <Link href="/cabinet" className={styles.secondary}>
                К профилю
              </Link>
            </div>
          </section>
        )}

        {error ? <p className={styles.error}>{error}</p> : null}
      </main>
    </div>
  );
}
