import type { Request, Response } from 'express';

import type { GenerateGroupsUseCase } from '../../domain/usecases/generate-groups/generate-groups.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

/**
 * Controller para gerar grupos automaticamente baseado no formato da liga
 * POST /api/leagues/:leagueId/generate-groups
 */
export class GenerateGroupsController implements Controller {
  constructor(private readonly generateGroupsUseCase: GenerateGroupsUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { leagueId } = request.params as { leagueId?: string };
      const { count, namingPattern = 'LETTER' } = request.body as {
        count?: number;
        namingPattern?: 'LETTER' | 'NUMBER';
      };

      if (!leagueId) {
        return {
          statusCode: 400,
          body: { message: 'leagueId is required' },
        };
      }

      if (!request.user?.id) {
        return {
          statusCode: 401,
          body: { message: 'Unauthorized' },
        };
      }

      const result = await this.generateGroupsUseCase.execute({
        leagueId,
        userId: request.user.id,
        count,
        namingPattern,
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
            body: { message: 'League not found' },
          };
        }
        if (error.message === 'UNAUTHORIZED') {
          return {
            statusCode: 403,
            body: { message: 'You do not have permission to manage this league' },
          };
        }
        if (error.message === 'GROUPS_ALREADY_EXIST') {
          return {
            statusCode: 409,
            body: { message: 'Groups already exist for this league. Delete existing groups first.' },
          };
        }
        if (error.message === 'FORMAT_NOT_CONFIGURED') {
          return {
            statusCode: 400,
            body: { message: 'League format must be configured first' },
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
