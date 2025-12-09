import type { Request, Response } from 'express';

import { ListTeamLeaguesUseCase } from '../../domain/usecases/list-team-leagues/list-team-leagues.usecase.js';
import { HttpRequest, HttpResponse } from '../../presentation/protocols/http.js';

export interface Controller {
  handle(request: HttpRequest): Promise<HttpResponse>;
}

export class ListTeamLeaguesController implements Controller {
  constructor(private readonly listTeamLeaguesUseCase: ListTeamLeaguesUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { id } = request.params as { id?: string };

      if (!id) {
        return {
          statusCode: 400,
          body: { message: 'invalid team id' },
        };
      }

      const result = await this.listTeamLeaguesUseCase.execute({ teamId: id });

      return {
        statusCode: 200,
        body: result.leagues,
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'TEAM_NOT_FOUND') {
        return {
          statusCode: 404,
          body: { message: 'team not found' },
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
