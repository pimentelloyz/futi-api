import { ILeagueInvitationRepository } from '../../repositories/league-invitation.repository.interface.js';

import {
  RevokeLeagueInvitationInput,
  RevokeLeagueInvitationOutput,
} from './revoke-league-invitation.dto.js';

export class RevokeLeagueInvitationUseCase {
  constructor(private readonly leagueInvitationRepository: ILeagueInvitationRepository) {}

  async execute(input: RevokeLeagueInvitationInput): Promise<RevokeLeagueInvitationOutput> {
    const invitation = await this.leagueInvitationRepository.findById(input.invitationId);
    if (!invitation) {
      throw new Error('INVITE_NOT_FOUND');
    }

    await this.leagueInvitationRepository.revoke(input.invitationId);
    return { success: true };
  }
}
