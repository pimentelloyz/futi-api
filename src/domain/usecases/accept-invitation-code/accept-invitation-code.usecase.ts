import { IInvitationCodeRepository } from '../../repositories/invitation-code.repository.interface.js';
import { IPlayerRepository } from '../../repositories/player.repository.interface.js';

import {
  AcceptInvitationCodeInput,
  AcceptInvitationCodeOutput,
} from './accept-invitation-code.dto.js';

export class AcceptInvitationCodeUseCase {
  constructor(
    private readonly invitationCodeRepository: IInvitationCodeRepository,
    private readonly playerRepository: IPlayerRepository,
  ) {}

  async execute(input: AcceptInvitationCodeInput): Promise<AcceptInvitationCodeOutput> {
    // 1. Find or create player
    let player = await this.playerRepository.findByUserId(input.userId);
    if (!player) {
      // Auto-criar perfil de jogador para FANs aceitando convite
      // Nome padrão será atualizado pelo usuário depois
      player = await this.playerRepository.addForUser(input.userId, {
        name: 'Jogador',
        isActive: true,
      });
    }

    // 2. Find and validate invitation code
    const invitationCode = await this.invitationCodeRepository.findByCode(input.code);
    if (!invitationCode) {
      throw new Error('INVITE_NOT_FOUND');
    }

    if (!invitationCode.isValid()) {
      if (invitationCode.isExpired()) {
        throw new Error('INVITE_EXPIRED');
      }
      if (!invitationCode.hasAvailableUses()) {
        throw new Error('INVITE_MAXED');
      }
      throw new Error('INVITE_INVALID');
    }

    // 3. Check if player is already member of the team
    const playerTeamIds = await this.playerRepository.getTeamIds(player.id);
    if (!invitationCode.canBeUsedBy(player.id, playerTeamIds)) {
      throw new Error('ALREADY_MEMBER');
    }

    // 4. Link player to team
    await this.playerRepository.linkToTeam(player.id, invitationCode.teamId, input.userId);

    // 5. Increment invitation uses
    await this.invitationCodeRepository.incrementUse(invitationCode.id);

    // 6. Revoke if needed
    const updatedCode = await this.invitationCodeRepository.findById(invitationCode.id);
    if (updatedCode && updatedCode.shouldBeRevoked()) {
      await this.invitationCodeRepository.revoke(invitationCode.id);
    }

    return {
      success: true,
      teamId: invitationCode.teamId,
      message: 'joined',
    };
  }
}
