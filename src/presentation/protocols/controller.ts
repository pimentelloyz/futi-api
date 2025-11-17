import type { HttpRequest, HttpResponse } from './http.js';

export interface Controller {
  handle(request: HttpRequest): Promise<HttpResponse>;
}
