"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { brand } from "@/components/home/data";
import { PROMO_CODE_BUILDER } from "@/lib/projects/createTextProject";
import ProfileButton from "@/components/cabinet/ProfileButton";
import styles from "@/components/cabinet/Cabinet.module.css";

export default function ProjectCheckoutPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [promoCode, setPromoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function activate(withPromo: boolean) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/me/projects/${projectId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: withPromo ? promoCode : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось активировать сбор");
      router.replace(`/cabinet/projects/${projectId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={`/cabinet/projects/${projectId}`} className={styles.back}>
          ← К проекту
        </Link>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoBlack} alt={brand.name} />
        </Link>
        <ProfileButton />
      </header>

      <main className={styles.main}>
        <p className={styles.eyebrow}>Оплата</p>
        <h1 className={styles.title}>Активация сбора ответов</h1>
        <p className={styles.lead}>
          После оплаты проект перейдёт в статус «Сбор активен», и участники
          смогут передавать ответы в приложении.
        </p>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Макет оплаты</h2>
          <p className={styles.hint}>
            Здесь будет подключена оплата. Пока можно активировать сбор с
            промокодом <strong>{PROMO_CODE_BUILDER}</strong> или нажать кнопку
            ниже для тестовой активации.
          </p>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span>Тариф</span>
              <strong>Сбор историй</strong>
              <span>до дедлайна проекта</span>
            </div>
            <div className={styles.statCard}>
              <span>К оплате</span>
              <strong>2 500 ₽</strong>
              <span>разово за проект</span>
            </div>
          </div>
          <label className={styles.field}>
            <span>Введите промокод</span>
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder={PROMO_CODE_BUILDER}
            />
          </label>
          <div className={styles.profileActions}>
            <button
              type="button"
              className={styles.primaryGold}
              disabled={busy}
              onClick={() => void activate(Boolean(promoCode.trim()))}
            >
              {busy ? "Активируем…" : "Оплатить и начать сбор"}
            </button>
            <button
              type="button"
              className={styles.secondary}
              disabled={busy}
              onClick={() => void activate(false)}
            >
              Продолжить без промокода (тест)
            </button>
          </div>
        </section>

        {error ? <p className={styles.error}>{error}</p> : null}
      </main>
    </div>
  );
}
