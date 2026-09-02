/**
 * Базовый URL сайта для ссылок в письмах.
 * На проде задайте NEXT_PUBLIC_APP_URL=https://ваш-домен.ru
 */
export function appOrigin(request?: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (request) return new URL(request.url).origin;
  return "http://localhost:3000";
}

export function verifyUrl(
  token: string,
  nextPath: string,
  request?: Request,
) {
  const origin = appOrigin(request);
  const next = encodeURIComponent(nextPath);
  return `${origin}/auth/verify?token=${encodeURIComponent(token)}&next=${next}`;
}

export function cabinetVerifyUrl(token: string, request?: Request) {
  return verifyUrl(token, "/cabinet", request);
}
