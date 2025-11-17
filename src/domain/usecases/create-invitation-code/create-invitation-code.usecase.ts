import { IInvitationCodeRepository } from '../../repositories/invitation-code.repository.interface.js';
import { ICodeGenerator } from '../../../application/services/code-generator.service.js';

import {
  CreateInvitationCodeInput,
  CreateInvitationCodeOutput,
} from './create-invitation-code.dto.js';

export class CreateInvitationCodeUseCase {
  constructor(
    private readonly invitationCodeRepository: IInvitationCodeRepository,
    private readonly codeGenerator: ICodeGenerator,
  ) {}

  async execute(input: CreateInvitationCodeInput): Promise<CreateInvitationCodeOutput> {
    const code = this.codeGenerator.generate();
    const maxUses = input.maxUses ?? 1;

    const invitationCode = await this.invitationCodeRepository.create({
      code,
      teamId: input.teamId,
      createdBy: input.createdBy,
      maxUses,
      expiresAt: input.expiresAt ?? null,
    });

    return {
      id: invitationCode.id,
      code: invitationCode.code,
    };
  }
}
