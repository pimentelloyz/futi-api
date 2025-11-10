import type { CookieOptions } from 'express';

export type HttpRequest<T = unknown> = {
  body?: T;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
  cookies?: Record<string, unknown>;
  // Campo de user injetado pelo middleware jwtAuth
  user?: { id: string; firebaseUid?: string };
};

export type HttpResponse<T = unknown> = {
  statusCode: number;
  body: T | { error: string };
  setCookie?: { name: string; value: string; options: CookieOptions };
  clearCookie?: { name: string; options: CookieOptions };
};

export interface Controller<T = unknown, R = unknown> {
  handle(request: HttpRequest<T>): Promise<HttpResponse<R>>;
}
