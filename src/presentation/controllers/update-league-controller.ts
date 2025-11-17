import type { Request, Response } from 'express';

import type { UpdateLeagueUseCase } from '../../domain/usecases/update-league/update-league.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

export class UpdateLeagueController implements Controller {
  constructor(private readonly updateLeagueUseCase: UpdateLeagueUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { id } = request.params as { id?: string };
      const { name, slug, description, startAt, endAt, isActive, icon, banner } = request.body as {
        name?: string;
        slug?: string;
        description?: string | null;
        startAt?: string | Date | null;
        endAt?: string | Date | null;
        isActive?: boolean;
        icon?: string | null;
        banner?: string | null;
      };

      if (!id) {
        return {
          statusCode: 400,
          body: { message: 'id is required' },
        };
      }

      const result = await this.updateLeagueUseCase.execute({
        leagueId: id,
        name,
        slug,
        description,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        isActive,
        icon,
        banner,
      });

      return {
        statusCode: 200,
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
        if (error.message === 'SLUG_ALREADY_EXISTS') {
          return {
            statusCode: 409,
            body: { message: 'slug already exists' },
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
