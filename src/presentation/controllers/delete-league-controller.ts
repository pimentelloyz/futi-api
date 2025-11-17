import type { Request, Response } from 'express';

import type { DeleteLeagueUseCase } from '../../domain/usecases/delete-league/delete-league.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

export class DeleteLeagueController implements Controller {
  constructor(private readonly deleteLeagueUseCase: DeleteLeagueUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { id } = request.params as { id?: string };

      if (!id) {
        return {
          statusCode: 400,
          body: { message: 'id is required' },
        };
      }

      await this.deleteLeagueUseCase.execute({ leagueId: id });

      return {
        statusCode: 204,
        body: {},
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
