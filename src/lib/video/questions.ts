import { russianNameCases } from "@/lib/cabinet/questions";

export type VideoScenarioPrompt = {
  id: string;
  label: string;
  question: string;
  hint: string;
};

/** Сценарий видео-поздравления: вопрос + подсказка для участника.
 *  Плейсхолдеры: [Имя] (им.), [Имя:род], [Имя:дат], [Имя:тв], [Имя:пр].
 */
export const VIDEO_SCENARIO_PROMPTS: VideoScenarioPrompt[] = [
  {
    id: "first-impression",
    label: "Первое впечатление",
    question:
      "Расскажите, какое самое яркое впечатление оставил наш герой после вашего первого знакомства?",
    hint: "Вспомните тот самый день или минуту: где вы были, во что был(а) одет(а) [Имя], что сказал(а)?. Подумайте, совпало ли то первое впечатление с тем, каким человек оказался на самом деле, или он(а) вас абсолютно удивил(а)?",
  },
  {
    id: "memorable-story",
    label: "Запоминающаяся история",
    question:
      "Расскажите, какая совместная история с [Имя:тв] была самой яркой, веселой или необычной?",
    hint: "Не обязательно вспоминать грандиозное путешествие — подойдет даже случайный забавный случай из повседневной жизни, спонтанная поездка, уличная история или курьез, о котором вы до сих пор вспоминаете с улыбкой",
  },
  {
    id: "habits",
    label: "Забавные привычки и «фишки»",
    question:
      "Расскажите о какой-нибудь милой, смешной или характерной привычке [Имя:род], которая известна только близким?",
    hint: "Может, [Имя] особым образом заваривает чай, смешно реагирует на фейлы, постоянно произносит любимое словечко или отчаянно защищает свои любимые сладости?. Поделитесь этой доброй деталью",
  },
  {
    id: "valuable-lesson",
    label: "Ценный урок или совет",
    question:
      "Расскажите, какой самый ценный урок, совет или поддержку вам дал(а) [Имя]?",
    hint: "Вспомните момент, когда вам было непросто, и [Имя] оказался(ась) рядом. Это может быть как серьезный разговор по душам, так и одна короткая фраза, которая вовремя подбодрила и всё изменила",
  },
  {
    id: "three-words",
    label: "Три слова-ассоциации",
    question:
      "Расскажите, с какими 3 словами или образами у вас ассоциируется [Имя] и почему?",
    hint: "Назовите три слова. Это могут быть качества, явления природы, суперсила или даже уютная ассоциация (например: «солнце, плейлист для дороги, утренний кофе») Коротко поясните, почему именно они!",
  },
  {
    id: "pride",
    label: "Момент гордости",
    question:
      "Расскажите о моменте, когда вы почувствовали настоящую гордость за то, что [Имя] есть в вашей жизни?",
    hint: "Вспомните момент триумфа [Имя], смелый шаг, проявление доброты или личную победу, когда вы смотрели на него/нее и думали: «Какое счастье, что мы знакомы, это невероятный человек!»",
  },
  {
    id: "strengths",
    label: "Сильные качества",
    question:
      "Расскажите, какие качества характера вас больше всего вдохновляют и впечатляют в [Имя:пр]?",
    hint: "Чему у [Имя:дат] стоит поучиться каждому из нас?. Это может быть редкая чуткость, умение сохранять спокойствие в хаосе, юмор, безупречный вкус или умение объединять людей",
  },
  {
    id: "influence",
    label: "Влияние на вашу жизнь",
    question:
      "Расскажите, что изменилось в вашей жизни или в вас самих после знакомства с [Имя:тв]?",
    hint: "Подумайте, какой след [Имя] оставляет в судьбах людей. Набрались ли вы благодаря ему/ей смелости, полюбили ли новое хобби, стали ли проще относиться к жизни?",
  },
  {
    id: "small-joys",
    label: "Маленькие радости и уют",
    question:
      "Расскажите о какой-нибудь уютной мелочи или традиции, связанной с [Имя:тв], которую вы очень цените?",
    hint: "Совместные созвоны, привычка делиться мемами, прогулки после работы или традиции на праздники. Какое маленькое действие с [Имя:тв] всегда поднимает вам настроение?",
  },
  {
    id: "gratitude",
    label: "Искренняя благодарность",
    question: "Расскажите, за что вы больше всего благодарны [Имя:дат]?",
    hint: "Не бойтесь казаться сентиментальными. Скажите спасибо за то, что сложно измерить: за дружбу, за чувство безопасности, за то, что с [Имя:тв] можно быть собой и не притворяться",
  },
  {
    id: "dream",
    label: "Мечта и напутствие",
    question:
      "Расскажите, какое самое смелое приключение или мечту вы желаете воплотить [Имя:дат] в будущем?",
    hint: "Поделитесь пожеланием без банальностей. Вспомните, о чем мечтал(а) [Имя] — съездить в определенную страну, запустить проект, научиться чему-то новым?. Пожелайте именно этого от чистого сердца!",
  },
];

/** @deprecated use VIDEO_SCENARIO_PROMPTS */
export const VIDEO_QUESTION_TEMPLATES = VIDEO_SCENARIO_PROMPTS.map(
  (p) => p.question,
);

export function fillVideoQuestion(template: string, heroName: string): string {
  const raw = heroName.trim();
  if (!raw || raw === "[Имя]") {
    return template
      .replaceAll("[Имя:дат]", "[Имя]")
      .replaceAll("[Имя:род]", "[Имя]")
      .replaceAll("[Имя:тв]", "[Имя]")
      .replaceAll("[Имя:пр]", "[Имя]");
  }
  const cases = russianNameCases(raw);

  return template
    .replaceAll("[Имя:дат]", cases.dat)
    .replaceAll("[Имя:род]", cases.gen)
    .replaceAll("[Имя:тв]", cases.ins)
    .replaceAll("[Имя:пр]", cases.pre)
    .replaceAll("[Имя]", cases.nom)
    .replaceAll("[имя героя]", cases.nom);
}

export function fillVideoPrompt(
  prompt: Pick<VideoScenarioPrompt, "question" | "hint">,
  heroName: string,
) {
  return {
    question: fillVideoQuestion(prompt.question, heroName),
    hint: fillVideoQuestion(prompt.hint, heroName),
  };
}

export function createShareSlug(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function formatDeadlineRu(deadline: Date): string {
  return deadline.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function todayDateInputValue(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD не раньше сегодняшнего локального дня. */
export function isDeadlineNotBeforeToday(deadline: string, now = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadline.trim());
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const selected = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return selected.getTime() >= today.getTime();
}
