import { IInvitationCodeRepository } from '../../repositories/invitation-code.repository.interface.js';

import {
  ListInvitationCodesInput,
  ListInvitationCodesOutput,
} from './list-invitation-codes.dto.js';

export class ListInvitationCodesUseCase {
  constructor(private readonly invitationCodeRepository: IInvitationCodeRepository) {}

  async execute(input: ListInvitationCodesInput): Promise<ListInvitationCodesOutput> {
    const codes = await this.invitationCodeRepository.listByTeam(input.teamId, input.isActive);

    return {
      invitationCodes: codes.map((code) => ({
        id: code.id,
        code: code.code,
        teamId: code.teamId,
        createdBy: code.createdBy,
        maxUses: code.maxUses,
        uses: code.uses,
        isActive: code.isActive,
        expiresAt: code.expiresAt,
        createdAt: code.createdAt,
      })),
    };
  }
}
