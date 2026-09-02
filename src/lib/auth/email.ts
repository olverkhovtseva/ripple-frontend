function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type MagicLinkEmailContext = "welcome" | "signin";

export async function sendMagicLinkEmail(input: {
  to: string;
  firstName: string;
  url: string;
  context?: MagicLinkEmailContext;
  role?: "organizer" | "participant";
}) {
  const context = input.context ?? "signin";
  const isParticipant = input.role === "participant";
  const subject = isParticipant
    ? "Вход в проект Prive Stories"
    : context === "welcome"
      ? "Добро пожаловать в Prive Stories — ваш проект ждёт"
      : "Вход в кабинет Prive Stories";

  const lead = isParticipant
    ? "Нажмите кнопку ниже, чтобы войти и передать свои ответы в проекте."
    : context === "welcome"
      ? "Нажмите кнопку ниже — вы сразу попадёте в кабинет организатора. Если вы собирали сценарий, проект будет создан автоматически."
      : "Нажмите кнопку ниже, чтобы войти в кабинет организатора Prive Stories.";

  const buttonLabel = isParticipant ? "Присоединиться к проекту" : "Войти в кабинет";

  const html = `
    <div style="font-family:Georgia,'Times New Roman',serif;background:#27161e;color:#f5f5f3;padding:40px 32px;line-height:1.55">
      <p style="letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#e5c158;margin:0 0 20px;font-weight:700">Prive Stories</p>
      <h1 style="font-family:Arial,sans-serif;font-size:26px;font-weight:700;margin:0 0 14px;line-height:1.25;color:#f5f5f3">
        ${context === "welcome" ? "Добро пожаловать" : "Здравствуйте"}, ${escapeHtml(input.firstName)}!
      </h1>
      <p style="margin:0 0 28px;font-size:16px;color:rgba(245,245,243,.88)">${lead}</p>
      <p style="margin:0 0 32px">
        <a href="${escapeHtml(input.url)}" style="display:inline-block;background:linear-gradient(135deg,#e8d078,#c9a227);color:#27161e;text-decoration:none;padding:14px 28px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border-radius:2px">
          ${buttonLabel}
        </a>
      </p>
      <p style="font-size:13px;color:rgba(245,245,243,.55);margin:0 0 8px">
        Или скопируйте ссылку в браузер:
      </p>
      <p style="font-size:12px;color:rgba(245,245,243,.45);margin:0 0 28px;word-break:break-all">
        ${escapeHtml(input.url)}
      </p>
      <hr style="border:0;border-top:1px solid rgba(229,193,88,.22);margin:0 0 20px" />
      <p style="font-size:12px;color:rgba(245,245,243,.45);margin:0">
        Ссылка одноразовая и действует 24 часа.
        Если вы не создавали проект в Prive Stories — просто закройте письмо.
      </p>
    </div>
  `;

  const text = `${context === "welcome" ? "Добро пожаловать" : "Здравствуйте"}, ${input.firstName}!

${lead}

Войти в кабинет: ${input.url}

Ссылка одноразовая и действует 24 часа.`;

  const key = process.env.RESEND_API_KEY;
  const from =
    process.env.AUTH_FROM_EMAIL || "Prive Stories <hello@privestories.ru>";

  if (key) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [input.to], subject, html, text }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Не удалось отправить письмо: ${detail.slice(0, 180)}`);
    }
    return { sent: true as const };
  }

  console.info(`[magic-link] ${input.to}\n${input.url}`);
  return { sent: false as const };
}

export async function sendOrganizerMilestoneEmail(input: {
  to: string;
  firstName: string;
  projectTitle: string;
  responseCount: number;
}) {
  const subject = `Prive Stories: ${input.responseCount} участников уже ответили`;
  const html = `
    <div style="font-family:Georgia,'Times New Roman',serif;background:#27161e;color:#f5f5f3;padding:40px 32px;line-height:1.55">
      <p style="letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#e5c158;margin:0 0 20px;font-weight:700">Prive Stories</p>
      <h1 style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;margin:0 0 14px;color:#f5f5f3">
        Здравствуйте${input.firstName ? `, ${escapeHtml(input.firstName)}` : ""}!
      </h1>
      <p style="margin:0 0 20px;font-size:16px;color:rgba(245,245,243,.88)">
        В проекте «${escapeHtml(input.projectTitle)}» уже <strong>${input.responseCount}</strong>
        ${input.responseCount === 1 ? "участник отправил" : "участников отправили"} ответы.
        Загляните в кабинет организатора, чтобы посмотреть прогресс.
      </p>
    </div>
  `;
  const text = `В проекте «${input.projectTitle}» уже ${input.responseCount} ответов от участников.`;

  const key = process.env.RESEND_API_KEY;
  const from =
    process.env.AUTH_FROM_EMAIL || "Prive Stories <hello@privestories.ru>";

  if (key) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [input.to], subject, html, text }),
    });
    return { sent: true as const };
  }

  console.info(`[milestone] ${input.to} — ${input.responseCount} ответов`);
  return { sent: false as const };
}
