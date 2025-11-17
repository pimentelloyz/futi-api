import { PrismaLeagueInvitationRepository } from '../../infra/repositories/prisma-league-invitation-repository.js';
import { PrismaLeagueRepository } from '../../infra/repositories/prisma-league-repository.js';
import { PrismaTeamRepository } from '../../infra/repositories/prisma-team-repository.js';
import { SecureCodeGenerator } from '../../application/services/code-generator.service.js';
import { CreateLeagueInvitationUseCase } from '../../domain/usecases/create-league-invitation/create-league-invitation.usecase.js';
import { AcceptLeagueInvitationUseCase } from '../../domain/usecases/accept-league-invitation/accept-league-invitation.usecase.js';
import { ListLeagueInvitationsUseCase } from '../../domain/usecases/list-league-invitations/list-league-invitations.usecase.js';

export const makeCreateLeagueInvitationUseCase = () => {
  const leagueInvitationRepository = new PrismaLeagueInvitationRepository();
  const leagueRepository = new PrismaLeagueRepository();
  const codeGenerator = new SecureCodeGenerator();
  return new CreateLeagueInvitationUseCase(
    leagueInvitationRepository,
    leagueRepository,
    codeGenerator,
  );
};

export const makeAcceptLeagueInvitationUseCase = () => {
  const leagueInvitationRepository = new PrismaLeagueInvitationRepository();
  const teamRepository = new PrismaTeamRepository();
  return new AcceptLeagueInvitationUseCase(leagueInvitationRepository, teamRepository);
};

export const makeListLeagueInvitationsUseCase = () => {
  const leagueInvitationRepository = new PrismaLeagueInvitationRepository();
  return new ListLeagueInvitationsUseCase(leagueInvitationRepository);
};
