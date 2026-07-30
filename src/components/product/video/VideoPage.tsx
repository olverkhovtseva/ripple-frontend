"use client";

import Link from "next/link";
import { useState } from "react";
import { brand } from "@/components/home/data";
import styles from "../presentation/PresentationPage.module.css";
import { videoProduct as p } from "./data";
import videoStyles from "./VideoPage.module.css";

export default function VideoPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/#artifacts" className={styles.back}>
          ← К артефактам
        </Link>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoBlack} alt={brand.name} />
        </Link>
        <div className={styles.headerProfile}>
          <a className={styles.headerCta} href="/create/video">
            Заказать
          </a>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{p.eyebrow}</p>
          <h1 className={styles.title}>{p.title}</h1>
          <p className={styles.subtitle}>{p.subtitle}</p>
          <a className={styles.primaryCta} href="/create/video">
            {p.cta}
          </a>
          <p className={styles.ctaNote}>{p.ctaNote}</p>
        </div>

        <div className={styles.heroVisual} aria-hidden>
          <div className={videoStyles.playerScene}>
            <div className={videoStyles.glow} />
            <div className={videoStyles.player}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.heroImage} alt="" className={videoStyles.cover} />
              <div className={videoStyles.playBtn}>
                <span className={videoStyles.playTriangle} />
              </div>
              <div className={videoStyles.playerBar}>
                <span className={videoStyles.progress} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.accents}>
        {p.accents.map((item) => (
          <article key={item.id} className={styles.accent}>
            <p className={styles.accentLabel}>{item.label}</p>
            <h2 className={styles.accentTitle}>{item.title}</h2>
            <p className={styles.accentBody}>{item.body}</p>
          </article>
        ))}
      </section>

      <section className={styles.insides}>
        <p className={styles.eyebrowDark}>{p.insidesEyebrow}</p>
        <h2 className={styles.sectionTitle}>{p.insidesTitle}</h2>
        <div className={styles.insidesGrid}>
          {p.insides.map((item, index) => (
            <article key={item.title} className={styles.insideItem}>
              <span className={styles.insideNum} aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className={styles.insideTitle}>{item.title}</h3>
                <p className={styles.insideBody}>{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.formats}>
        <p className={styles.eyebrowGold}>{p.techEyebrow}</p>
        <h2 className={styles.sectionTitleLight}>{p.techTitle}</h2>
        <div className={`${styles.formatsGrid} ${videoStyles.techGrid}`}>
          {p.tech.map((item) => (
            <article key={item.title} className={styles.formatCard}>
              <p className={styles.formatTag}>{item.tag}</p>
              <h3 className={styles.formatTitle}>{item.title}</h3>
              <p className={styles.formatBody}>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.steps}>
        <p className={styles.eyebrowDark}>{p.stepsEyebrow}</p>
        <h2 className={styles.sectionTitle}>{p.stepsTitle}</h2>
        <ol className={styles.stepsList}>
          {p.steps.map((step) => (
            <li key={step.num} className={styles.step}>
              <span className={styles.stepNum}>{step.num}</span>
              <div className={styles.stepCopy}>
                <div className={styles.stepHead}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <span className={styles.stepTime}>{step.time}</span>
                </div>
                <p className={styles.stepBody}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.faq}>
        <p className={styles.eyebrowDark}>{p.faqEyebrow}</p>
        <h2 className={styles.sectionTitle}>{p.faqTitle}</h2>
        <div className={styles.faqList}>
          {p.faq.map((item, index) => {
            const open = openFaq === index;
            return (
              <article key={item.q} className={styles.faqItem}>
                <button
                  type="button"
                  className={styles.faqBtn}
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : index)}
                >
                  <span>{item.q}</span>
                  <span className={styles.faqToggle} aria-hidden>
                    {open ? "−" : "+"}
                  </span>
                </button>
                {open ? <p className={styles.faqAnswer}>{item.a}</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.order} id="order">
        <div className={styles.orderCard}>
          <h2 className={styles.orderTitle}>{p.order.title}</h2>
          <ul className={styles.orderIncludes}>
            {p.order.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className={videoStyles.tiers}>
            {p.order.tiers.map((tier) => (
              <div key={tier.label} className={videoStyles.tier}>
                <span className={videoStyles.tierLabel}>{tier.label}</span>
                <span className={videoStyles.tierPrice}>{tier.price}</span>
              </div>
            ))}
          </div>
          <a className={styles.orderCta} href="/create/video">
            {p.order.cta}
          </a>
          <p className={styles.orderNote}>{p.order.note}</p>
        </div>
      </section>
    </div>
  );
}
