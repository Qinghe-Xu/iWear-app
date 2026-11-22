/** 统一的 API 封装：拼接地址、带 token、默认超时 30 秒（试穿 240 秒）、401 自动退出。 */

import Constants from 'expo-constants';

const DEFAULT_TIMEOUT = 30_000;
const TRYON_TIMEOUT = 240_000;

/** 地址来源：EXPO_PUBLIC_API_URL > app.json 的 extra.apiUrl > Web 同源 > 开发机局域网提示 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };
  if (extra.apiUrl) return extra.apiUrl.replace(/\/$/, '');
  return '';
}

export const API_BASE = resolveBaseUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function fileUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  /** 表单上传 */
  form?: FormData;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, form, timeoutMs = DEFAULT_TIMEOUT } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: options.signal ?? controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if ((error as Error)?.name === 'AbortError') {
      throw new ApiError('请求超时，请检查网络后重试', 0);
    }
    throw new ApiError('无法连接服务器，请检查网络', 0);
  }
  clearTimeout(timer);

  if (response.status === 401) {
    onUnauthorized?.();
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const detail =
      (data as { detail?: unknown } | null)?.detail ??
      (Array.isArray((data as { detail?: unknown[] } | null)?.detail)
        ? '输入内容有误，请检查后重试'
        : null);
    const message =
      typeof detail === 'string' ? detail : response.status === 401 ? '请先登录' : '操作失败，请重试';
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string, body?: unknown) => request<T>(path, { method: 'DELETE', body }),
  upload: <T>(path: string, form: FormData, timeoutMs?: number) =>
    request<T>(path, { method: 'POST', form, timeoutMs }),
  tryon: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', form, timeoutMs: TRYON_TIMEOUT }),
};

export type UserProfile = {
  id: string;
  phone: string;
  name: string;
  city: string | null;
  gender: 'male' | 'female' | 'unspecified';
  height: number | null;
  weight: number | null;
  waist: number | null;
  body_shape: string | null;
  style_tags: string[];
  created_at: string;
};
