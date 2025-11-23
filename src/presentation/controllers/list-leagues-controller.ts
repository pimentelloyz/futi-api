import type { Request, Response } from 'express';

import type { ListLeaguesUseCase } from '../../domain/usecases/list-leagues/list-leagues.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

export class ListLeaguesController implements Controller {
  constructor(private readonly listLeaguesUseCase: ListLeaguesUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const qp = request.query as Record<string, string | undefined>;

      const result = await this.listLeaguesUseCase.execute({
        q: qp.q?.toString().trim(),
        name: qp.name?.toString().trim(),
        slug: qp.slug?.toString().trim(),
        isActive:
          qp.isActive?.toString().toLowerCase() === 'true'
            ? true
            : qp.isActive?.toString().toLowerCase() === 'false'
              ? false
              : undefined,
        isPublic:
          qp.isPublic?.toString().toLowerCase() === 'true'
            ? true
            : qp.isPublic?.toString().toLowerCase() === 'false'
              ? false
              : undefined,
        startAtFrom: qp.startAtFrom,
        startAtTo: qp.startAtTo,
        endAtFrom: qp.endAtFrom,
        endAtTo: qp.endAtTo,
        page: qp.page ? parseInt(qp.page, 10) : undefined,
        pageSize: qp.pageSize ? parseInt(qp.pageSize, 10) : undefined,
        orderBy: qp.orderBy,
        order: qp.order === 'asc' || qp.order === 'desc' ? qp.order : undefined,
      });

      return {
        statusCode: 200,
        body: result,
      };
    } catch (error) {
      throw error;
    }
  }

  async handleExpress(req: Request, res: Response) {
    const httpRequest: HttpRequest = {
      body: req.body,
      params: req.params,
      query: req.query,
      user: (req as Request & { user?: { id: string } }).user,
    };
    const httpResponse = await this.handle(httpRequest);
    return res.status(httpResponse.statusCode).json(httpResponse.body);
  }
}
