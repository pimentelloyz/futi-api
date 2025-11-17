import type { Request, Response } from 'express';

import type { GenerateFixturesUseCase } from '../../domain/usecases/generate-fixtures/generate-fixtures.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

export class GenerateFixturesController implements Controller {
  constructor(private readonly generateFixturesUseCase: GenerateFixturesUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { id, groupId } = request.params as { id?: string; groupId?: string };

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

      const result = await this.generateFixturesUseCase.execute({
        leagueId: id,
        groupId,
      });

      return {
        statusCode: 201,
        body: result,
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'GROUP_NOT_FOUND') {
        return {
          statusCode: 404,
          body: { message: 'group not found for league' },
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
