import { CreateInvitationCodeController } from '../../presentation/controllers/create-invitation-code-controller.js';
import { ListInvitationCodesController } from '../../presentation/controllers/list-invitation-codes-controller.js';
import { RevokeInvitationCodeController } from '../../presentation/controllers/revoke-invitation-code-controller.js';

export function makeCreateInvitationCodeController() {
  return new CreateInvitationCodeController();
}

export function makeListInvitationCodesController() {
  return new ListInvitationCodesController();
}

export function makeRevokeInvitationCodeController() {
  return new RevokeInvitationCodeController();
}
