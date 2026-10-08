"use client";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

type ApiError = { detail?: string };

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  created_at: string;
};

export type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export function setToken(token: string): void {
  window.localStorage.setItem("stech_access_token", token);
}

export function clearToken(): void {
  window.localStorage.removeItem("stech_access_token");
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("stech_access_token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => null) as T | ApiError | null;
  if (!response.ok) {
    const detail = body && typeof body === "object" && "detail" in body && typeof body.detail === "string"
      ? body.detail
      : `API isteği başarısız (${response.status})`;
    throw new Error(detail);
  }
  return body as T;
}

export const api = {
  register(email: string, password: string, name = ""): Promise<AuthTokens> {
    return request<AuthTokens>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  },

  login(email: string, password: string): Promise<AuthTokens> {
    return request<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  createConversation(): Promise<Conversation> {
    return request<Conversation>("/conversations", { method: "POST" });
  },

  listMessages(conversationId: string): Promise<Message[]> {
    return request<Message[]>(`/conversations/${encodeURIComponent(conversationId)}/messages`);
  },

  sendMessage(conversationId: string, content: string): Promise<Message> {
    return request<Message>(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },
};
