export type Audience = "loved" | "colleague";

export type ProjectStatus = "draft" | "ready" | "collecting";

export type ArtifactType = "presentation" | "book" | "video";

export type ProjectQuestion = {
  id: string;
  text: string;
  hint?: string;
};

export type Answer = {
  questionId: string;
  text: string;
  savedAt: string;
};

export type Participant = {
  id: string;
  name: string;
  answers: Answer[];
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  token: string;
  organizerSecret: string;
  artifactType: ArtifactType;
  heroName: string;
  projectTitle: string;
  deadline: string; // YYYY-MM-DD
  audience: Audience;
  questions: ProjectQuestion[];
  inviteMessage: string;
  status: ProjectStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
};

export type PublicProject = {
  id: string;
  token: string;
  heroName: string;
  projectTitle: string;
  deadline: string;
  daysLeft: number;
  inviteMessage: string;
  questions: ProjectQuestion[];
  status: ProjectStatus;
  artifactType: ArtifactType;
};

export type OrganizerProjectView = PublicProject & {
  organizerSecret: string;
  audience: Audience;
  participants: Array<{
    id: string;
    name: string;
    answeredCount: number;
    totalQuestions: number;
    updatedAt: string;
  }>;
  responseCount: number;
};
