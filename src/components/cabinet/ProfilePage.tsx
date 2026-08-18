"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { brand } from "@/components/home/data";
import {
  readOrganizerProjects,
  readOrganizerUserId,
  type StoredOrganizerProject,
} from "@/lib/cabinet/organizerStorage";
import type { OrganizerProjectView } from "@/lib/cabinet/types";
import ProfileButton from "./ProfileButton";
import styles from "./Cabinet.module.css";

type ListedProject = {
  id: string;
  href: string;
  eyebrow: string;
  title: string;
  meta: string;
};

export default function ProfilePage() {
  const [projects, setProjects] = useState<ListedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const stored = readOrganizerProjects();
      const organizerId = readOrganizerUserId();
      const listed: ListedProject[] = [];
      const seen = new Set<string>();

      try {
        if (organizerId) {
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
          <span className={styles.headerHint}>Профиль</span>
          <ProfileButton />
        </div>
      </header>

      <main className={styles.main}>
        <p className={styles.eyebrow}>Организатор</p>
        <h1 className={styles.title}>Ваши проекты</h1>
        <p className={styles.lead}>
          Здесь все созданные вами сборы историй. Откройте проект, чтобы увидеть
          ссылку, аналитику и сценарий
        </p>

        {loading ? <p className={styles.lead}>Загрузка…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        {!loading && projects.length === 0 ? (
          <section className={styles.card}>
            <p className={styles.hint}>
              Пока нет проектов. Создайте первый сбор историй для цифровой
              презентации или видео-поздравления
            </p>
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
