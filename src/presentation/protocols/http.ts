export type HttpRequest<T = unknown> = {
  body?: T;
  params?: Record<string, string>;
  query?: Record<string, string>;
};

export type HttpResponse<T = unknown> = {
  statusCode: number;
  body: T | { error: string };
};

export interface Controller<T = unknown, R = unknown> {
  handle(request: HttpRequest<T>): Promise<HttpResponse<R>>;
}
