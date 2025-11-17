import { ILeagueInvitationRepository } from '../../repositories/league-invitation.repository.interface.js';
import { ITeamRepository } from '../../repositories/team.repository.interface.js';

import {
  AcceptLeagueInvitationInput,
  AcceptLeagueInvitationOutput,
} from './accept-league-invitation.dto.js';

export class AcceptLeagueInvitationUseCase {
  constructor(
    private readonly leagueInvitationRepository: ILeagueInvitationRepository,
    private readonly teamRepository: ITeamRepository,
  ) {}

  async execute(input: AcceptLeagueInvitationInput): Promise<AcceptLeagueInvitationOutput> {
    // 1. Validate team exists
    const teamExists = await this.teamRepository.exists(input.teamId);
    if (!teamExists) {
      throw new Error('TEAM_NOT_FOUND');
    }

    // 2. Find and validate invitation
    const invitation = await this.leagueInvitationRepository.findByCode(input.code);
    if (!invitation) {
      throw new Error('INVITE_NOT_FOUND');
    }

    if (!invitation.isValid()) {
      if (invitation.isExpired()) {
        throw new Error('INVITE_EXPIRED');
      }
      if (!invitation.hasAvailableUses()) {
        throw new Error('INVITE_MAXED');
      }
      throw new Error('INVITE_INVALID');
    }

    // 3. Check if team is already in league
    const teamLeagueIds = await this.teamRepository.getLeagueIds(input.teamId);
    if (!invitation.canBeAcceptedBy(input.teamId, teamLeagueIds)) {
      throw new Error('TEAM_ALREADY_IN_LEAGUE');
    }

    // 4. Link team to league
    await this.teamRepository.linkToLeague(input.teamId, invitation.leagueId);

    // 5. Increment invitation uses
    await this.leagueInvitationRepository.incrementUse(invitation.id);

    // 6. Revoke if needed
    const updatedInvitation = await this.leagueInvitationRepository.findById(invitation.id);
    if (updatedInvitation && updatedInvitation.shouldBeRevoked()) {
      await this.leagueInvitationRepository.revoke(invitation.id);
    }

    return {
      success: true,
      leagueId: invitation.leagueId,
      message: 'team_linked',
    };
  }
}
