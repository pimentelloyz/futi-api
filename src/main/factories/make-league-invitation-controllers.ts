import { CreateLeagueInvitationController } from '../../presentation/controllers/create-league-invitation-controller.js';
import { ListLeagueInvitationsController } from '../../presentation/controllers/list-league-invitations-controller.js';
import { RevokeLeagueInvitationController } from '../../presentation/controllers/revoke-league-invitation-controller.js';
import { AcceptLeagueInvitationController } from '../../presentation/controllers/accept-league-invitation-controller.js';

import {
  makeCreateLeagueInvitationUseCase,
  makeAcceptLeagueInvitationUseCase,
  makeListLeagueInvitationsUseCase,
} from './make-league-invitation-usecases.js';

export function makeCreateLeagueInvitationController() {
  const useCase = makeCreateLeagueInvitationUseCase();
  return new CreateLeagueInvitationController(useCase);
}

export function makeListLeagueInvitationsController() {
  const useCase = makeListLeagueInvitationsUseCase();
  return new ListLeagueInvitationsController(useCase);
}

export function makeRevokeLeagueInvitationController() {
  return new RevokeLeagueInvitationController();
}

export function makeAcceptLeagueInvitationController() {
  const useCase = makeAcceptLeagueInvitationUseCase();
  return new AcceptLeagueInvitationController(useCase);
}
