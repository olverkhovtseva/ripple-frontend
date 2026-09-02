import type { ArtifactType, Audience } from "./types";

const DRAFT_KEY = "prive-create-draft";

export type BookCreateDraft = {
  kind: "book";
  artifactType: Extract<ArtifactType, "presentation" | "book">;
  heroName: string;
  projectTitle: string;
  deadline: string;
  audience: Audience;
  questionIndexes: number[];
};

export type VideoCreateDraft = {
  kind: "video";
  title: string;
  heroName: string;
  deadline: string;
  videoFormat: "vertical" | "horizontal";
  selected: number[];
  customQuestion: string;
  customHint: string;
};

export type CreateDraft = BookCreateDraft | VideoCreateDraft;

export function saveCreateDraft(draft: CreateDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function readCreateDraft(): CreateDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CreateDraft;
  } catch {
    return null;
  }
}

export function clearCreateDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

export function resumeNextPath(pathname: string) {
  return `${pathname}?resume=1`;
}

export function draftDisplayTitle(draft: CreateDraft): string {
  if (draft.kind === "video") {
    return draft.title.trim() || `Фильм для ${draft.heroName.trim() || "Героя"}`;
  }
  return (
    draft.projectTitle.trim() ||
    `Книга ${draft.heroName.trim() || "Героя"}`
  );
}
