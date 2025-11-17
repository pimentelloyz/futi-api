import type { Request, Response } from 'express';

import type { AddTeamToLeagueUseCase } from '../../domain/usecases/add-team-to-league/add-team-to-league.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

export class AddTeamToLeagueController implements Controller {
  constructor(private readonly addTeamToLeagueUseCase: AddTeamToLeagueUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { id } = request.params as { id?: string };
      const { teamId, division } = request.body as { teamId?: string; division?: string | null };

      if (!id) {
        return {
          statusCode: 400,
          body: { message: 'league id required' },
        };
      }

      if (!teamId) {
        return {
          statusCode: 400,
          body: { message: 'teamId required' },
        };
      }

      const result = await this.addTeamToLeagueUseCase.execute({
        leagueId: id,
        teamId,
        division,
      });

      return {
        statusCode: 201,
        body: result,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'LEAGUE_NOT_FOUND') {
          return {
            statusCode: 404,
            body: { message: 'league not found' },
          };
        }
        if (error.message === 'TEAM_ALREADY_IN_LEAGUE') {
          return {
            statusCode: 400,
            body: { message: 'could not link team (maybe already linked)' },
          };
        }
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
