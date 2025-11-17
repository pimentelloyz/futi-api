import type { Request, Response } from 'express';

import type { AddTeamToGroupUseCase } from '../../domain/usecases/add-team-to-group/add-team-to-group.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

export class AddTeamToGroupController implements Controller {
  constructor(private readonly addTeamToGroupUseCase: AddTeamToGroupUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { id, groupId } = request.params as { id?: string; groupId?: string };
      const { teamId } = request.body as { teamId?: string };

      if (!id) {
        return {
          statusCode: 400,
          body: { message: 'league id required' },
        };
      }

      if (!groupId) {
        return {
          statusCode: 400,
          body: { message: 'group id required' },
        };
      }

      if (!teamId) {
        return {
          statusCode: 400,
          body: { message: 'teamId required' },
        };
      }

      const result = await this.addTeamToGroupUseCase.execute({
        leagueId: id,
        groupId,
        teamId,
      });

      return {
        statusCode: 201,
        body: result,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'GROUP_NOT_FOUND') {
          return {
            statusCode: 404,
            body: { message: 'group not found for league' },
          };
        }
        if (error.message === 'TEAM_ALREADY_IN_GROUP') {
          return {
            statusCode: 400,
            body: { message: 'could not add team to group (maybe already added)' },
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
