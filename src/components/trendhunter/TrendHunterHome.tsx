"use client";

import Image from "next/image";
import styles from "./TrendHunterHome.module.css";
import { CATEGORIES, EMERGING_ITEMS, HERO_CARDS, TOP_NAV_LINKS } from "./data";
import { useEffect, useMemo, useState } from "react";

type Placement = { x: number; y: number; rotate: number; scale: number; z: number };

const CARD_SPACING = 180;
const SCROLL_SPEED_PX_S = 10;
const ARC_CURVE = 0.00018; // bigger radius => flatter arc
const ROT_PER_PX = 0.02;
const VISIBLE_RANGE = 560;

function wrapX(index: number, scroll: number, total: number) {
  const loop = total * CARD_SPACING;
  let x = index * CARD_SPACING - scroll;
  x -= Math.round(x / loop) * loop;
  return x;
}

function placementFor(x: number): Placement {
  const ax = Math.abs(x);
  return {
    x,
    y: x * x * ARC_CURVE,
    rotate: x * ROT_PER_PX,
    scale: 1 - Math.min(ax / 1100, 0.08),
    z: Math.round(40 - ax / 18),
  };
}

function centerIndex(scroll: number, total: number) {
  const loop = total * CARD_SPACING;
  const n = ((scroll % loop) + loop) % loop;
  return Math.round(n / CARD_SPACING) % total;
}

export default function TrendHunterHome() {
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>(
    CATEGORIES[0],
  );
  const [query, setQuery] = useState("");
  const [scroll, setScroll] = useState(0);
  const [paused, setPaused] = useState(false);
  const [promoted, setPromoted] = useState<number | null>(null);
  const [frozenScroll, setFrozenScroll] = useState(0);

  useEffect(() => {
    if (paused) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setScroll((s) => {
        const loop = HERO_CARDS.length * CARD_SPACING;
        return (s + (SCROLL_SPEED_PX_S * dt) / 1000) % loop;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  const effectiveScroll = paused ? frozenScroll : scroll;
  const dotIndex = useMemo(
    () => centerIndex(effectiveScroll, HERO_CARDS.length),
    [effectiveScroll],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.topbar}>
          <a className={styles.logo} href="#">
            TRENDHUNTER
          </a>

          <nav className={styles.primaryNav} aria-label="Primary">
            <ul>
              {TOP_NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <form
            className={styles.search}
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <label className={styles.srOnly} htmlFor="q">
              Explore a topic
            </label>
            <input
              id="q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="EXPLORE A TOPIC"
              autoComplete="off"
            />
            <button type="submit">SEARCH</button>
          </form>

          <div className={styles.actions}>
            <a className={styles.login} href="#login">
              LOG IN
            </a>
            <a className={styles.subscribe} href="#subscribe">
              SUBSCRIBE
            </a>
          </div>
        </div>

        <nav className={styles.categoryBar} aria-label="Categories">
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  className={activeCategory === c ? styles.catActive : undefined}
                  onClick={() => setActiveCategory(c)}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <h1 id="hero-title" className={styles.heroTitle}>
            WHAT’S NEXT
            <br />
            IS RIGHT HERE
          </h1>

          <div className={styles.arcWrap}>
            <ul className={styles.arc} aria-label="Trending carousel">
              {HERO_CARDS.map((card, i) => {
                const x = wrapX(i, effectiveScroll, HERO_CARDS.length);
                const isPromoted = promoted === i;
                if (!isPromoted && Math.abs(x) > VISIBLE_RANGE) return null;
                const p = placementFor(x);
                return (
                  <li
                    key={card.id}
                    className={`${styles.arcItem} ${isPromoted ? styles.arcItemPromoted : ""}`}
                    style={
                      isPromoted
                        ? ({ zIndex: 80 } as React.CSSProperties)
                        : ({
                            "--x": `${p.x}px`,
                            "--y": `${p.y}px`,
                            "--r": `${p.rotate}deg`,
                            "--s": `${p.scale}`,
                            zIndex: p.z,
                          } as React.CSSProperties)
                    }
                    onMouseEnter={() => {
                      if (promoted !== null) return;
                      setFrozenScroll(scroll);
                      setPaused(true);
                      setPromoted(i);
                    }}
                  >
                    {isPromoted ? (
                      <article
                        className={styles.openCard}
                        onMouseLeave={() => {
                          setPromoted(null);
                          setPaused(false);
                        }}
                      >
                        <div className={styles.openMedia}>
                          <Image
                            src={card.image}
                            alt={card.alt}
                            width={900}
                            height={700}
                            sizes="(max-width: 768px) 92vw, 560px"
                          />
                        </div>
                        <div className={styles.openBody}>
                          <p className={styles.openDate}>{card.date}</p>
                          <h2 className={styles.openTitle}>{card.title}</h2>
                          <p className={styles.openDesc}>{card.description}</p>
                          <div className={styles.openCtaRow}>
                            <a href="#read" className={styles.readMore}>
                              READ MORE
                            </a>
                            <span className={styles.plus} aria-hidden="true">
                              +
                            </span>
                          </div>
                        </div>
                      </article>
                    ) : (
                      <figure className={styles.thumb}>
                        <Image
                          src={card.image}
                          alt={card.alt}
                          width={640}
                          height={800}
                          sizes="(max-width: 768px) 28vw, 11rem"
                        />
                      </figure>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.dots} aria-label="Carousel pagination">
            {HERO_CARDS.map((c, i) => (
              <span
                key={c.id}
                className={`${styles.dot} ${i === dotIndex ? styles.dotActive : ""}`}
              />
            ))}
          </div>
        </section>

        <section className={styles.whatIs} aria-label="What is">
          <div className={styles.pill} aria-hidden="true">
            <span className={styles.pillActive}>WHAT IS</span>
            <span className={styles.pillInactive}>TRENDHUNTER</span>
          </div>
          <p className={styles.statement}>
            BEFORE A TREND HAS A NAME, IT EXISTS AS THOUSANDS OF MICRO-MOMENTS. WE HELP YOU
            UNDERSTAND WHAT’S MOVING, WHY IT MATTERS, AND WHAT TO DO NEXT.
          </p>
        </section>

        <section className={styles.emerging} aria-labelledby="emerging-title">
          <div className={styles.emergingHead}>
            <div>
              <p className={styles.kicker}>WHAT’S EMERGING</p>
              <h2 id="emerging-title">The newest, highest-signal trends gaining momentum right now</h2>
            </div>
            <a className={styles.viewAll} href="#all">
              View more →
            </a>
          </div>

          <div className={styles.emergingGrid}>
            {EMERGING_ITEMS.map((it) => (
              <article key={it.title} className={styles.emergingCard}>
                <p className={styles.meta}>
                  <span>{it.date}</span>
                  <span className={styles.dotSep}>•</span>
                  <span>{it.category}</span>
                </p>
                <h3>{it.title}</h3>
                <p className={styles.kickerLine}>
                  <strong>{it.kicker}</strong> — {it.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

