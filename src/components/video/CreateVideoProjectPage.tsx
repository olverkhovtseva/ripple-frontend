"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { brand } from "@/components/home/data";
import ProfileButton from "@/components/cabinet/ProfileButton";
import {
  rememberVideoProject,
  readOrganizerUserId,
  readOrganizerProfile,
  rememberOrganizerProfile,
} from "@/lib/cabinet/organizerStorage";
import { daysUntil } from "@/lib/cabinet/questions";
import {
  formatPhoneDisplay,
  isValidRuPhone,
  normalizePhone,
} from "@/lib/cabinet/phone";
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
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CreateVideoProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<"auth" | "form">("auth");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerPhone, setOrganizerPhone] = useState("");
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

  const minDeadline = useMemo(() => todayDateInputValue(), []);
  const created = Boolean(shareUrl && projectId);
  const daysLeft = createdDeadline ? daysUntil(createdDeadline) : null;

  const preview = useMemo(
    () => VIDEO_SCENARIO_PROMPTS.map((p) => fillVideoPrompt(p, heroName.trim())),
    [heroName],
  );

  useEffect(() => {
    const profile = readOrganizerProfile();
    if (!profile) return;
    setOrganizerName(profile.name);
    setOrganizerPhone(formatPhoneDisplay(profile.phone));
    setStep("form");
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

  async function continueWithAuth() {
    setBusy(true);
    setError("");
    try {
      if (!organizerName.trim()) throw new Error("Укажите имя");
      if (!isValidRuPhone(organizerPhone)) {
        throw new Error("Укажите корректный номер телефона (+7…)");
      }
      const res = await fetch("/api/auth/organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: organizerName.trim(),
          phone: organizerPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      rememberOrganizerProfile({
        organizerId: data.organizerId,
        name: data.name || organizerName.trim(),
        phone: data.phone,
      });
      setOrganizerPhone(formatPhoneDisplay(data.phone));
      setStep("form");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function createProject() {
    setBusy(true);
    setError("");
    try {
      if (!organizerName.trim() || !isValidRuPhone(organizerPhone)) {
        setStep("auth");
        throw new Error("Сначала укажите имя и телефон");
      }
      if (!title.trim()) throw new Error("Укажите название события");
      if (!heroName.trim()) throw new Error("Укажите имя героя торжества");
      if (!deadline.trim()) throw new Error("Укажите дедлайн сбора");
      if (!isDeadlineNotBeforeToday(deadline)) {
        throw new Error("Дедлайн не может быть раньше сегодняшнего дня");
      }
      if (selected.length < 1 && !customQuestion.trim()) {
        throw new Error("Выберите хотя бы один вопрос или добавьте свой");
      }

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
          video_format: videoFormat,
          selected_prompts,
          custom_prompts: custom,
          organizerId: readOrganizerUserId(),
          organizer_name: organizerName.trim(),
          organizer_phone: organizerPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");

      if (data.organizerId) {
        rememberVideoProject(data.projectId, data.organizerId);
        const phone =
          (typeof data.phone === "string" && data.phone) ||
          readOrganizerProfile()?.phone ||
          normalizePhone(organizerPhone);
        rememberOrganizerProfile({
          organizerId: data.organizerId,
          name: organizerName.trim(),
          phone,
        });
      }
      setShareUrl(data.shareUrl);
      setProjectId(data.projectId);
      setCreatedTitle(data.title || title);
      setCreatedHero(data.heroName || heroName);
      setCreatedDeadline(data.deadline || deadline);
      setCreatedFormat(
        data.videoFormat === "horizontal" ? "horizontal" : "vertical",
      );
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
          <span className={styles.headerHint}>
            {created ? "Проект создан" : "Создание видео"}
          </span>
          <ProfileButton variant="light" />
        </div>
      </header>

      <main className={styles.main}>
        {!created && step === "auth" ? (
          <>
            <p className={styles.eyebrow}>Видео-поздравление</p>
            <h1 className={styles.title}>Войдите как организатор</h1>
            <p className={styles.lead}>
              Укажите имя и телефон — так мы сохраним проекты в вашем профиле
              Подтверждение по SMS пока не требуется
            </p>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Ваши данные</h2>
              <label className={styles.field}>
                <span>Имя</span>
                <input
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="Анна"
                  autoComplete="name"
                />
              </label>
              <label className={styles.field}>
                <span>Телефон</span>
                <input
                  value={organizerPhone}
                  onChange={(e) => setOrganizerPhone(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>
              <p className={styles.hint}>
                По этому номеру вы сможете вернуться к своим проектам на этом
                устройстве
              </p>
              <button
                type="button"
                className={styles.primaryGold}
                disabled={busy}
                onClick={continueWithAuth}
              >
                {busy ? "Сохраняем…" : "Продолжить"}
              </button>
            </section>
          </>
        ) : null}

        {!created && step === "form" ? (
          <>
            <p className={styles.eyebrow}>Видео-поздравление</p>
            <h1 className={styles.title}>Создайте проект сбора роликов</h1>
            <p className={styles.lead}>
              Укажите событие, героя и дедлайн, соберите сценарий из вопросов —
              получите уникальную ссылку для участников
            </p>
            <p className={styles.hint}>
              Организатор: <strong>{organizerName}</strong>
              {" · "}
              {organizerPhone}
              {" · "}
              <button
                type="button"
                className={styles.textLink}
                onClick={() => setStep("auth")}
              >
                изменить
              </button>
            </p>

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
                onClick={createProject}
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
