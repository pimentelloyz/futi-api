import type { Request, Response } from 'express';

import type { GetLeagueUseCase } from '../../domain/usecases/get-league/get-league.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

export class GetLeagueController implements Controller {
  constructor(private readonly getLeagueUseCase: GetLeagueUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { id } = request.params as { id?: string };

      if (!id) {
        return {
          statusCode: 400,
          body: { message: 'id is required' },
        };
      }

      const result = await this.getLeagueUseCase.execute({ identifier: id });

      return {
        statusCode: 200,
        body: result,
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'LEAGUE_NOT_FOUND') {
        return {
          statusCode: 404,
          body: { message: 'League not found' },
        };
      }
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
