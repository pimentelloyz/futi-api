import { IInvitationCodeRepository } from '../../repositories/invitation-code.repository.interface.js';

import {
  RevokeInvitationCodeInput,
  RevokeInvitationCodeOutput,
} from './revoke-invitation-code.dto.js';

export class RevokeInvitationCodeUseCase {
  constructor(private readonly invitationCodeRepository: IInvitationCodeRepository) {}

  async execute(input: RevokeInvitationCodeInput): Promise<RevokeInvitationCodeOutput> {
    await this.invitationCodeRepository.revoke(input.invitationCodeId);
    return { success: true };
  }
}
