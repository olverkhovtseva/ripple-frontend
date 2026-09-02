import type { OrganizerProjectView } from "./types";

export const ORGANIZER_STORAGE_KEY = "prive-organizer-projects";
export const ORGANIZER_USER_KEY = "prive-organizer-user-id";
export const ORGANIZER_PROFILE_KEY = "prive-organizer-profile";

export type StoredOrganizerProject = {
  id: string;
  secret: string;
  /** presentation = JSON cabinet; video = Prisma */
  kind?: "presentation" | "book" | "video";
};

export type OrganizerProfile = {
  organizerId: string;
  name: string;
  phone: string;
};

export function readOrganizerProjects(): StoredOrganizerProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORGANIZER_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as StoredOrganizerProject[];
    if (!Array.isArray(list)) return [];
    return list.filter((item) => item?.id && item?.secret);
  } catch {
    return [];
  }
}

function writeList(list: StoredOrganizerProject[]) {
  localStorage.setItem(ORGANIZER_STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
}

export function rememberOrganizerProject(project: OrganizerProjectView) {
  try {
    const list = readOrganizerProjects();
    const kind =
      project.artifactType === "video"
        ? "video"
        : project.artifactType === "book"
          ? "book"
          : "presentation";
    const next = [
      {
        id: project.id,
        secret: project.organizerSecret,
        kind: kind as "presentation" | "book" | "video",
      },
      ...list.filter((item) => item.id !== project.id),
    ];
    writeList(next);
  } catch {
    /* ignore */
  }
}

export function rememberOrganizerProfile(profile: OrganizerProfile) {
  try {
    localStorage.setItem(ORGANIZER_USER_KEY, profile.organizerId);
    localStorage.setItem(ORGANIZER_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function readOrganizerProfile(): OrganizerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ORGANIZER_PROFILE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw) as OrganizerProfile;
    if (!profile?.organizerId || !profile?.phone) return null;
    return profile;
  } catch {
    return null;
  }
}

export function rememberVideoProject(projectId: string, organizerId: string) {
  try {
    localStorage.setItem(ORGANIZER_USER_KEY, organizerId);
    const list = readOrganizerProjects();
    const next = [
      { id: projectId, secret: organizerId, kind: "video" as const },
      ...list.filter((item) => item.id !== projectId),
    ];
    writeList(next);
  } catch {
    /* ignore */
  }
}

export function readOrganizerUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ORGANIZER_USER_KEY);
  } catch {
    return null;
  }
}

export function hasOrganizerProjects(): boolean {
  return readOrganizerProjects().length > 0 || Boolean(readOrganizerUserId());
}

export function clearOrganizerLocal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ORGANIZER_STORAGE_KEY);
  localStorage.removeItem(ORGANIZER_USER_KEY);
  localStorage.removeItem(ORGANIZER_PROFILE_KEY);
  sessionStorage.removeItem("prive-dev-link");
}
