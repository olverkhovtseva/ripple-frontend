import styles from "./Appendix2.module.css";

function CaLogo() {
  return (
    <svg
      className={styles.logo}
      viewBox="0 0 86 50"
      role="img"
      aria-label="Crédit Agricole"
    >
      <path
        fill="#006A4E"
        d="M23.2 3.2c-10.8 0-19.5 8.4-19.5 18.8S12.4 40.8 23.2 40.8c5.4 0 10.3-2.2 13.8-5.8l-4.2-4.1c-2.4 2.4-5.7 3.9-9.6 3.9-7.2 0-12.8-5.5-12.8-12.6S16 9.6 23.2 9.6c3.9 0 7.3 1.6 9.6 4.1l4.2-4.1C33.5 5.5 28.6 3.2 23.2 3.2z"
      />
      <path
        fill="#006A4E"
        d="M45.4 5.2 60.6 40h-7.4l-2.3-5.4H42.3L40 40h-7.3L48.1 5.2h-2.7zm.4 21.2L43 18.4l-2.8 8h5.6z"
      />
      <path
        fill="#00A3E0"
        d="M61.5 40.2c12.2-2.8 21.2-13.6 21.2-26.2 0-4.2-1-8.1-2.7-11.5 6.2 4.6 9 12.4 6.4 21.8-2.8 10.4-11.8 18.2-24.9 19.2v-3.3z"
      />
      <path fill="#E30613" d="M72.6 1.6 83.4 10l-3.1 2.4-10.8-8.4z" />
      <rect x="4" y="43.4" width="76" height="4.4" rx="0.4" fill="#006A4E" />
    </svg>
  );
}

function Box({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className={styles.box}>
      <strong>{title}</strong>
      {sub ? <span>{sub}</span> : null}
    </div>
  );
}

function Op({ children }: { children: string }) {
  return <span className={styles.op}>{children}</span>;
}

function Slot() {
  return <span className={styles.slot} />;
}

