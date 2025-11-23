import type { Request, Response } from 'express';

import type { GetLeagueSettingsUseCase } from '../../domain/usecases/get-league-settings/get-league-settings.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

export class GetLeagueSettingsController implements Controller {
  constructor(private readonly getLeagueSettingsUseCase: GetLeagueSettingsUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const leagueId = request.params?.id as string;
      const userId = request.user?.id;

      if (!leagueId) {
        return {
          statusCode: 400,
          body: { error: 'league_id_required' },
        };
      }

      if (!userId) {
        return {
          statusCode: 401,
          body: { error: 'unauthorized' },
        };
      }

      const result = await this.getLeagueSettingsUseCase.execute({
        leagueId,
        userId,
      });

      return {
        statusCode: 200,
        body: result,
      };
    } catch (error) {
      if ((error as Error).message === 'league_not_found') {
        return {
          statusCode: 404,
          body: { error: 'league_not_found' },
        };
      }

      if ((error as Error).message === 'unauthorized') {
        return {
          statusCode: 403,
          body: { error: 'unauthorized' },
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
