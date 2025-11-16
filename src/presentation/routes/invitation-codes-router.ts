import express from 'express';

import { adaptController } from '../adapters/express-adapter.js';
import {
  makeCreateInvitationCodeController,
  makeListInvitationCodesController,
  makeRevokeInvitationCodeController,
} from '../../main/factories/make-invitation-code-controllers.js';
import { requireManager } from '../middlewares/authorize.js';

export const invitationCodesRouter = express.Router();

invitationCodesRouter.post(
  '/',
  requireManager,
  adaptController(makeCreateInvitationCodeController()),
);
invitationCodesRouter.get(
  '/',
  requireManager,
  adaptController(makeListInvitationCodesController()),
);
invitationCodesRouter.delete(
  '/:id',
  requireManager,
  adaptController(makeRevokeInvitationCodeController()),
);
