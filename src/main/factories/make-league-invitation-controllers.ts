import { CreateLeagueInvitationController } from '../../presentation/controllers/create-league-invitation-controller.js';
import { ListLeagueInvitationsController } from '../../presentation/controllers/list-league-invitations-controller.js';
import { RevokeLeagueInvitationController } from '../../presentation/controllers/revoke-league-invitation-controller.js';
import { AcceptLeagueInvitationController } from '../../presentation/controllers/accept-league-invitation-controller.js';

export function makeCreateLeagueInvitationController() {
  return new CreateLeagueInvitationController();
}

export function makeListLeagueInvitationsController() {
  return new ListLeagueInvitationsController();
}

export function makeRevokeLeagueInvitationController() {
  return new RevokeLeagueInvitationController();
}

export function makeAcceptLeagueInvitationController() {
  return new AcceptLeagueInvitationController();
}
