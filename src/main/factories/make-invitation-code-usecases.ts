import { PrismaInvitationCodeRepository } from '../../infra/repositories/prisma-invitation-code-repository.js';
import { PrismaPlayerRepository } from '../../infra/repositories/prisma-player-repository.js';
import { SecureCodeGenerator } from '../../application/services/code-generator.service.js';
import { CreateInvitationCodeUseCase } from '../../domain/usecases/create-invitation-code/create-invitation-code.usecase.js';
import { AcceptInvitationCodeUseCase } from '../../domain/usecases/accept-invitation-code/accept-invitation-code.usecase.js';
import { ListInvitationCodesUseCase } from '../../domain/usecases/list-invitation-codes/list-invitation-codes.usecase.js';
import { RevokeInvitationCodeUseCase } from '../../domain/usecases/revoke-invitation-code/revoke-invitation-code.usecase.js';

export const makeCreateInvitationCodeUseCase = () => {
  const invitationCodeRepository = new PrismaInvitationCodeRepository();
  const codeGenerator = new SecureCodeGenerator();
  return new CreateInvitationCodeUseCase(invitationCodeRepository, codeGenerator);
};

export const makeAcceptInvitationCodeUseCase = () => {
  const invitationCodeRepository = new PrismaInvitationCodeRepository();
  const playerRepository = new PrismaPlayerRepository();
  return new AcceptInvitationCodeUseCase(invitationCodeRepository, playerRepository);
};

export const makeListInvitationCodesUseCase = () => {
  const invitationCodeRepository = new PrismaInvitationCodeRepository();
  return new ListInvitationCodesUseCase(invitationCodeRepository);
};

export const makeRevokeInvitationCodeUseCase = () => {
  const invitationCodeRepository = new PrismaInvitationCodeRepository();
  return new RevokeInvitationCodeUseCase(invitationCodeRepository);
};
