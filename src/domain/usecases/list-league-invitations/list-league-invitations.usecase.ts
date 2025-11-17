import { ILeagueInvitationRepository } from '../../repositories/league-invitation.repository.interface.js';

import {
  ListLeagueInvitationsInput,
  ListLeagueInvitationsOutput,
} from './list-league-invitations.dto.js';

export class ListLeagueInvitationsUseCase {
  constructor(private readonly leagueInvitationRepository: ILeagueInvitationRepository) {}

  async execute(input: ListLeagueInvitationsInput): Promise<ListLeagueInvitationsOutput> {
    const invitations = await this.leagueInvitationRepository.listByLeague(
      input.leagueId,
      input.isActive,
    );

    return {
      invitations: invitations.map((inv) => ({
        id: inv.id,
        code: inv.code,
        leagueId: inv.leagueId,
        createdBy: inv.createdBy,
        maxUses: inv.maxUses,
        uses: inv.uses,
        isActive: inv.isActive,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      })),
    };
  }
}
