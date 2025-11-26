import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { UnauthorizedError } from '../errors/http-errors.js';
import {
  GetMyTeamOverviewUseCase,
  NoTeamFoundError,
  TeamNotFoundError,
} from '../../domain/usecases/get-my-team-overview/get-my-team-overview.usecase.js';
import { ERROR_CODES } from '../../domain/constants.js';
import { prisma } from '../../infra/prisma/client.js';

export interface GetMyTeamOverviewRequest extends HttpRequest {
  user?: { id: string };
  query?: { teamId?: string };
}

export class GetMyTeamOverviewController implements Controller {
  private useCase: GetMyTeamOverviewUseCase;

  constructor(useCase?: GetMyTeamOverviewUseCase) {
    this.useCase = useCase || new GetMyTeamOverviewUseCase(prisma);
  }

  async handle(request: GetMyTeamOverviewRequest): Promise<HttpResponse> {
    try {
      const userId = request.user?.id;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const teamId = request.query?.teamId;

      const result = await this.useCase.execute({
        userId,
        teamId,
      });

      return {
        statusCode: 200,
        body: result,
      };
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return { statusCode: 401, body: { error: ERROR_CODES.UNAUTHORIZED } };
      }

      if (err instanceof NoTeamFoundError) {
        return { statusCode: 404, body: { error: 'no_team' } };
      }

      if (err instanceof TeamNotFoundError) {
        return { statusCode: 404, body: { error: ERROR_CODES.TEAM_NOT_FOUND } };
      }

      console.error('[player_overview_error]', (err as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}
