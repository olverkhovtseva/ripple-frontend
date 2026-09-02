"use client";

import {
  CSSProperties,
  FormEvent,
  ReactNode,
  TransitionEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ProfileButton from "@/components/cabinet/ProfileButton";
import {
  about,
  artifacts,
  Audience,
  assets,
  brand,
  faqItems,
  finalCta,
  headerCta,
  hero,
  heroTags,
  metrics,
  navLinks,
  questionExamples,
  reviews,
  scenarioTabs,
} from "./data";
import AboutValueIcon from "./AboutValueIcon";
import styles from "./HomePage.module.css";

type AboutRoleId = (typeof about.roles)[number]["id"];

type Pt = { x: number; y: number };

function cubicPoint(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return {
    x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
    y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y,
  };
}

function cubicTangent(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x:
      3 * u * u * (p1.x - p0.x) +
      6 * u * t * (p2.x - p1.x) +
      3 * t * t * (p3.x - p2.x),
    y:
      3 * u * u * (p1.y - p0.y) +
      6 * u * t * (p2.y - p1.y) +
      3 * t * t * (p3.y - p2.y),
  };
}

function taperedRibbon(
  cubics: [Pt, Pt, Pt, Pt][],
  halfMin: number,
  halfMax: number,
  steps = 20,
) {
  const left: Pt[] = [];
  const right: Pt[] = [];

  cubics.forEach(([p0, p1, p2, p3], cubicIndex) => {
    const from = cubicIndex === 0 ? 0 : 1;
    for (let i = from; i <= steps; i += 1) {
      const localT = i / steps;
      const globalT = (cubicIndex + localT) / cubics.length;
      const point = cubicPoint(p0, p1, p2, p3, localT);
      const tangent = cubicTangent(p0, p1, p2, p3, localT);
      const length = Math.hypot(tangent.x, tangent.y) || 1;
      const nx = -tangent.y / length;
      const ny = tangent.x / length;
      const envelope = Math.sin(Math.PI * globalT);
      const half = halfMin + (halfMax - halfMin) * envelope;
      left.push({ x: point.x + nx * half, y: point.y + ny * half });
      right.push({ x: point.x - nx * half, y: point.y - ny * half });
    }
  });

  const fmt = (pt: Pt) => `${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
  let d = `M${fmt(left[0])}`;
  for (let i = 1; i < left.length; i += 1) d += `L${fmt(left[i])}`;
  for (let i = right.length - 1; i >= 0; i -= 1) d += `L${fmt(right[i])}`;
  return `${d}Z`;
}

const HERO_UNDERLINE_RIBBON = taperedRibbon(
  [
    [
      { x: 1.8, y: 9.6 },
      { x: 22, y: 2.4 },
      { x: 48, y: 1.2 },
      { x: 72, y: 6.1 },
    ],
    [
      { x: 72, y: 6.1 },
      { x: 88, y: 9.3 },
      { x: 100, y: 14.5 },
      { x: 118, y: 8.3 },
    ],
  ],
  0.18,
  1.08,
);

const TAG_GOLD_RIBBON = taperedRibbon(
  [
    [
      { x: 5.77, y: 1.4 },
      { x: 10.57, y: 9.95 },
      { x: 11.37, y: 20.96 },
      { x: 8.1, y: 31.12 },
    ],
    [
      { x: 8.1, y: 31.12 },
      { x: 5.97, y: 37.9 },
      { x: 2.5, y: 42.98 },
      { x: 6.64, y: 50.6 },
    ],
  ],
  0.2,
  0.95,
);

/** Силуэт плашки: изогнутый левый край + скруглённый правый */
const TAG_SHAPE_FILL =
  "M5.77 1.4H187.2A10.8 10.8 0 0 1 198.75 12.8V39.2A10.8 10.8 0 0 1 187.2 50.6H6.64C2.5 42.98 5.97 37.9 8.1 31.12C11.37 20.96 10.57 9.95 5.77 1.4Z";

const TAG_SHAPE_OUTLINE =
  "M5.77 1.4H187.2A10.8 10.8 0 0 1 198.75 12.8V39.2A10.8 10.8 0 0 1 187.2 50.6H6.64";

/** Ширина, ниже которой стартовый кадр показываем лентой, а не на весь экран */
const HERO_COMPACT_WIDTH = 720;
/** Точка кадрирования по горизонтали: широкий кадр -> узкая ячейка коллажа */
const HERO_FOCUS_START = 62;
const HERO_FOCUS_END = 70;

const HERO_COLLAGE_TILES = [
  { src: assets.heroSide1, className: "tileTL" },
  { src: assets.heroSide4, className: "tileTC" },
  { src: assets.heroSide2, className: "tileTR" },
  { src: assets.heroSide7, className: "tileML" },
  { src: assets.heroSide3, className: "tileMR" },
  { src: assets.heroSide6, className: "tileBL" },
  { src: assets.heroSide8, className: "tileBC" },
  { src: assets.heroSide5, className: "tileBR" },
] as const;

function GiftCta({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a
      className={`${styles.giftCta}${className ? ` ${className}` : ""}`}
      href={href}
      onClick={onClick}
    >
      <span className={styles.giftCtaFrame} aria-hidden>
        <svg viewBox="0 0 200 52" preserveAspectRatio="none">
          <path className={styles.giftCtaFill} d={TAG_SHAPE_FILL} />
          <path className={styles.giftCtaEdge} d={TAG_GOLD_RIBBON} />
        </svg>
      </span>
      <span className={styles.giftCtaLabel}>{children}</span>
    </a>
  );
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function MetricLabel({
  accent,
  label,
}: {
  accent?: string;
  label: string;
}) {
  if (!accent) {
    return <p className={styles.metricLabel}>{label}</p>;
  }

  return (
    <p className={styles.metricLabel}>
      <span className={styles.metricAccent}>{accent}</span> {label}
    </p>
  );
}

type AboutValue = (typeof about.roles)[number]["values"][number];

function AboutValueCell({
  value,
  variant,
}: {
  value: AboutValue;
  variant: "featured" | "left" | "right";
}) {
  const cellClass =
    variant === "featured"
      ? styles.aboutValueFeatured
      : variant === "left"
        ? styles.aboutValueCellLeft
        : styles.aboutValueCellRight;

  return (
    <article className={cellClass}>
      <AboutValueIcon name={value.icon} featured={variant === "featured"} />
      <h4
        className={
          variant === "featured"
            ? styles.aboutValueFeaturedTitle
            : styles.aboutValueCellTitle
        }
      >
        {value.title}
      </h4>
      <p
        className={
          variant === "featured"
            ? styles.aboutValueFeaturedBody
            : styles.aboutValueCellBody
        }
      >
        {value.body}
      </p>
    </article>
  );
}

export default function HomePage() {
  const [audience, setAudience] = useState<Audience>("loved");
  const [artifactIndex, setArtifactIndex] = useState(0);
  const [carouselDir, setCarouselDir] = useState<1 | -1>(1);
  const [aboutRoleId, setAboutRoleId] = useState<AboutRoleId>("organizer");
  const [carouselBusy, setCarouselBusy] = useState(false);
  const [wrappingIndex, setWrappingIndex] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [reviewsVisible, setReviewsVisible] = useState(3);
  const [reviewIndex, setReviewIndex] = useState(3);
  const [reviewStep, setReviewStep] = useState(0);
  const [reviewTransition, setReviewTransition] = useState(true);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroMotion, setHeroMotion] = useState({
    collage: 0,
    metrics: 0,
    content: 1,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    focus: HERO_FOCUS_START,
    edge: 0,
    zoom: 1,
    quote: 0,
  });

  const [howFlip, setHowFlip] = useState(0);
  const howPinRef = useRef<HTMLElement>(null);
  const howRafRef = useRef(0);
  const heroPinRef = useRef<HTMLElement>(null);
  const heroStickyRef = useRef<HTMLDivElement>(null);
  const heroSlotRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);
  const heroRafRef = useRef(0);
  const reviewsViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const pin = howPinRef.current;
    if (!pin) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    function updateHow() {
      const el = howPinRef.current;
      if (!el) return;
      if (reduced.matches) {
        setHowFlip(0);
        return;
      }
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const raw = Math.min(1, Math.max(0, -rect.top / travel));
      setHowFlip(smoothstep(raw));
    }

    function onScroll() {
      if (howRafRef.current) return;
      howRafRef.current = window.requestAnimationFrame(() => {
        howRafRef.current = 0;
        updateHow();
      });
    }

    updateHow();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (howRafRef.current) window.cancelAnimationFrame(howRafRef.current);
    };
  }, []);

  useEffect(() => {
    const pin = heroPinRef.current;
    if (!pin) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    function updateHero() {
      const el = heroPinRef.current;
      const sticky = heroStickyRef.current;
      const slot = heroSlotRef.current;
      const img = heroImgRef.current;
      if (!el || !sticky) return;

      const imgAspect =
        img?.naturalWidth && img.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : 16 / 9;

      if (reduced.matches) {
        const sr = slot?.getBoundingClientRect();
        const st = sticky.getBoundingClientRect();
        setHeroMotion({
          collage: 1,
          metrics: 1,
          content: 0,
          x: sr ? sr.left - st.left : 0,
          y: sr ? sr.top - st.top : 0,
          w: sr?.width ?? 0,
          h: sr?.height ?? 0,
          focus: HERO_FOCUS_END,
          edge: 0,
          zoom: 1,
          quote: 1,
        });
        return;
      }

      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));

      const collage = smoothstep(progress / 0.55);
      const metrics = smoothstep((progress - 0.52) / 0.48);
      const content = 1 - smoothstep(progress / 0.32);
      // Фраза проступает только после того, как кадр встал в ячейку
      const quote = smoothstep((progress - 0.55) / 0.1);

      const st = sticky.getBoundingClientRect();
      const vw = st.width;
      const vh = st.height;

      // Стартовый кадр — во всю ширину экрана. На вытянутых экранах он лентой
      // сверху: на всю высоту горизонтальный кадр схлопнулся бы в полосу.
      const compact = vw <= HERO_COMPACT_WIDTH || vw / vh < 1.15;
      const startW = vw;
      const startH = compact ? Math.min(vh * 0.48, vw / 1.12) : vh;
      const startX = 0;
      const startY = 0;

      const sr = slot?.getBoundingClientRect();
      const slotX = sr ? sr.left - st.left : startX;
      const slotY = sr ? sr.top - st.top : startY;
      const slotW = sr?.width ?? startW;
      const slotH = sr?.height ?? startH;

      // Конечный прямоугольник: вся ячейка коллажа (без тёмных полей)
      const endW = slotW;
      const endH = slotH;
      const endX = slotX;
      const endY = slotY;

      // Ячейка шире кадра — подтягиваем героиню, но не до конца: левая треть
      // остаётся спокойной, там встаёт фраза
      const cellAspect = endW / Math.max(1, endH);
      const endZoom =
        cellAspect > imgAspect
          ? Math.min(1.2, 1 + (cellAspect / imgAspect - 1) * 0.55)
          : 1;

      const t = collage;
      setHeroMotion({
        collage,
        metrics,
        content,
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t,
        w: startW + (endW - startW) * t,
        h: startH + (endH - startH) * t,
        focus: HERO_FOCUS_START + (HERO_FOCUS_END - HERO_FOCUS_START) * t,
        edge: compact ? 1 : 0,
        zoom: 1 + (endZoom - 1) * t,
        quote,
      });
    }

    function onScroll() {
      cancelAnimationFrame(heroRafRef.current);
      heroRafRef.current = requestAnimationFrame(updateHero);
    }

    updateHero();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    reduced.addEventListener("change", onScroll);
    const img = heroImgRef.current;
    img?.addEventListener("load", onScroll);

    return () => {
      cancelAnimationFrame(heroRafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      reduced.removeEventListener("change", onScroll);
      img?.removeEventListener("load", onScroll);
    };
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function pickAudience(next: Audience) {
    setAudience(next);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function getArtifactSlot(index: number) {
    const offset =
      (index - artifactIndex + artifacts.length) % artifacts.length;
    if (offset === 0) return "center";
    if (offset === 1) return "right";
    return "left";
  }

  function goArtifact(nextIndex: number) {
    if (carouselBusy || nextIndex === artifactIndex) return;
    const n = artifacts.length;
    const forward = (nextIndex - artifactIndex + n) % n;
    const backward = (artifactIndex - nextIndex + n) % n;
    const dir: 1 | -1 = forward <= backward ? 1 : -1;
    const wrap =
      dir === 1
        ? (artifactIndex - 1 + n) % n
        : (artifactIndex + 1) % n;

    setCarouselDir(dir);
    setWrappingIndex(wrap);
    setCarouselBusy(true);
    setArtifactIndex(nextIndex);
    window.setTimeout(() => {
      setWrappingIndex(null);
      setCarouselBusy(false);
    }, 580);
  }

  function shiftArtifact(delta: 1 | -1) {
    goArtifact((artifactIndex + delta + artifacts.length) % artifacts.length);
  }

  const paddedReviews = useMemo(() => {
    const pad = reviewsVisible;
    return [
      ...reviews.slice(-pad),
      ...reviews,
      ...reviews.slice(0, pad),
    ];
  }, [reviewsVisible]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const update = () => {
      const nextVisible = mq.matches ? 1 : 3;
      setReviewsVisible(nextVisible);
      setReviewIndex(nextVisible);
      setReviewTransition(false);
      setReviewBusy(false);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const viewport = reviewsViewportRef.current;
    if (!viewport) return;

    function updateStep() {
      const track = viewport?.firstElementChild as HTMLElement | null;
      if (!track || !viewport) return;
      const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
      const width = viewport.clientWidth;
      const step =
        (width - gap * (reviewsVisible - 1)) / reviewsVisible + gap;
      setReviewStep(step);
    }

    updateStep();
    const observer = new ResizeObserver(updateStep);
    observer.observe(viewport);
    window.addEventListener("resize", updateStep);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateStep);
    };
  }, [reviewsVisible]);

  function shiftAboutRole(delta: 1 | -1) {
    const roles = about.roles;
    const currentIndex = roles.findIndex((role) => role.id === aboutRoleId);
    const nextIndex = (currentIndex + delta + roles.length) % roles.length;
    setAboutRoleId(roles[nextIndex].id);
  }

  function shiftReview(delta: 1 | -1) {
    if (reviewBusy) return;
    setReviewTransition(true);
    setReviewBusy(true);
    setReviewIndex((current) => current + delta);
  }

  function onReviewTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== "transform"
    ) {
      return;
    }

    setReviewBusy(false);

    const realStart = reviewsVisible;
    const realEnd = reviewsVisible + reviews.length - 1;

    if (reviewIndex > realEnd) {
      setReviewTransition(false);
      setReviewIndex(reviewIndex - reviews.length);
      requestAnimationFrame(() => setReviewTransition(true));
      return;
    }

    if (reviewIndex < realStart) {
      setReviewTransition(false);
      setReviewIndex(reviewIndex + reviews.length);
      requestAnimationFrame(() => setReviewTransition(true));
    }
  }

  function jumpToArtifact(artifactId: (typeof artifacts)[number]["id"]) {
    const index = artifacts.findIndex((item) => item.id === artifactId);
    if (index >= 0) {
      setArtifactIndex(index);
      setWrappingIndex(null);
      setCarouselBusy(false);
    }
    document
      .getElementById("artifacts")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.headerDesktop} aria-label="Основная навигация">
          <a className={styles.logo} href="#start" aria-label={brand.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.logoImg}
              src={brand.logo}
              alt={brand.name}
            />
          </a>
          {navLinks.map((link) => (
            <a key={link.href} className={styles.navLink} href={link.href}>
              {link.label}
            </a>
          ))}
          <div className={styles.headerActions}>
            <GiftCta className={styles.headerCta} href={headerCta.href}>
              {headerCta.label}
            </GiftCta>
            <div className={styles.headerProfile}>
              <ProfileButton variant="light" />
            </div>
          </div>
        </nav>

        <div className={styles.mobileBar}>
          <a className={styles.logo} href="#start" aria-label={brand.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.logoImg}
              src={brand.logo}
              alt={brand.name}
            />
          </a>
          <div className={styles.mobileBarRight}>
            <GiftCta className={styles.headerCtaMobile} href={headerCta.href}>
              {headerCta.label}
            </GiftCta>
            <ProfileButton variant="light" />
            <button
              type="button"
              className={styles.menuBtn}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        <nav
          id="mobile-menu"
          className={menuOpen ? styles.mobileMenuOpen : styles.mobileMenu}
          aria-hidden={!menuOpen}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              className={styles.mobileMenuLink}
              href={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
          <GiftCta
            className={styles.headerCta}
            href={headerCta.href}
            onClick={closeMenu}
          >
            {headerCta.label}
          </GiftCta>
        </nav>
      </header>

      <section className={styles.heroPin} id="start" ref={heroPinRef}>
        <div
          className={styles.heroSticky}
          ref={heroStickyRef}
          style={
            {
              "--hero-collage": String(heroMotion.collage),
              "--hero-metrics": String(heroMotion.metrics),
              "--hero-content": String(heroMotion.content),
              "--hero-edge": String(heroMotion.edge),
            } as CSSProperties
          }
        >
          <div className={styles.heroCollage} aria-hidden>
            {HERO_COLLAGE_TILES.map((tile) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={tile.className}
                className={`${styles.heroTile} ${styles[tile.className]}`}
                src={tile.src}
                alt=""
              />
            ))}
            <div className={styles.heroMainSlot} ref={heroSlotRef} />
          </div>

          <div
            className={styles.heroMainFly}
            style={{
              transform: `translate3d(${heroMotion.x}px, ${heroMotion.y}px, 0)`,
              width: heroMotion.w ? `${heroMotion.w}px` : "100%",
              height: heroMotion.h ? `${heroMotion.h}px` : "100%",
            }}
          >
            <span className={styles.heroMainClip} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={heroImgRef}
                className={styles.heroMainImg}
                src={assets.heroMain}
                alt=""
                style={{
                  objectPosition: `${heroMotion.focus}% center`,
                  transform: `scale(${heroMotion.zoom})`,
                  transformOrigin: `${heroMotion.focus}% center`,
                }}
              />
            </span>

            <p
              className={styles.heroQuote}
              style={{ opacity: heroMotion.quote }}
              aria-hidden={heroMotion.quote < 0.5}
            >
              <span className={styles.heroQuoteLead}>
                {hero.collageQuote.lead}
              </span>
              <span className={styles.heroQuoteAccent}>
                {hero.collageQuote.accent}
              </span>
            </p>
          </div>

          <div className={styles.heroScrim} />

          <div className={styles.heroInner}>
            <div
              className={styles.heroContent}
              style={{
                pointerEvents: heroMotion.content > 0.12 ? "auto" : "none",
              }}
            >
              <h1 className={styles.heroTitle}>
                {hero.titleLead}
                <br />
                <span className={styles.heroTitleAudience}>
                  {hero.titleAudience}
                </span>
                <br />
                {hero.titleMid}{" "}
                <span className={styles.heroTitleMark}>
                  {hero.titleAccentWord}
                  <svg
                    className={styles.heroTitleUnderline}
                    viewBox="0 0 120 14"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path d={HERO_UNDERLINE_RIBBON} fill="currentColor" />
                  </svg>
                </span>{" "}
                {hero.titleAccentTail}
              </h1>
              <p className={styles.heroLead}>
                <span className={styles.heroLeadBody}>{hero.subtitle}</span>
              </p>

              <ul className={styles.tags}>
                {heroTags.map((tag) => (
                  <li key={tag.label}>
                    <span className={styles.tagFrame} aria-hidden>
                      <svg viewBox="0 0 200 52" preserveAspectRatio="none">
                        <path
                          className={styles.tagFrameFill}
                          d={TAG_SHAPE_FILL}
                        />
                        <path
                          className={styles.tagFramePaper}
                          d={TAG_SHAPE_OUTLINE}
                          fill="none"
                          strokeWidth="1.35"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                        <path
                          className={styles.tagFrameGold}
                          d={TAG_GOLD_RIBBON}
                        />
                      </svg>
                    </span>
                    <button
                      type="button"
                      className={styles.tagCard}
                      onClick={() => jumpToArtifact(tag.artifactId)}
                    >
                      <span className={styles.tagLabel}>{tag.label}</span>
                      <span className={styles.tagArrow} aria-hidden>
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.metrics} aria-label="Метрики">
              {metrics.map((item) => (
                <article
                  key={`${item.prefix ?? ""}${item.figure}${item.unit ?? ""}`}
                  className={styles.metric}
                >
                  <p className={styles.metricValue}>
                    {item.prefix ? (
                      <span className={styles.metricUnit}>{item.prefix} </span>
                    ) : null}
                    <span className={styles.metricFigure}>{item.figure}</span>
                    {item.unit ? (
                      <span className={styles.metricUnit}> {item.unit}</span>
                    ) : null}
                  </p>
                  <MetricLabel label={item.label} />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.aboutBlock} id="about">
        <div className={styles.aboutSplit}>
          <div className={styles.aboutSplitInner}>
            <aside className={styles.aboutSplitLeft}>
              <div className={styles.aboutSplitSticky}>
                <div className={styles.aboutSplitBg} aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={about.leftBg} alt="" />
                </div>
                <p className={styles.eyebrow}>{about.eyebrow}</p>
                <div className={styles.aboutLeftCopy}>
                  <h2 className={styles.aboutTitle}>
                    <strong className={styles.aboutTitleBrand}>
                      {about.leftLead}
                    </strong>
                    {" — "}
                    {about.leftTagline}
                  </h2>
                  {about.leftParagraphs.map((paragraph) => (
                    <p key={paragraph} className={styles.aboutIntroBody}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </aside>

            <div className={styles.aboutSplitRight}>
              <div className={styles.aboutValuesCarousel}>
                <button
                  type="button"
                  className={styles.aboutValuesNav}
                  aria-label="Предыдущая аудитория"
                  onClick={() => shiftAboutRole(-1)}
                >
                  ‹
                </button>

                <div className={styles.aboutValues}>
                  <h3 className={styles.aboutValuesHeading}>
                    {about.valuesHeading}
                  </h3>

                  <div
                    className={styles.aboutTabs}
                    role="tablist"
                    aria-label="Аудитория"
                  >
                    {about.roles.map((role) => {
                      const active = role.id === aboutRoleId;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          role="tab"
                          id={`about-tab-${role.id}`}
                          aria-selected={active}
                          aria-controls={`about-panel-${role.id}`}
                          tabIndex={active ? 0 : -1}
                          className={
                            active ? styles.aboutTabActive : styles.aboutTab
                          }
                          onClick={() => setAboutRoleId(role.id)}
                        >
                          {role.tab}
                        </button>
                      );
                    })}
                  </div>

                  {about.roles.map((role) => {
                    if (role.id !== aboutRoleId) return null;
                    const featured =
                      role.values.find((value) => value.featured) ??
                      role.values[0];
                    const sideValues = role.values.filter(
                      (value) => value !== featured,
                    );
                    const leftValue = sideValues[0];
                    const rightValue = sideValues[1];

                    return (
                      <div
                        key={role.id}
                        className={styles.aboutValuesPanel}
                        role="tabpanel"
                        id={`about-panel-${role.id}`}
                        aria-labelledby={`about-tab-${role.id}`}
                      >
                        <div className={styles.aboutValuesBook}>
                          <AboutValueCell
                            value={featured}
                            variant="featured"
                          />
                          <div className={styles.aboutValuesSeam} aria-hidden>
                            <svg
                              viewBox="0 0 100 12"
                              preserveAspectRatio="none"
                            >
                              <path
                                d="M0 0 Q50 12 100 0"
                                fill="none"
                                stroke="rgba(245, 245, 243, 0.18)"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                              />
                            </svg>
                          </div>
                          <div className={styles.aboutValuesBottom}>
                            {leftValue ? (
                              <AboutValueCell
                                value={leftValue}
                                variant="left"
                              />
                            ) : null}
                            {rightValue ? (
                              <AboutValueCell
                                value={rightValue}
                                variant="right"
                              />
                            ) : null}
                          </div>
                        </div>

                        <blockquote className={styles.aboutValueQuote}>
                          <p>«{role.quote.text}»</p>
                          <footer>{role.quote.author}</footer>
                        </blockquote>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className={styles.aboutValuesNav}
                  aria-label="Следующая аудитория"
                  onClick={() => shiftAboutRole(1)}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.howSection} id="how">
        <div className={styles.howIntro}>
          <h2 className={styles.howHeading}>Как это работает</h2>
        </div>

        <article
          ref={howPinRef}
          className={styles.howPin}
          style={{ "--how-flip": howFlip } as CSSProperties}
        >
          <div className={styles.howSticky}>
            <div className={styles.howCopy}>
              <span className={styles.aboutPointNum} aria-hidden>
                {about.stepCreate.num}
              </span>
              <div className={styles.howCopyStack}>
                <div
                  className={styles.howCopyFront}
                  style={{ opacity: 1 - howFlip }}
                  aria-hidden={howFlip > 0.55}
                >
                  <h3 className={styles.aboutStepTitle}>
                    {about.stepCreate.title}
                  </h3>
                  <p className={styles.aboutStepBody}>{about.stepCreate.body}</p>
                </div>
                <div
                  className={styles.howCopyBack}
                  style={{ opacity: howFlip }}
                  aria-hidden={howFlip < 0.45}
                >
                  <h3 className={styles.aboutStepTitle}>
                    {about.stepCreate.afterFlipLead}
                  </h3>
                </div>
              </div>
            </div>

            <div className={styles.howPhoneScene}>
              <div
                className={styles.howPhone}
                style={{
                  transform: `rotateY(${howFlip * 180}deg)`,
                }}
              >
                <div className={`${styles.howPhoneFace} ${styles.howPhoneFront}`}>
                  <div className={styles.howPhoneBezel}>
                    <div className={styles.howPhoneIsland} aria-hidden />
                    <div className={styles.howCreateScreen}>
                      <p className={styles.howCreateBrand}>Prive Stories</p>
                      <p className={styles.howCreateEyebrow}>Соберите сценарий</p>
                      <label className={styles.howCreateField}>
                        <span>Имя героя торжества</span>
                        <strong>{about.stepCreate.demo.heroName}</strong>
                      </label>
                      <label className={styles.howCreateField}>
                        <span>Дедлайн готовности</span>
                        <strong>{about.stepCreate.demo.deadline}</strong>
                      </label>
                      <p className={styles.howCreateSelected}>
                        Выбрано: <strong>{about.stepCreate.demo.selectedCount}</strong>
                      </p>
                      <ul className={styles.howCreateQuestions}>
                        {about.stepCreate.demo.questions.map((q) => (
                          <li
                            key={q.label}
                            className={
                              q.checked
                                ? styles.howQuestionOn
                                : styles.howQuestionOff
                            }
                          >
                            <span
                              className={
                                q.checked
                                  ? styles.howCheckOn
                                  : styles.howCheckOff
                              }
                              aria-hidden
                            />
                            <span className={styles.howQuestionCopy}>
                              <strong>{q.label}</strong>
                              <em>{q.text}</em>
                            </span>
                          </li>
                        ))}
                      </ul>
                      <button type="button" className={styles.howCreateCta}>
                        {about.stepCreate.demo.cta}
                      </button>
                    </div>
                  </div>
                </div>
                <div className={`${styles.howPhoneFace} ${styles.howPhoneBack}`}>
                  <div className={styles.howPhoneBezel}>
                    <div className={styles.howPhoneIsland} aria-hidden />
                    <div className={styles.howInviteScreen}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.howInviteLogo}
                        src={brand.logo}
                        alt={brand.name}
                      />
                      <h4 className={styles.howInviteTitle}>
                        {about.stepCreate.invite.title}
                      </h4>
                      <p className={styles.howInviteBody}>
                        {about.stepCreate.invite.body}
                      </p>
                      <button type="button" className={styles.howInviteCta}>
                        {about.stepCreate.invite.cta} →
                      </button>
                      <p className={styles.howInviteNote}>
                        {about.stepCreate.invite.note}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <div className={styles.aboutSteps}>
          <article
            className={`${styles.aboutStepRow} ${styles.aboutStepScenario}`}
          >
            <div className={styles.aboutStepCopy}>
              <span className={styles.aboutPointNum} aria-hidden>
                {about.stepQuestions.num}
              </span>
              <h3 className={styles.aboutStepTitle}>
                {about.stepQuestions.title}
              </h3>
              <p className={styles.aboutStepBody}>{about.stepQuestions.body}</p>
              <p className={styles.aboutStepBody}>
                {about.stepQuestions.hints}
              </p>
            </div>

            <div className={styles.aboutScenarioPanel}>
              <p className={styles.aboutScenarioEyebrow}>
                {about.stepQuestions.scenarioEyebrow}
              </p>
              <fieldset className={styles.scenarioPick}>
                <legend className={styles.srOnly}>Для кого сценарий</legend>
                {scenarioTabs.map((item) => (
                  <label
                    key={item.id}
                    className={
                      audience === item.id
                        ? styles.scenarioRadioActive
                        : styles.scenarioRadio
                    }
                  >
                    <input
                      type="radio"
                      name="scenario"
                      checked={audience === item.id}
                      onChange={() => pickAudience(item.id)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </fieldset>

              <div className={styles.scenarioMarquee} key={audience}>
                <div
                  className={styles.scenarioTrack}
                  style={{
                    animationDuration: `${Math.max(
                      40,
                      questionExamples[audience].length * 7,
                    )}s`,
                  }}
                >
                  {[
                    ...questionExamples[audience],
                    ...questionExamples[audience],
                  ].map((q, index) => (
                    <article
                      key={`${audience}-${index}`}
                      className={styles.scenarioCard}
                    >
                      <p>{q}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article
            className={`${styles.aboutStepRow} ${styles.aboutStepFinale}`}
          >
            <div className={styles.aboutStepCopy}>
              <span className={styles.aboutPointNum} aria-hidden>
                {about.stepFinale.num}
              </span>
              <h3 className={styles.aboutStepTitle}>
                {about.stepFinale.title}
              </h3>
              <p className={styles.aboutStepBody}>{about.stepFinale.body}</p>
            </div>

            <div className={styles.aboutFinalePanel}>
              <div className={styles.aboutFinaleBg} aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={about.stepFinale.image} alt="" />
              </div>
              <div className={styles.aboutFinaleContent}>
                <p className={styles.aboutFinaleStatement}>
                  {about.stepFinale.statement}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.blogSection} id="reviews">
        <h2 className={styles.headingLgDark}>Отзывы</h2>
        <div
          className={styles.reviewsCarousel}
          style={{ "--reviews-visible": reviewsVisible } as CSSProperties}
        >
          <button
            type="button"
            className={styles.reviewsNav}
            aria-label="Предыдущий отзыв"
            onClick={() => shiftReview(-1)}
            disabled={reviewBusy}
          >
            ‹
          </button>

          <div className={styles.reviewsViewport} ref={reviewsViewportRef}>
            <div
              className={[
                styles.reviewsTrack,
                reviewTransition ? "" : styles.reviewsTrackInstant,
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ transform: `translateX(-${reviewIndex * reviewStep}px)` }}
              onTransitionEnd={onReviewTransitionEnd}
            >
              {paddedReviews.map((post, index) => (
                <article
                  key={`${post.id}-${index}`}
                  className={styles.reviewsSlide}
                >
                  <div className={styles.blogCard}>
                    <p className={styles.blogContext}>{post.context}</p>
                    <blockquote className={styles.blogQuote}>
                      «{post.quote}»
                    </blockquote>
                    <p className={styles.blogAuthor}>
                      {post.name}, {post.role}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={styles.reviewsNav}
            aria-label="Следующий отзыв"
            onClick={() => shiftReview(1)}
            disabled={reviewBusy}
          >
            ›
          </button>
        </div>
        <a className={styles.viewAll} href="#start">
          Начать собирать воспоминания
        </a>
      </section>

      <section className={styles.productsSection} id="artifacts">
        <h2 className={styles.headingLg}>Выберите формат</h2>

        <div className={styles.productCarousel}>
          <button
            type="button"
            className={styles.productNav}
            aria-label="Предыдущий формат"
            onClick={() => shiftArtifact(-1)}
            disabled={carouselBusy}
          >
            ‹
          </button>

          <div className={styles.productOrbit}>
            {artifacts.map((item, index) => {
              const slot = getArtifactSlot(index);
              const isCenter = slot === "center";
              const isWrapping = wrappingIndex === index;

              return (
                <article
                  key={item.id}
                  className={[
                    styles.productOrbitItem,
                    slot === "left"
                      ? styles.slotLeft
                      : slot === "right"
                        ? styles.slotRight
                        : styles.slotCenter,
                    isWrapping && carouselDir === 1 ? styles.wrapNext : "",
                    isWrapping && carouselDir === -1 ? styles.wrapPrev : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (!isCenter) goArtifact(index);
                  }}
                >
                  <div
                    className={
                      isCenter ? styles.productCard : styles.productMini
                    }
                  >
                    <div
                      className={
                        isCenter
                          ? styles.productImage
                          : styles.productMiniImage
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" />
                    </div>
                    {isCenter ? (
                      <div className={styles.productCopy}>
                        <h3>{item.title}</h3>
                        <p className={styles.productShort}>
                          {item.audienceHint}
                        </p>
                        <ul className={styles.productPoints}>
                          {item.points.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                        <p className={styles.productPrice}>{item.price}</p>
                        <a className={styles.productCreate} href={item.href}>
                          Создать
                        </a>
                      </div>
                    ) : (
                      <>
                        <h3 className={styles.productMiniTitle}>{item.title}</h3>
                        <p className={styles.productMiniPrice}>{item.price}</p>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className={styles.productNav}
            aria-label="Следующий формат"
            onClick={() => shiftArtifact(1)}
            disabled={carouselBusy}
          >
            ›
          </button>
        </div>
      </section>

      <section className={styles.faqSection} id="faq">
        <p className={styles.eyebrowDark}>FAQ</p>
        <h2 className={styles.headingLgDark}>Частые вопросы</h2>
        <div className={styles.faqList}>
          {faqItems.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <article
                key={item.q}
                className={isOpen ? styles.faqItemOpen : styles.faqItem}
              >
                <button
                  type="button"
                  className={styles.faqTrigger}
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenFaq((current) => (current === index ? null : index))
                  }
                >
                  <h3>{item.q}</h3>
                  <span className={styles.faqIcon} aria-hidden>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                <div
                  className={styles.faqAnswer}
                  data-open={isOpen ? "true" : "false"}
                >
                  <p>{item.a}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.appBanner}>
        <h2 className={styles.headingLg}>{finalCta.title}</h2>
        <p className={styles.appBannerLead}>{finalCta.body}</p>
        <a className={styles.primaryBtn} href="/auth/organizer">
          {finalCta.button}
        </a>
      </section>

      <footer className={styles.footer} id="sign-up">
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <span className={styles.logoText}>{brand.name}</span>
            <nav className={styles.footerNav}>
              <a href="#about">О проекте</a>
              <a href="#how">Как это работает</a>
              <a href="#artifacts">Форматы</a>
              <a href="#reviews">Отзывы</a>
              <a href="#faq">Вопросы</a>
            </nav>
          </div>
          <div className={styles.footerContact}>
            <blockquote className={styles.footerQuote}>
              {finalCta.footerQuote.map((line) => (
                <span key={line} className={styles.footerQuoteLine}>
                  {line}
                </span>
              ))}
              <footer className={styles.footerQuoteAuthor}>
                {finalCta.footerAuthor}
              </footer>
            </blockquote>
            <p className={styles.bodyCopyMuted}>{finalCta.body}</p>
          </div>
        </div>

        <div className={styles.signup}>
          <p className={styles.signupLead}>
            Оставьте контакты — пришлем ссылку для сбора воспоминаний
          </p>
          <div className={styles.formTabs}>
            <button
              type="button"
              className={audience === "loved" ? styles.tabActive : styles.tab}
              onClick={() => pickAudience("loved")}
            >
              Близкому
            </button>
            <button
              type="button"
              className={
                audience === "colleague" ? styles.tabActive : styles.tab
              }
              onClick={() => pickAudience("colleague")}
            >
              Коллеге
            </button>
          </div>

          {submitted ? (
            <p className={styles.formSuccess}>Спасибо! Мы скоро напишем вам</p>
          ) : (
            <form className={styles.form} onSubmit={onSubmit}>
              <label>
                Имя*
                <input name="name" required placeholder="Ваше имя" />
              </label>
              <label>
                Email*
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@email.com"
                />
              </label>
              <button type="submit" className={styles.primaryBtn}>
                Отправить
              </button>
            </form>
          )}
        </div>

        <div className={styles.footerBottom}>
          <p>
            © {new Date().getFullYear()} {brand.name}
          </p>
        </div>
      </footer>
    </div>
  );
}
