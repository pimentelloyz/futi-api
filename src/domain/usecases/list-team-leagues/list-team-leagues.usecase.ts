import { ITeamRepository } from '../../repositories/team.repository.interface.js';
import { ILeagueRepository } from '../../repositories/league.repository.interface.js';
import { ListTeamLeaguesInput, ListTeamLeaguesOutput } from './list-team-leagues.dto.js';

export class ListTeamLeaguesUseCase {
  constructor(
    private readonly teamRepository: ITeamRepository,
    private readonly leagueRepository: ILeagueRepository,
  ) {}

  async execute(input: ListTeamLeaguesInput): Promise<ListTeamLeaguesOutput> {
    // Verifica se o time existe
    const teamExists = await this.teamRepository.exists(input.teamId);
    if (!teamExists) {
      throw new Error('TEAM_NOT_FOUND');
    }

    // Busca os IDs das ligas vinculadas ao time
    const leagueIds = await this.teamRepository.getLeagueIds(input.teamId);

    if (leagueIds.length === 0) {
      return { leagues: [] };
    }

    // Busca detalhes das ligas
    const leagues = await this.leagueRepository.findByIds(leagueIds);

    return { leagues };
  }
}
