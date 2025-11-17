import type { Request, Response } from 'express';

import type { ListMyLeaguesUseCase } from '../../domain/usecases/list-my-leagues/list-my-leagues.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

export class ListMyLeaguesController implements Controller {
  constructor(private readonly listMyLeaguesUseCase: ListMyLeaguesUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      if (!request.user?.id) {
        return {
          statusCode: 401,
          body: { message: 'Unauthorized' },
        };
      }

      const result = await this.listMyLeaguesUseCase.execute({
        userId: request.user.id,
      });

      return {
        statusCode: 200,
        body: result.leagues,
      };
    } catch (error) {
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
