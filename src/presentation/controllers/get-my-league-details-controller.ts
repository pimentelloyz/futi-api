import type { Request, Response } from 'express';

import type { GetMyLeagueDetailsUseCase } from '../../domain/usecases/get-my-league-details/get-my-league-details.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

export class GetMyLeagueDetailsController implements Controller {
  constructor(private readonly getMyLeagueDetailsUseCase: GetMyLeagueDetailsUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      if (!request.user?.id) {
        return {
          statusCode: 401,
          body: { error: 'unauthorized' },
        };
      }

      const { id } = request.params as { id?: string };

      if (!id) {
        return {
          statusCode: 400,
          body: { error: 'invalid_league_id' },
        };
      }

      const result = await this.getMyLeagueDetailsUseCase.execute({
        userId: request.user.id,
        leagueId: id,
      });

      return {
        statusCode: 200,
        body: result,
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'LEAGUE_NOT_FOUND') {
        return {
          statusCode: 404,
          body: { error: 'league_not_found' },
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
