import type { Request, Response } from 'express';
import type { Controller } from '../protocols/controller.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';
import type { CreateRecurringMatchesUseCase } from '../../domain/usecases/create-recurring-matches/create-recurring-matches.usecase.js';

/**
 * Controller para criar partidas recorrentes
 * POST /api/matches/recurring
 */
export class CreateRecurringMatchesController implements Controller {
  constructor(private readonly createRecurringMatchesUseCase: CreateRecurringMatchesUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const {
        homeTeamId,
        awayTeamId,
        venue,
        startDate,
        pattern,
        occurrences,
        endDate,
        daysOfWeek,
        time,
      } = request.body as {
        homeTeamId: string;
        awayTeamId: string;
        venue?: string;
        startDate: string;
        pattern: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
        occurrences?: number;
        endDate?: string;
        daysOfWeek?: number[]; // 0=Domingo, 1=Segunda, ..., 6=Sábado
        time: string; // "19:00"
      };

      if (!homeTeamId || !awayTeamId || !startDate || !pattern || !time) {
        return {
          statusCode: 400,
          body: { message: 'homeTeamId, awayTeamId, startDate, pattern, and time are required' },
        };
      }

      if (!request.user?.id) {
        return {
          statusCode: 401,
          body: { message: 'Unauthorized' },
        };
      }

      const result = await this.createRecurringMatchesUseCase.execute({
        homeTeamId,
        awayTeamId,
        venue,
        startDate: new Date(startDate),
        pattern,
        occurrences,
        endDate: endDate ? new Date(endDate) : undefined,
        daysOfWeek,
        time,
        userId: request.user.id,
      });

      return {
        statusCode: 201,
        body: result,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'UNAUTHORIZED') {
          return {
            statusCode: 403,
            body: { message: 'You do not have permission to create matches for these teams' },
          };
        }
        if (error.message === 'INVALID_PATTERN') {
          return {
            statusCode: 400,
            body: { message: 'Invalid recurrence pattern' },
          };
        }
        if (error.message === 'TEAMS_NOT_FOUND') {
          return {
            statusCode: 404,
            body: { message: 'One or both teams not found' },
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
