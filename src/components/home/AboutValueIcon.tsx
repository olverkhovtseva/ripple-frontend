import styles from "./AboutValueIcon.module.css";

type AboutValueIconName =
  | "clock"
  | "gift"
  | "script"
  | "heart"
  | "shield"
  | "archive"
  | "feather"
  | "spark"
  | "link";

type AboutValueIconProps = {
  name: AboutValueIconName;
  featured?: boolean;
};

const common = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.15,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export default function AboutValueIcon({ name, featured }: AboutValueIconProps) {
  return (
    <span
      className={featured ? `${styles.iconWrap} ${styles.iconFeatured}` : styles.iconWrap}
    >
      {name === "clock" && (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.25" />
          <path d="M12 7.75V12l2.65 1.65" />
        </svg>
      )}
      {name === "gift" && (
        <svg {...common}>
          <rect x="4.5" y="10.25" width="15" height="8.75" rx="1" />
          <path d="M4.5 13.75h15M12 10.25v8.75" />
          <path d="M12 10.25c-1.65-2.35-4.35-2.55-5.2-1.25-.65 1-.05 2.85 5.2 1.25Zm0 0c1.65-2.35 4.35-2.55 5.2-1.25.65 1 .05 2.85-5.2 1.25Z" />
        </svg>
      )}
      {name === "script" && (
        <svg {...common}>
          <path d="M7.5 5.75h7.35c1.65 0 3 1.3 3 2.95v9.05c0 .75-.85 1.15-1.4.65l-1.35-1.1H7.5a2.35 2.35 0 0 1-2.35-2.35V8.1a2.35 2.35 0 0 1 2.35-2.35Z" />
          <path d="M9.25 10.25h6.5M9.25 13.25h5" />
        </svg>
      )}
      {name === "heart" && (
        <svg {...common}>
          <path d="M12 19.1s-6.45-3.95-8.15-7.2C2.35 9.35 3.5 6.65 6.15 6.35c1.55-.2 3 .55 3.85 1.85.85-1.3 2.3-2.05 3.85-1.85 2.65.3 3.8 3 2.3 5.55-1.7 3.25-8.15 7.2-8.15 7.2Z" />
        </svg>
      )}
      {name === "shield" && (
        <svg {...common}>
          <path d="M12 4.65 18.25 7v4.15c0 3.85-2.55 7-6.25 8.1-3.7-1.1-6.25-4.25-6.25-8.1V7L12 4.65Z" />
          <path d="M12 11.1v3.15M12 9.15h.01" />
        </svg>
      )}
      {name === "archive" && (
        <svg {...common}>
          <rect x="4.75" y="5.25" width="14.5" height="3" rx="0.75" />
          <path d="M6.25 8.25V18a1.15 1.15 0 0 0 1.15 1.15h9.2A1.15 1.15 0 0 0 17.75 18V8.25M9.75 12.35h4.5" />
        </svg>
      )}
      {name === "feather" && (
        <svg {...common}>
          <path d="M19.05 4.95c-3.55-.15-7.85 2-10.35 5.85L5.15 16.65l5.35-2.9c3.9-2.5 6.05-6.85 5.85-10.35Z" />
          <path d="M5.15 16.65 4.25 19.75l3.1-.9M9.35 12.55l4.15-4.15" />
        </svg>
      )}
      {name === "spark" && (
        <svg {...common}>
          <path d="M12 4.75v2.85M12 16.4v2.85M4.75 12h2.85M16.4 12h2.85M7.35 7.35l2 2M14.65 14.65l2 2M16.65 7.35l-2 2M9.35 14.65l-2 2" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      )}
      {name === "link" && (
        <svg {...common}>
          <path d="M9.65 14.35 14.35 9.65M10.35 8.45l1.3-1.3a2.95 2.95 0 0 1 4.15 4.15l-1.3 1.3M13.65 15.55l-1.3 1.3a2.95 2.95 0 1 1-4.15-4.15l1.3-1.3" />
        </svg>
      )}
    </span>
  );
}