export default function Appendix2() {
  return (
    <div className={`${styles.root} appendixRoot`}>
      <article className={styles.sheet}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <CaLogo />
            <p className={styles.appendix}>Appendix 2</p>
            <span className={styles.headerLine} />
          </div>
          <h1 className={styles.title}>
            Current bonus scheme for Financial Advisors and Senior Financial
            Advisors
          </h1>
        </header>

        <section className={styles.flow} aria-label="Bonus calculation">
          <div className={styles.labelCol}>
            <span />
            <p className={styles.qLabel}>Q1, Q2, Q3</p>
            <p className={styles.qLabel}>Q4 (year)</p>
          </div>

          <div className={styles.flowMain}>
            <div className={styles.grid}>
              <Slot />
              <Slot />
              <Slot />
              <Slot />
              <Slot />
              <Slot />
              <Slot />
              <Slot />
              <Slot />
              <Slot />
              <Slot />
              <Slot />
              <aside className={styles.pool}>
                <p className={styles.poolLabel}>CABP Manager Pool</p>
                <div className={styles.poolBubble}>
                  SIP CABP Pool — actual payouts for the year
                </div>
              </aside>
            </div>

            <div className={styles.row}>
              <Box title="Profit" sub="(actual cumulative value, EUR)" />
              <Op>×</Op>
              <Box title="ScoreCard" sub="value from 0% to 2.69%" />
              <Op>−</Op>
              <Box title="Bonuses for" sub="previous quarters" />
              <Slot />
              <Slot />
              <Op>×</Op>
              <Box title="Metric" sub="value from 0.35 to 1" />
              <Op>×</Op>
              <Box title="H" sub="value from 0 to 1" />
              <Slot />
              <Slot />
            </div>

            <div className={styles.row}>
              <Box title="Profit" sub="(actual value for the year, EUR)" />
              <Op>×</Op>
              <Box title="ScoreCard" sub="value from 0% to 2.69%" />
              <Op>−</Op>
              <Box title="Bonuses for" sub="Q1, Q2, Q3" />
              <Op>+</Op>
              <Box title="Deferred portions" sub="of bonuses for Q1, Q2, Q3" />
              <Op>×</Op>
              <Box title="Metric" sub="value from 0.35 to 1" />
              <Op>×</Op>
              <Box title="H" sub="value from 0 to 1" />
              <Op>+</Op>
              <Box title="Additional bonus" sub="from the CABP Manager Pool" />
            </div>

            <div className={styles.defs}>
              <Slot />
              <Slot />
              <div className={styles.formulaCard}>
                <p>
                  <strong>ScoreCard</strong> = (2.09% + Credit KPI) × Operating
                  Profit KPI
                </p>
              </div>
              <Slot />
              <div className={styles.formulaCard}>
                <p>
                  = Σ (Operating Profit × ScoreCard)<sub>i−1</sub>
                </p>
              </div>
              <Slot />
              <div className={styles.formulaCard}>
                <p>
                  = Σ (Operating Profit × ScoreCard × Metric × deferred %)
                  <sub>i−1</sub>
                </p>
              </div>
              <Slot />
              <div className={styles.formulaCard}>
                <p>
                  <strong>Metric</strong> = 1 + KYC + NBP + Risk Profile + CC
                </p>
              </div>
              <Slot />
              <p className={styles.defText}>
                Determined by the CABP Manager depending on the quality of
                execution of established plans and compliance with the KPI
                performance conditions by the Participant.
              </p>
              <Slot />
              <p className={styles.defText}>
                Based on the reporting-year results, the CABP Manager assesses
                the quality of each employee’s achieved result, including the
                CABP scale.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.bottom}>
          <div className={styles.kpiCol}>
            <div className={styles.kpiPair}>
              <KpiTable
                title="Credit KPI"
                rows={[
                  ["< 100%", "0.000%"],
                  ["≥ 100%; < 130%", "0.075%"],
                  ["≥ 130%; < 150%", "0.110%"],
                  ["≥ 150%", "0.150%"],
                ]}
              />
              <KpiTable
                title="Operating Profit KPI"
                rows={[
                  ["≤ 85%", "0"],
                  ["> 85%; < 100%", "0.8"],
                  ["≥ 100%; < 110%", "1.0"],
                  ["≥ 110%", "1.2"],
                ]}
              />
            </div>

            <div className={styles.notes}>
              <span className={styles.bang} aria-hidden>
                !
              </span>
              <ul>
                <li>
                  For Q1, Q2 and Q3, 80%, 70% and 50% of the bonus respectively
                  (before applying Metric and H) is deferred.
                </li>
                <li>
                  The deferred portion is paid at year-end (together with the Q4
                  bonus), provided the annual Operating Profit target is
                  achieved at &gt; 85%.
                </li>
              </ul>
            </div>
          </div>

          <table className={styles.metricTable}>
            <thead>
              <tr>
                <th rowSpan={2} className={styles.thName}>
                  Name
                </th>
                <th rowSpan={2} className={styles.thDesc}>
                  Description
                </th>
                <th colSpan={2}>Scale</th>
              </tr>
              <tr>
                <th>% PBP</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <MetricRow
                name="KYC – Know Your Customer"
                description="Goal: all questionnaires completed for new clients, including family details, assets, other banks and hobbies/interests."
                hi="≥ 100%"
                hiVal="0.00"
                lo="< 100%"
                loVal="−0.20"
              />
              <MetricRow
                name="NBP – New Banque Privée clients"
                description="Achievement of the plan for the number of new Banque Privée clients onboarded during the reporting period."
                hi="≥ 100%"
                hiVal="0.00"
                lo="< 100%"
                loVal="−0.20"
              />
              <MetricRow
                name="Risk Profile"
                description="Target: 100% of clients with investments and 100% of clients investing with CA Banque Privée for the first time are profiled."
                hi="≥ 100%"
                hiVal="0.00"
                lo="< 100%"
                loVal="−0.20"
              />
              <MetricRow
                name="CC – Compliance coefficient"
                description="Determined by the CABP Manager based on the following indicators: presence (%) of errors and breaches of internal regulations in operational activities, EQA results, compliance with discipline, etc."
                hi="max"
                hiVal="0.00"
                lo="min"
                loVal="−0.05"
                hiKind="max"
              />
            </tbody>
          </table>
        </section>
      </article>
    </div>
  );
}

function KpiTable({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className={styles.kpiBlock}>
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>PBP %</th>
            <th>KPI value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([range, value]) => (
            <tr key={range}>
              <td>{range}</td>
              <td className={styles.kpiVal}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricRow({
  name,
  description,
  hi,
  hiVal,
  lo,
  loVal,
  hiKind = "pos",
}: {
  name: string;
  description: string;
  hi: string;
  hiVal: string;
  lo: string;
  loVal: string;
  hiKind?: "pos" | "max";
}) {
  return (
    <>
      <tr>
        <td rowSpan={2} className={styles.metricName}>
          {name}
        </td>
        <td rowSpan={2} className={styles.metricDesc}>
          {description}
        </td>
        <td className={hiKind === "max" ? styles.max : styles.pos}>{hi}</td>
        <td className={hiKind === "max" ? styles.max : styles.pos}>{hiVal}</td>
      </tr>
      <tr>
        <td className={styles.neg}>{lo}</td>
        <td className={styles.neg}>{loVal}</td>
      </tr>
    </>
  );
}
