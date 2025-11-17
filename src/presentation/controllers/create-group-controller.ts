import type { Request, Response } from 'express';

import type { CreateGroupUseCase } from '../../domain/usecases/create-group/create-group.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

export class CreateGroupController implements Controller {
  constructor(private readonly createGroupUseCase: CreateGroupUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { id } = request.params as { id?: string };
      const { name } = request.body as { name?: string };

      if (!id) {
        return {
          statusCode: 400,
          body: { message: 'league id required' },
        };
      }

      if (!name) {
        return {
          statusCode: 400,
          body: { message: 'name required' },
        };
      }

      const result = await this.createGroupUseCase.execute({
        leagueId: id,
        name,
      });

      return {
        statusCode: 201,
        body: result,
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'LEAGUE_NOT_FOUND') {
        return {
          statusCode: 404,
          body: { message: 'league not found' },
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
