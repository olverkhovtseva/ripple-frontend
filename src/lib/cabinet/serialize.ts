import {
  daysUntil,
} from "./questions";
import type {
  OrganizerProjectView,
  Project,
  PublicProject,
} from "./types";

export function toPublicProject(project: Project): PublicProject {
  return {
    id: project.id,
    token: project.token,
    heroName: project.heroName,
    projectTitle: project.projectTitle,
    deadline: project.deadline,
    daysLeft: daysUntil(project.deadline),
    inviteMessage: project.inviteMessage,
    questions: project.questions,
    status: project.status,
    artifactType: project.artifactType,
  };
}

export function toOrganizerView(project: Project): OrganizerProjectView {
  const total = project.questions.length;
  return {
    ...toPublicProject(project),
    organizerSecret: project.organizerSecret,
    audience: project.audience,
    responseCount: project.participants.filter((p) => p.answers.length > 0)
      .length,
    participants: project.participants.map((p) => ({
      id: p.id,
      name: p.name,
      answeredCount: p.answers.length,
      totalQuestions: total,
      updatedAt: p.updatedAt,
    })),
  };
}

export function joinUrl(token: string, origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/join/${token}`;
}
