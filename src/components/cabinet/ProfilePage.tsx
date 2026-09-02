"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { brand } from "@/components/home/data";
import {
  clearOrganizerLocal,
  readOrganizerProjects,
  readOrganizerUserId,
  type StoredOrganizerProject,
} from "@/lib/cabinet/organizerStorage";
import type { OrganizerProjectView } from "@/lib/cabinet/types";
import ProfileButton from "./ProfileButton";
import styles from "./Cabinet.module.css";
import auth from "@/components/auth/Auth.module.css";

type ListedProject = {
  id: string;
  href: string;
  eyebrow: string;
  title: string;
  meta: string;
};

function roleLabel(role?: string) {
  if (role === "participant") return "участник";
  if (role === "organizer") return "организатор";
  return "";
}

export default function ProfilePage() {
  const [projects, setProjects] = useState<ListedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [who, setWho] = useState("");
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    async function load() {
      const stored = readOrganizerProjects();
      const organizerId = readOrganizerUserId();
      const listed: ListedProject[] = [];
      const seen = new Set<string>();

      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const me = (await meRes.json()) as { name?: string; email?: string };
          setHasSession(true);
          setWho([me.name, me.email].filter(Boolean).join(" · "));

          const complete = await fetch("/api/me/complete-registration", {
            method: "POST",
          });
          if (complete.ok) {
            const done = (await complete.json()) as {
              completed?: boolean;
              href?: string;
              kind?: string;
              project?: OrganizerProjectView;
            };
            if (done.completed && done.href) {
              window.location.href = done.href;
              return;
            }
          }

          const mine = await fetch("/api/me/projects");
          if (mine.ok) {
            const data = await mine.json();
            for (const p of data.projects as Array<{
              id: string;
              href: string;
              kind: string;
              role: string;
              projectTitle: string;
              heroName: string;
              status: string;
              statusLabel?: string;
              daysLeft: number;
              responseCount: number;
              inProgressCount: number;
            }>) {
              seen.add(p.id);
              const statusLabel =
                p.statusLabel ||
                (p.status === "in_progress"
                  ? "В работе"
                  : p.status === "collecting" || p.status === "active"
                    ? "Сбор активен"
                    : p.status);
              const kindLabel =
                p.kind === "video"
                  ? "Видео-поздравление"
                  : p.kind === "book"
                    ? "Премиум-книга"
                    : p.kind === "presentation"
                      ? "Цифровая презентация"
                      : "Подарок";
              const role = roleLabel(p.role);
              listed.push({
                id: p.id,
                href: p.href,
                eyebrow: `${kindLabel} · ${statusLabel}${role ? ` · ${role}` : ""}`,
                title: `${p.projectTitle} — ${p.heroName}`,
                meta:
                  p.role === "participant"
                    ? `Участник · Дедлайн через ${p.daysLeft} дн. · Ответы можно редактировать до даты дедлайна`
                    : `Организатор · Осталось ${p.daysLeft} дн. · Ответов: ${p.responseCount} · В процессе: ${p.inProgressCount}`,
              });
            }
          }
        }

        if (organizerId && !seen.size) {
          const res = await fetch(
            `/api/organizer/projects?organizerId=${encodeURIComponent(organizerId)}`,
          );
          if (res.ok) {
            const data = await res.json();
            for (const p of data.projects as Array<{
              id: string;
              projectTitle: string;
              heroName: string;
              status: string;
              daysLeft: number;
              responseCount: number;
              inProgressCount: number;
            }>) {
              if (seen.has(p.id)) continue;
              seen.add(p.id);
              listed.push({
                id: p.id,
                href: `/cabinet/video/${p.id}`,
                eyebrow: `Видео-поздравление · ${
                  p.status === "active" ? "сбор идёт" : p.status
                }`,
                title: p.projectTitle,
                meta: `Герой: ${p.heroName} · Осталось ${p.daysLeft} дн. · Ответов: ${p.responseCount} · В процессе: ${p.inProgressCount}`,
              });
            }
          }
        }

        const presentationItems = stored.filter(
          (item) => item.kind !== "video" && !seen.has(item.id),
        );

        const results = await Promise.all(
          presentationItems.map(async (item: StoredOrganizerProject) => {
            const res = await fetch(
              `/api/projects/${item.id}?secret=${encodeURIComponent(item.secret)}`,
            );
            if (!res.ok) return null;
            const data = await res.json();
            const project = data.project as OrganizerProjectView;
            return {
              id: project.id,
              href: `/cabinet/projects/${project.id}?secret=${encodeURIComponent(item.secret)}`,
              eyebrow: `${
                project.artifactType === "presentation"
                  ? "Цифровая презентация"
                  : project.artifactType === "video"
                    ? "Видео-поздравление"
                    : "Премиум-книга"
              } · ${
                project.status === "collecting"
                  ? "сбор идёт"
                  : project.status === "ready"
                    ? "готов к запуску"
                    : project.status
              }`,
              title: project.projectTitle,
              meta: `Герой: ${project.heroName} · Осталось ${project.daysLeft} дн. · Ответов: ${project.responseCount}`,
            } satisfies ListedProject;
          }),
        );

        for (const item of results) {
          if (item) listed.push(item);
        }

        setProjects(listed);
      } catch {
        setError("Не удалось загрузить проекты");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function logout() {
    clearOrganizerLocal();
    window.dispatchEvent(new Event("prive-projects-changed"));
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

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
          <span className={styles.headerHint}>Кабинет</span>
          <ProfileButton />
        </div>
      </header>

      <main className={styles.main}>
        <div className={auth.cabinetBar}>
          <div>
            <p className={styles.eyebrow}>Кабинет</p>
            <h1 className={styles.title}>Ваши проекты</h1>
            {who ? <p className={auth.cabinetWho}>{who}</p> : null}
          </div>
          {hasSession ? (
            <button type="button" className={auth.logoutBtn} onClick={() => void logout()}>
              Выйти
            </button>
          ) : null}
        </div>
        <p className={styles.lead}>
          Здесь проекты, где вы организатор или участник. Откройте карточку,
          чтобы передать ответы или управлять сбором.
        </p>

        {loading ? <p className={styles.lead}>Загрузка…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        {!loading && projects.length === 0 ? (
          <section className={styles.card}>
            <p className={styles.hint}>
              Пока нет проектов. Создайте первый сбор историй для цифровой
              презентации или видео-поздравления
            </p>
            <Link href="/auth/organizer" className={styles.primaryGold}>
              Создать подарок
            </Link>
          </section>
        ) : null}

        <ul className={styles.projectList}>
          {projects.map((project) => (
            <li key={project.id}>
              <Link href={project.href} className={styles.projectCard}>
                <div>
                  <p className={styles.projectEyebrow}>{project.eyebrow}</p>
                  <h2 className={styles.projectTitle}>{project.title}</h2>
                  <p className={styles.projectMeta}>{project.meta}</p>
                </div>
                <span className={styles.projectArrow} aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
