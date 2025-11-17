import { CreateInvitationCodeController } from '../../presentation/controllers/create-invitation-code-controller.js';
import { AcceptInvitationCodeController } from '../../presentation/controllers/accept-invitation-code-controller.js';
import { ListInvitationCodesController } from '../../presentation/controllers/list-invitation-codes-controller.js';
import { RevokeInvitationCodeController } from '../../presentation/controllers/revoke-invitation-code-controller.js';

import {
  makeCreateInvitationCodeUseCase,
  makeAcceptInvitationCodeUseCase,
  makeListInvitationCodesUseCase,
} from './make-invitation-code-usecases.js';

export function makeCreateInvitationCodeController() {
  const useCase = makeCreateInvitationCodeUseCase();
  return new CreateInvitationCodeController(useCase);
}

export function makeAcceptInvitationCodeController() {
  const useCase = makeAcceptInvitationCodeUseCase();
  return new AcceptInvitationCodeController(useCase);
}

export function makeListInvitationCodesController() {
  const useCase = makeListInvitationCodesUseCase();
  return new ListInvitationCodesController(useCase);
}

export function makeRevokeInvitationCodeController() {
  return new RevokeInvitationCodeController();
}
