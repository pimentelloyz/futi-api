import { ERROR_CODES } from '../../domain/constants.js';
import { ListTeamPlayersUseCase } from '../../domain/usecases/list-team-players.js';

interface TeamPlayersParams {
  teamId: string;
  page: number;
  limit: number;
  sort: 'name' | 'number' | 'positionSlug' | 'isActive';
  order: 'asc' | 'desc';
  includeTeam: boolean;
}

export class TeamPlayersController {
  constructor(private readonly usecase: ListTeamPlayersUseCase) {}
  async handle(params: TeamPlayersParams): Promise<{ statusCode: number; body: unknown }> {
    if (!params.teamId) return { statusCode: 400, body: { error: 'invalid_team_id' } };
    try {
      return await this.usecase.execute({ ...params });
    } catch (e) {
      console.error('[team_players_ctrl_error]', (e as Error).message);
      return { statusCode: 500, body: { error: ERROR_CODES.INTERNAL_ERROR } };
    }
  }
}
