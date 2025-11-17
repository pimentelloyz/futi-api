import type { Request, Response } from 'express';

import type { CreateLeagueUseCase } from '../../domain/usecases/create-league/create-league.usecase.js';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

export class CreateLeagueController implements Controller {
  constructor(private readonly createLeagueUseCase: CreateLeagueUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { name, slug, description, startAt, endAt, icon, banner, isPublic } = request.body as {
        name?: string;
        slug?: string;
        description?: string | null;
        startAt?: string | Date | null;
        endAt?: string | Date | null;
        icon?: string | null;
        banner?: string | null;
        isPublic?: boolean;
      };

      if (!name || !slug) {
        return {
          statusCode: 400,
          body: { message: 'name and slug are required' },
        };
      }

      const result = await this.createLeagueUseCase.execute({
        name,
        slug,
        description,
        icon,
        banner,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        isPublic,
      });

      return {
        statusCode: 201,
        body: result,
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'SLUG_ALREADY_EXISTS') {
        return {
          statusCode: 409,
          body: { message: 'slug already exists' },
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
