const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name: string) =>
    request<{ accessToken: string; refreshToken: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  refresh: (refreshToken: string) =>
    request<{ accessToken: string }>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};

// Meetings
export interface Meeting {
  id: string;
  title: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  hostUserId: number;
  hostUserEmail: string;
  startedAt: string;
  endedAt?: string;
  participantCount: number;
}

export interface MeetingMinutes {
  summary: string;
  decisions: string[];
  todos: { text: string; assignee: string }[];
  questions: string[];
  nextAgenda: string[];
}

export const meetingsApi = {
  list: () => request<Meeting[]>("/api/meetings"),
  get: (id: string) => request<Meeting>(`/api/meetings/${id}`),
  create: (title: string) =>
    request<Meeting>("/api/meetings", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  updateStatus: (id: string | number, status: "IN_PROGRESS" | "COMPLETED") =>
    request<Meeting>(`/api/meetings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getMinutes: (id: string) => request<MeetingMinutes>(`/api/meetings/${id}/minutes`),
  getTodos: (id: string) =>
    request<{ id: string; text: string; assignee: string; done: boolean }[]>(
      `/api/meetings/${id}/todos`
    ),
  completeTodo: (todoId: string) =>
    request<void>(`/api/todos/${todoId}`, { method: "PATCH", body: JSON.stringify({ done: true }) }),
};

// Users
export interface UserSummary {
  id: number;
  name: string;
  email: string;
}

export const userApi = {
  searchByEmail: (email: string) => request<UserSummary>(`/api/users/search?email=${encodeURIComponent(email)}`),
};

// Meetings - participant
export const participantApi = {
  list: (meetingId: string | number) =>
    request<UserSummary[]>(`/api/meetings/${meetingId}/participants`),
  add: (meetingId: string | number, email: string) =>
    request<UserSummary>(`/api/meetings/${meetingId}/participants`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};

// AI
export const aiApi = {
  analyze: (meetingId: string, transcript: string) =>
    request<MeetingMinutes>("/api/ai/analyze", {
      method: "POST",
      body: JSON.stringify({ meetingId, transcript }),
    }),
};
