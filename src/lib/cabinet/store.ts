import { randomBytes, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { Participant, Project } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "projects.json");

type StoreShape = {
  projects: Project[];
};

async function ensureStore(): Promise<StoreShape> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    if (!Array.isArray(parsed.projects)) return { projects: [] };
    return parsed;
  } catch {
    const empty: StoreShape = { projects: [] };
    await fs.writeFile(STORE_PATH, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function createToken(): string {
  return randomBytes(9).toString("base64url");
}

export function createSecret(): string {
  return randomBytes(18).toString("base64url");
}

export async function listProjects(): Promise<Project[]> {
  const store = await ensureStore();
  return store.projects;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const store = await ensureStore();
  return store.projects.find((p) => p.id === id) ?? null;
}

export async function getProjectByToken(token: string): Promise<Project | null> {
  const store = await ensureStore();
  return store.projects.find((p) => p.token === token) ?? null;
}

export async function saveProject(project: Project): Promise<Project> {
  const store = await ensureStore();
  const index = store.projects.findIndex((p) => p.id === project.id);
  if (index >= 0) store.projects[index] = project;
  else store.projects.push(project);
  await writeStore(store);
  return project;
}

export async function createProject(
  input: Omit<
    Project,
    | "id"
    | "token"
    | "organizerSecret"
    | "participants"
    | "createdAt"
    | "updatedAt"
    | "status"
  > & { status?: Project["status"] },
): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    ...input,
    id: randomUUID(),
    token: createToken(),
    organizerSecret: createSecret(),
    status: input.status ?? "draft",
    participants: [],
    createdAt: now,
    updatedAt: now,
  };
  await saveProject(project);
  return project;
}

export async function upsertParticipant(
  projectId: string,
  participant: Participant,
): Promise<Project | null> {
  const project = await getProjectById(projectId);
  if (!project) return null;
  const index = project.participants.findIndex((p) => p.id === participant.id);
  if (index >= 0) project.participants[index] = participant;
  else project.participants.push(participant);
  project.updatedAt = new Date().toISOString();
  await saveProject(project);
  return project;
}

export function assertOrganizer(project: Project, secret: string | null): boolean {
  return Boolean(secret && secret === project.organizerSecret);
}
