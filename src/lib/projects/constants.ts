export const PROMO_CODE_BUILDER = "BUILDER";

export function projectStatusLabel(status: string) {
  if (status === "in_progress") return "В работе";
  if (status === "collecting") return "Сбор активен";
  if (status === "active") return "Сбор активен";
  return status;
}
