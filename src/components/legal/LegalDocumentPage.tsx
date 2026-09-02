import Link from "next/link";
import { brand } from "@/components/home/data";
import { legalMeta } from "@/lib/legal/meta";
import styles from "./Legal.module.css";

type Section = {
  title: string;
  paragraphs: string[];
  list?: string[];
};

type Props = {
  eyebrow: string;
  title: string;
  lead: string;
  sections: Section[];
};

export default function LegalDocumentPage({
  eyebrow,
  title,
  lead,
  sections,
}: Props) {
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
      </header>

      <main className={styles.main}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.lead}>{lead}</p>
        <p className={styles.updated}>
          Редакция от {legalMeta.updatedAt}. {legalMeta.serviceName}
        </p>

        {sections.map((section) => (
          <section key={section.title} className={styles.section}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
            {section.list ? (
              <ul>
                {section.list.map((item) => (
                  <li key={item.slice(0, 48)}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <nav className={styles.footerNav}>
          <Link href="/legal/terms">Пользовательское соглашение</Link>
          <Link href="/legal/privacy">Политика обработки персональных данных</Link>
        </nav>
      </main>
    </div>
  );
}
