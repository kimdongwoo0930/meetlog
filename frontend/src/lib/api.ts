const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// 동시에 여러 401이 발생해도 refresh를 한 번만 실행
let refreshingPromise: Promise<void> | null = null;

async function doRefresh(): Promise<void> {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error("Refresh failed");

  const data: { accessToken: string; refreshToken: string } = await res.json();
  localStorage.setItem("access_token", data.accessToken);
  localStorage.setItem("refresh_token", data.refreshToken);
}

function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
}

async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401 && !isRetry) {
    const storedRefreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (!storedRefreshToken) {
      // 로그인/회원가입 시 잘못된 인증 정보 → 그냥 에러로 처리
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? "이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    // 로그인된 상태에서 토큰 만료 → refresh 시도
    try {
      if (!refreshingPromise) {
        refreshingPromise = doRefresh().finally(() => { refreshingPromise = null; });
      }
      await refreshingPromise;
      return request<T>(path, init, true);
    } catch {
      clearAuth();
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
    }
  }

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
    request<{ accessToken: string; refreshToken: string }>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
  logout: () => {
    clearAuth();
    if (typeof window !== "undefined") window.location.href = "/login";
  },
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
  saveSegment: (id: string | number, segment: { speaker: string; content: string; startTime: number; endTime: number }) =>
    request<void>(`/api/meetings/${id}/segments`, { method: "POST", body: JSON.stringify(segment) }),
  getSegments: (id: string | number) =>
    request<{ id: number; speaker: string; content: string; startTime: number; endTime: number; createdAt: string }[]>(`/api/meetings/${id}/segments`),
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
  me: () => request<UserSummary>("/api/users/me"),
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
