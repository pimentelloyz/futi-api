import { ILeagueGroupRepository } from '../../repositories/league-group.repository.interface.js';

import { AddTeamToGroupInput, AddTeamToGroupOutput } from './add-team-to-group.dto.js';

export class AddTeamToGroupUseCase {
  constructor(private readonly leagueGroupRepository: ILeagueGroupRepository) {}

  async execute(input: AddTeamToGroupInput): Promise<AddTeamToGroupOutput> {
    const group = await this.leagueGroupRepository.findById(input.groupId);
    if (!group || group.leagueId !== input.leagueId) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const alreadyInGroup = await this.leagueGroupRepository.teamExistsInGroup(
      input.groupId,
      input.teamId,
    );
    if (alreadyInGroup) {
      throw new Error('TEAM_ALREADY_IN_GROUP');
    }

    const result = await this.leagueGroupRepository.addTeam({
      groupId: input.groupId,
      teamId: input.teamId,
    });

    return result;
  }
}
