"use client";

import { useState, type CSSProperties } from "react";
import styles from "./KithHome.module.css";
import {
  ARTIFACT_FORMATS,
  FAQS,
  HERO_PHOTOS,
  HOW_IT_WORKS,
  NARRATIVE_PROMPTS,
  NAV_ITEMS,
  OCCASION_CTA,
  OCCASION_PRICE,
  OCCASIONS,
  REVIEWS,
  WHY_REASONS,
} from "./data";

export default function KithHome() {
  const [selectedPromptSet, setSelectedPromptSet] = useState(
    NARRATIVE_PROMPTS[0].id,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [reasonsOpen, setReasonsOpen] = useState(false);
  const [reasonsFlying, setReasonsFlying] = useState(false);
  const [reasonIndex, setReasonIndex] = useState(0);
  const activePrompts =
    NARRATIVE_PROMPTS.find((set) => set.id === selectedPromptSet)?.prompts ??
    NARRATIVE_PROMPTS[0].prompts;
  const activeReason = WHY_REASONS[reasonIndex];

  const openReasons = () => {
    if (reasonsOpen || reasonsFlying) return;
    setReasonIndex(0);
    setReasonsFlying(true);
  };

  const finishFly = () => {
    setReasonsFlying(false);
    setReasonsOpen(true);
  };

  const goNextReason = () => {
    setReasonIndex((current) => (current + 1) % WHY_REASONS.length);
  };

  const closeReasons = () => {
    setReasonsOpen(false);
    setReasonsFlying(false);
    setReasonIndex(0);
  };

  const isLastReason = reasonIndex === WHY_REASONS.length - 1;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <p className={styles.brandTag}>Коллективный артефакт памяти</p>

          <nav
            className={menuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav}
            aria-label="Основная навигация"
            id="primary-nav"
          >
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} onClick={() => setMenuOpen(false)}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.menuToggle}
              aria-expanded={menuOpen}
              aria-controls="primary-nav"
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
            <a className={styles.primaryCta} href="#create">
              Создать подарок
            </a>
          </div>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroGrain} aria-hidden="true" />

        <div className={styles.heroCollage} aria-hidden="true">
          {HERO_PHOTOS.map((photo, index) => (
            <figure
              key={`${photo.src}-${index}`}
              className={`${styles.heroFrame} ${
                index >= 3 ? styles.heroFrameDesktopOnly : ""
              }`}
              style={
                {
                  "--rot": `${photo.rotate}deg`,
                  "--photo": `url(${photo.src})`,
                } as CSSProperties
              }
            >
              <div className={styles.heroFrameMedia} />
            </figure>
          ))}
        </div>

        <div className={styles.heroTop}>
          <h1 id="hero-title">
            Незабываемый групповой подарок
            <br />
            для тех, у кого всё есть
          </h1>
        </div>

        <a className={styles.heroLogo} href="#">
          Prive Stories
        </a>

        <div className={styles.heroBottom}>
          <p className={styles.heroLead}>
            Мы собираем воспоминания, чувства и личные истории от близких людей и
            превращаем их в памятный артефакт. Это единственный подарок, который
            дарит герою чувство значимости и несет тепло на всю жизнь.
          </p>
        </div>
      </section>

      <section className={styles.about} id="about" aria-labelledby="about-title">
        <div
          className={styles.aboutBg}
          style={{ backgroundImage: "url(/about/bg.png)" }}
          role="img"
          aria-label="О проекте"
        />
        <div className={styles.aboutInner}>
          <div
            className={
              reasonsOpen || reasonsFlying
                ? `${styles.aboutStage} ${styles.aboutStageOpen}`
                : styles.aboutStage
            }
          >
            <div className={styles.aboutCardStack}>
              {!reasonsFlying && !reasonsOpen ? (
                <div className={styles.aboutCardBack} aria-hidden="true" />
              ) : null}
              <div className={styles.aboutCard}>
                <div className={styles.aboutCardContent}>
                  <p className={styles.sectionLabel}>О проекте</p>
                  <h2 id="about-title">
                    Мы занимаемся тем, что заставляем людей плакать от счастья,
                    восклицать «Вау! Ты это помнишь» и громко смеяться.
                  </h2>
                  <p className={styles.aboutCardBody}>
                    Самые важные события в жизни заслуживают большего, чем просто
                    открытка. Мы с легкостью собираем все истории, фотографии и
                    воспоминания самых дорогих людей, а затем собираем их в
                    артефакт, который будет храниться у героев вечно.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.aboutCta}
                  onClick={openReasons}
                  aria-expanded={reasonsOpen || reasonsFlying}
                >
                  Почему этот сервис важен →
                </button>
              </div>
            </div>

            {reasonsFlying ? (
              <>
                <div
                  className={styles.aboutFlyer}
                  aria-hidden="true"
                  onAnimationEnd={finishFly}
                />
                <div className={styles.aboutReasonSlot} aria-hidden="true" />
              </>
            ) : null}

            {reasonsOpen ? (
              <aside
                className={styles.aboutReasonPanel}
                aria-live="polite"
                aria-label={`Причина ${reasonIndex + 1} из ${WHY_REASONS.length}`}
              >
                <div key={reasonIndex} className={styles.aboutReasonContent}>
                  <p className={styles.aboutReasonLabel}>
                    Причина {reasonIndex + 1}
                  </p>
                  <h3>{activeReason.title}</h3>
                  {activeReason.paragraphs.map((paragraph, index) => {
                    const isHighlight =
                      paragraph.trim().startsWith("А что если") ||
                      index === activeReason.paragraphs.length - 1;
                    return (
                      <p
                        key={paragraph.slice(0, 40)}
                        className={
                          isHighlight
                            ? styles.aboutHighlight
                            : styles.aboutReasonBody
                        }
                      >
                        {paragraph}
                      </p>
                    );
                  })}
                </div>

                <div className={styles.aboutReasonFooter}>
                  <div className={styles.aboutPagination} role="tablist">
                    {WHY_REASONS.map((reason, index) => (
                      <button
                        key={reason.title}
                        type="button"
                        role="tab"
                        aria-selected={index === reasonIndex}
                        aria-label={`Причина ${index + 1}`}
                        className={
                          index === reasonIndex
                            ? `${styles.aboutDot} ${styles.aboutDotActive}`
                            : styles.aboutDot
                        }
                        onClick={() => setReasonIndex(index)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.aboutCtaOnDark}
                    onClick={isLastReason ? closeReasons : goNextReason}
                  >
                    {isLastReason ? "Согласен" : "Далее"}
                  </button>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </section>

      <main className={styles.main}>
        <section className={styles.books} id="books" aria-labelledby="books-title">
          <div className={styles.sectionHead}>
            <h2 id="books-title">На все случаи жизни</h2>
          </div>

          <div className={styles.booksArc}>
            {OCCASIONS.map((occasion) => (
              <article key={occasion.title} className={styles.card}>
                <div className={styles.cardMedia} role="img" aria-label={`Фото: ${occasion.title}`} />
                <div className={styles.cardBody}>
                  <h3>{occasion.title}</h3>
                  <p className={styles.cardDesc}>{occasion.description}</p>
                  <div className={styles.cardFooter}>
                    <p className={styles.price}>{OCCASION_PRICE}</p>
                    <div className={styles.cardActions}>
                      <a className={styles.cardPrimary} href="#learn">
                        {OCCASION_CTA}
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.how} id="how" aria-labelledby="how-title">
          <div className={styles.sectionHead}>
            <h2 id="how-title">Как это работает</h2>
          </div>

          <ol className={styles.steps}>
            {HOW_IT_WORKS.map((s) => (
              <li key={`${s.step}-${s.title}`} className={styles.step}>
                <p className={styles.stepLabel}>{s.step}</p>
                <h3>{s.title}</h3>
                {Array.isArray(s.body) ? (
                  s.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 32)} className={styles.stepBody}>
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className={styles.stepBody}>{s.body}</p>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section
          className={styles.narrative}
          id="narrative"
          aria-labelledby="narrative-title"
        >
          <div className={styles.sectionHead}>
            <h2 id="narrative-title">Как формируется нарратив</h2>
            <p className={styles.sectionBody}>
              Участники формируют воспоминания и моменты с помощью продуманных
              подсказок. Мы обнаружили, что люди с большей вероятностью напишут
              что-нибудь вдумчивое и значимое, если будет небольшая подсказка,
              ведь пустые места пугают большинство из нас. Мы предлагаем выбрать
              набор подсказок для каждого повода, который сделает ответы
              наполненными лучшим образом.
            </p>
          </div>

          <fieldset className={styles.promptFilters}>
            <legend className={styles.visuallyHidden}>Выберите повод</legend>
            {NARRATIVE_PROMPTS.map((set) => (
              <label
                key={set.id}
                className={
                  selectedPromptSet === set.id
                    ? `${styles.promptFilter} ${styles.promptFilterActive}`
                    : styles.promptFilter
                }
              >
                <input
                  type="radio"
                  name="narrative-occasion"
                  value={set.id}
                  checked={selectedPromptSet === set.id}
                  onChange={() => setSelectedPromptSet(set.id)}
                />
                <span>{set.label}</span>
              </label>
            ))}
          </fieldset>

          <div className={styles.promptMarquee} aria-label="Примеры подсказок">
            <div className={styles.promptTrack}>
              {[0, 1].map((copy) => (
                <div
                  key={`${selectedPromptSet}-copy-${copy}`}
                  className={styles.promptCards}
                  role={copy === 0 ? "list" : "presentation"}
                  aria-hidden={copy === 1}
                >
                  {activePrompts.map((prompt, index) => (
                    <article
                      key={`${selectedPromptSet}-${copy}-${index}`}
                      className={styles.promptCard}
                      role={copy === 0 ? "listitem" : undefined}
                    >
                      <p>{prompt}</p>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.reviews} aria-labelledby="reviews-title">
          <div className={styles.sectionHead}>
            <h2 id="reviews-title">Счастливые слова от счастливых людей</h2>
          </div>

          <div className={styles.reviewGrid}>
            {REVIEWS.map((quote) => (
              <article key={quote.slice(0, 40)} className={styles.reviewCard}>
                <p className={styles.reviewQuote}>{quote}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className={styles.formats}
          id="formats"
          aria-labelledby="formats-title"
        >
          <div className={styles.sectionHead}>
            <h2 id="formats-title">Выберите желаемый формат артефакта</h2>
          </div>

          <div className={styles.formatGrid}>
            {ARTIFACT_FORMATS.map((format, index) => (
              <article key={format.title} className={styles.formatCard}>
                <p className={styles.formatIndex}>0{index + 1}</p>
                <h3>{format.title}</h3>
                <p className={styles.formatDesc}>{format.description}</p>
                {format.notes?.length ? (
                  <ul className={styles.formatNotes}>
                    {format.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className={styles.faq} id="faqs" aria-labelledby="faq-title">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>FAQs</p>
            <h2 id="faq-title">How can we help?</h2>
          </div>

          <div className={styles.faqList}>
            {FAQS.map((f) => (
              <details key={f.q} className={styles.faqItem}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} aria-label="Final call to action">
          <h2>Give Them a Gift they&apos;ll Hold Forever</h2>
          <p className={styles.sectionBody}>
            Starting from just $69, we&apos;ll transform love from friends and family into a beautifully crafted keepsake they&apos;ll treasure forever.
          </p>
          <a className={styles.primaryCtaLarge} href="#create">
            Create a Book
          </a>
          <p className={styles.heroNote}>✧.* Free to start • Ready in about 2 weeks</p>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>All rights reserved © 2026 K&amp;K</p>
          <div className={styles.footerLinks}>
            <a href="#privacy">Privacy policy</a>
            <a href="#terms">Terms &amp; Conditions</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

