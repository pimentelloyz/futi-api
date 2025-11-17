import { ILeagueInvitationRepository } from '../../repositories/league-invitation.repository.interface.js';
import { ILeagueRepository } from '../../repositories/league.repository.interface.js';
import { ICodeGenerator } from '../../../application/services/code-generator.service.js';

import {
  CreateLeagueInvitationInput,
  CreateLeagueInvitationOutput,
} from './create-league-invitation.dto.js';

export class CreateLeagueInvitationUseCase {
  constructor(
    private readonly leagueInvitationRepository: ILeagueInvitationRepository,
    private readonly leagueRepository: ILeagueRepository,
    private readonly codeGenerator: ICodeGenerator,
  ) {}

  async execute(input: CreateLeagueInvitationInput): Promise<CreateLeagueInvitationOutput> {
    // Validate league exists
    const leagueExists = await this.leagueRepository.exists(input.leagueId);
    if (!leagueExists) {
      throw new Error('LEAGUE_NOT_FOUND');
    }

    const code = this.codeGenerator.generate();
    const maxUses = input.maxUses ?? 1;

    const invitation = await this.leagueInvitationRepository.create({
      code,
      leagueId: input.leagueId,
      createdBy: input.createdBy,
      maxUses,
      expiresAt: input.expiresAt ?? null,
    });

    return {
      id: invitation.id,
      code: invitation.code,
    };
  }
}
